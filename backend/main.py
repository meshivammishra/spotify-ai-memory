from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import os
import json
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone, timedelta
import math
import uuid
import logging

from pwdlib import PasswordHash
from jose import jwt

from neo4j import GraphDatabase
from google import genai

from embeddings.embedder import create_embedding


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("spotify_ai_memory")


# ============================================================
# CONFIGURATION CHECK
# ============================================================

if not NEO4J_URI:
    raise RuntimeError("NEO4J_URI is missing from .env")

if not NEO4J_USERNAME:
    raise RuntimeError("NEO4J_USERNAME is missing from .env")

if not NEO4J_PASSWORD:
    raise RuntimeError("NEO4J_PASSWORD is missing from .env")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")


# ============================================================
# DUPLICATE DETECTION CONFIGURATION
# ============================================================

DUPLICATE_SIMILARITY_THRESHOLD = 0.88
DUPLICATE_CANDIDATE_K = 100


# ============================================================
# AUTHENTICATION CONFIGURATION
# ============================================================

password_hash = PasswordHash.recommended()


# ============================================================
# GEMINI CLIENT
# ============================================================

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# NEO4J CONNECTION
# ============================================================

try:

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(
            NEO4J_USERNAME,
            NEO4J_PASSWORD
        )
    )

    driver.verify_connectivity()

    logger.info("Neo4j connection successful")

except Exception as e:

    logger.error(
        "Neo4j connection failed: %s",
        e
    )

    raise RuntimeError(
        f"Unable to connect to Neo4j: {e}"
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Spotify AI Memory",
    description=(
        "Personalized AI Memory System using "
        "Neo4j, Vector Search and Gemini"
    ),
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = Path(__file__).parent.parent

DATA_FILE = (
    BASE_DIR /
    "data" /
    "interactions.json"
)


# ============================================================
# PYDANTIC MODELS
# ============================================================

class UserCreateRequest(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        description="User name"
    )


class RegisterRequest(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        description="User name"
    )

    email: str = Field(
        ...,
        min_length=5,
        description="User email"
    )

    password: str = Field(
        ...,
        min_length=6,
        description="User password"
    )


class LoginRequest(BaseModel):

    email: str = Field(
        ...,
        min_length=5,
        description="User email"
    )

    password: str = Field(
        ...,
        min_length=1,
        description="User password"
    )


class MemorySearchRequest(BaseModel):

    query: str = Field(
        ...,
        min_length=1,
        description="Search query"
    )

    top_k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of relevant memories"
    )


class AskRequest(BaseModel):

    question: str = Field(
        ...,
        min_length=1,
        description="Question about user's memories"
    )


class SaveMemoryRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        description="Memory text"
    )


class MemoryUpdateRequest(BaseModel):

    fact: str = Field(
        ...,
        min_length=1
    )

    value: str = Field(
        ...,
        min_length=1
    )


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def load_interactions():

    if not DATA_FILE.exists():

        raise FileNotFoundError(
            f"Interaction file not found: {DATA_FILE}"
        )

    with open(
        DATA_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


# ============================================================
# JWT TOKEN CREATION
# ============================================================

def create_access_token(user_id: str):

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": user_id,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return token


# ============================================================
# MEMORY IMPORTANCE
# ============================================================

def calculate_importance(
    memory_type: str,
    confidence: float,
    source: str
):

    type_weight = {

        "personal": 0.90,
        "preference": 0.80,
        "episodic": 0.50
    }

    source_weight = {

        "user_input": 1.00,
        "listening_history": 0.70
    }

    type_score = type_weight.get(
        memory_type,
        0.50
    )

    source_score = source_weight.get(
        source,
        0.50
    )

    importance = (

        0.60 * confidence
        + 0.25 * type_score
        + 0.15 * source_score
    )

    return round(
        min(
            max(
                importance,
                0.0
            ),
            1.0
        ),
        2
    )


# ============================================================
# RECENCY SCORE
# ============================================================

def calculate_recency_score(created_at):

    if not created_at:
        return 0.5

    try:

        created_time = datetime.fromisoformat(
            created_at.replace(
                "Z",
                "+00:00"
            )
        )

        if created_time.tzinfo is None:

            created_time = created_time.replace(
                tzinfo=timezone.utc
            )

        now = datetime.now(
            timezone.utc
        )

        age_days = (
            now - created_time
        ).total_seconds() / 86400

        recency = math.exp(
            -age_days / 30
        )

        return round(
            max(
                0.0,
                min(
                    recency,
                    1.0
                )
            ),
            4
        )

    except Exception:

        return 0.5


# ============================================================
# USER EXISTENCE CHECK
# ============================================================

def user_exists(user_id: str):

    try:

        with driver.session() as session:

            result = session.run(
                """
                MATCH (u:User {
                    user_id: $user_id
                })

                RETURN count(u) AS count
                """,

                user_id=user_id
            )

            record = result.single()

            return record["count"] > 0

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"User check failed: {e}"
        )


# ============================================================
# GET USER INTERACTIONS
# ============================================================

def get_user_interactions(
    user_id: str
):

    interactions = load_interactions()

    return [

        interaction

        for interaction in interactions

        if interaction.get("user_id") == user_id
    ]


# ============================================================
# BUILD MEMORY FROM LISTENING HISTORY
# ============================================================

def build_memory(
    user_id: str,
    user_data: list
):

    artists = Counter(

        interaction.get("artist")

        for interaction in user_data

        if interaction.get("artist")
    )

    genres = Counter(

        interaction.get("genre")

        for interaction in user_data

        if interaction.get("genre")
    )

    contexts = Counter(

        interaction.get("context")

        for interaction in user_data

        if interaction.get("context")
    )

    tracks = Counter(

        interaction.get("track")

        for interaction in user_data

        if interaction.get("track")
    )

    favorite_artist = (

        artists.most_common(1)[0][0]

        if artists
        else None
    )

    favorite_genre = (

        genres.most_common(1)[0][0]

        if genres
        else None
    )

    preferred_context = (

        contexts.most_common(1)[0][0]

        if contexts
        else None
    )

    most_played_track = (

        tracks.most_common(1)[0][0]

        if tracks
        else None
    )

    total = len(user_data)

    artist_confidence = (

        artists[favorite_artist] / total

        if favorite_artist and total
        else 0
    )

    genre_confidence = (

        genres[favorite_genre] / total

        if favorite_genre and total
        else 0
    )

    context_confidence = (

        contexts[preferred_context] / total

        if preferred_context and total
        else 0
    )

    track_confidence = (

        tracks[most_played_track] / total

        if most_played_track and total
        else 0
    )

    artist_importance = calculate_importance(
        "preference",
        artist_confidence,
        "listening_history"
    )

    genre_importance = calculate_importance(
        "preference",
        genre_confidence,
        "listening_history"
    )

    context_importance = calculate_importance(
        "preference",
        context_confidence,
        "listening_history"
    )

    track_importance = calculate_importance(
        "episodic",
        track_confidence,
        "listening_history"
    )

    memories = []

    # --------------------------------------------------------
    # ARTIST
    # --------------------------------------------------------

    if favorite_artist:

        memories.append({

            "memory_id":
                f"{user_id}_artist_001",

            "type":
                "preference",

            "fact":
                f"User frequently listens to {favorite_artist}",

            "value":
                favorite_artist,

            "confidence":
                round(
                    artist_confidence,
                    2
                ),

            "importance":
                artist_importance,

            "source":
                "listening_history",

            "created_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "status":
                "active"
        })

    # --------------------------------------------------------
    # GENRE
    # --------------------------------------------------------

    if favorite_genre:

        memories.append({

            "memory_id":
                f"{user_id}_genre_001",

            "type":
                "preference",

            "fact":
                f"User frequently listens to {favorite_genre} music",

            "value":
                favorite_genre,

            "confidence":
                round(
                    genre_confidence,
                    2
                ),

            "importance":
                genre_importance,

            "source":
                "listening_history",

            "created_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "status":
                "active"
        })

    # --------------------------------------------------------
    # CONTEXT
    # --------------------------------------------------------

    if preferred_context:

        memories.append({

            "memory_id":
                f"{user_id}_context_001",

            "type":
                "preference",

            "fact":
                f"User often listens during {preferred_context}",

            "value":
                preferred_context,

            "confidence":
                round(
                    context_confidence,
                    2
                ),

            "importance":
                context_importance,

            "source":
                "listening_history",

            "created_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "status":
                "active"
        })

    # --------------------------------------------------------
    # TRACK
    # --------------------------------------------------------

    if most_played_track:

        memories.append({

            "memory_id":
                f"{user_id}_track_001",

            "type":
                "episodic",

            "fact":
                f"User frequently played {most_played_track}",

            "value":
                most_played_track,

            "confidence":
                round(
                    track_confidence,
                    2
                ),

            "importance":
                track_importance,

            "source":
                "listening_history",

            "created_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "status":
                "active"
        })

    return {

        "user_id":
            user_id,

        "total_interactions":
            total,

        "generated_at":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "memories":
            memories
    }


# ============================================================
# SAVE GENERATED MEMORIES TO NEO4J
# ============================================================

def save_memory_to_neo4j(
    memory: dict
):

    neo4j_memories = []

    for item in memory["memories"]:

        text = (
            f"{item.get('type', '')}: "
            f"{item.get('fact', '')}"
        )

        embedding = create_embedding(
            text
        )

        neo4j_memories.append({

            **item,

            "embedding":
                embedding
        })

    try:

        with driver.session() as session:

            session.run(
                """
                MERGE (u:User {
                    user_id: $user_id
                })

                WITH u

                UNWIND $memories AS m

                MERGE (
                    mem:Memory {
                        memory_id: m.memory_id
                    }
                )

                SET
                    mem.type = m.type,
                    mem.fact = m.fact,
                    mem.value = m.value,
                    mem.confidence = m.confidence,
                    mem.importance = m.importance,
                    mem.source = m.source,
                    mem.created_at = m.created_at,
                    mem.status = m.status,
                    mem.embedding = m.embedding

                MERGE
                    (u)-[:HAS_MEMORY]->(mem)
                """,

                user_id=memory["user_id"],
                memories=neo4j_memories
            )

        logger.info(
            "Memory saved to Neo4j successfully"
        )

    except Exception as e:

        logger.error(
            "Failed to save memory to Neo4j: %s",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save memory to Neo4j: "
                f"{e}"
            )
        )


# ============================================================
# DUPLICATE / SIMILAR MEMORY DETECTION
# ============================================================

def find_similar_memory(
    user_id: str,
    embedding: list,
    threshold: float = DUPLICATE_SIMILARITY_THRESHOLD,
    exclude_memory_id: str = None
):

    try:

        with driver.session() as session:

            result = session.run(
                """
                CALL db.index.vector.queryNodes(
                    'memory_embedding_index',
                    $candidate_k,
                    $embedding
                )
                YIELD node, score

                MATCH (
                    u:User {
                        user_id: $user_id
                    }
                )-[:HAS_MEMORY]->(node)

                WHERE
                    node.status = 'active'
                    AND (
                        $exclude_memory_id IS NULL
                        OR node.memory_id <> $exclude_memory_id
                    )

                RETURN
                    node.memory_id AS memory_id,
                    node.type AS type,
                    node.fact AS fact,
                    node.value AS value,
                    node.confidence AS confidence,
                    node.importance AS importance,
                    node.source AS source,
                    node.created_at AS created_at,
                    node.status AS status,
                    score

                ORDER BY score DESC
                """,

                user_id=user_id,

                candidate_k=DUPLICATE_CANDIDATE_K,

                embedding=embedding,

                exclude_memory_id=exclude_memory_id
            )

            records = list(result)

            if not records:
                return None

            best = records[0]

            similarity = float(
                best["score"] or 0.0
            )

            if similarity >= threshold:

                return {

                    "memory_id":
                        best["memory_id"],

                    "type":
                        best["type"],

                    "fact":
                        best["fact"],

                    "value":
                        best["value"],

                    "confidence":
                        best["confidence"],

                    "importance":
                        best["importance"],

                    "source":
                        best["source"],

                    "created_at":
                        best["created_at"],

                    "status":
                        best["status"],

                    "similarity":
                        similarity
                }

            return None

    except Exception as e:

        logger.warning(
            "Similar memory check failed: %s",
            e
        )

        return None


# ============================================================
# SAVE ONE MANUAL MEMORY
# ============================================================

def save_manual_memory(
    user_id: str,
    text: str
):

    text = text.strip()

    if not text:

        raise HTTPException(
            status_code=400,
            detail="Memory text cannot be empty"
        )

    memory_id = (
        f"{user_id}_manual_"
        f"{uuid.uuid4().hex[:12]}"
    )

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    memory = {

        "memory_id":
            memory_id,

        "type":
            "personal",

        "fact":
            text,

        "value":
            text,

        "confidence":
            1.0,

        "importance":
            calculate_importance(
                "personal",
                1.0,
                "user_input"
            ),

        "source":
            "user_input",

        "created_at":
            created_at,

        "updated_at":
            created_at,

        "version":
            1,

        "status":
            "active"
    }

    embedding_text = (
        f"personal: {text}"
    )

    embedding = create_embedding(
        embedding_text
    )

    similar_memory = find_similar_memory(

        user_id=user_id,

        embedding=embedding,

        threshold=DUPLICATE_SIMILARITY_THRESHOLD
    )

    if similar_memory:

        logger.info(
            "Duplicate/similar memory detected: %s",
            similar_memory["memory_id"]
        )

        return {

            "memory_id":
                similar_memory["memory_id"],

            "type":
                similar_memory["type"],

            "fact":
                similar_memory["fact"],

            "value":
                similar_memory["value"],

            "confidence":
                similar_memory["confidence"],

            "importance":
                similar_memory["importance"],

            "source":
                similar_memory["source"],

            "created_at":
                similar_memory["created_at"],

            "status":
                similar_memory["status"],

            "duplicate":
                True,

            "similarity":
                round(
                    similar_memory["similarity"],
                    4
                )
        }

    try:

        with driver.session() as session:

            session.run(
                """
                MERGE (u:User {
                    user_id: $user_id
                })

                MERGE (
                    m:Memory {
                        memory_id: $memory_id
                    }
                )

                SET
                    m.type = $type,
                    m.fact = $fact,
                    m.value = $value,
                    m.confidence = $confidence,
                    m.importance = $importance,
                    m.source = $source,
                    m.created_at = $created_at,
                    m.status = $status,
                    m.embedding = $embedding

                MERGE
                    (u)-[:HAS_MEMORY]->(m)
                """,

                user_id=user_id,

                memory_id=memory_id,

                type=memory["type"],

                fact=memory["fact"],

                value=memory["value"],

                confidence=memory["confidence"],

                importance=memory["importance"],

                source=memory["source"],

                created_at=memory["created_at"],

                status=memory["status"],

                embedding=embedding
            )

        return {

            **memory,

            "duplicate":
                False,

            "similarity":
                None
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save manual memory: "
                f"{e}"
            )
        )


# ============================================================
# SEMANTIC SEARCH
# ============================================================

def semantic_search(
    user_id: str,
    query: str,
    top_k: int
):

    query_embedding = create_embedding(
        query
    )

    candidate_k = max(
        top_k * 5,
        10
    )

    with driver.session() as session:

        result = session.run(
            """
            CALL db.index.vector.queryNodes(
                'memory_embedding_index',
                $candidate_k,
                $query_embedding
            )
            YIELD node, score

            MATCH (
                u:User {
                    user_id: $user_id
                }
            )-[:HAS_MEMORY]->(node)

            WHERE node.status = 'active'

            RETURN
                node.memory_id AS memory_id,
                node.type AS type,
                node.fact AS fact,
                node.value AS value,
                node.confidence AS confidence,
                node.importance AS importance,
                node.source AS source,
                node.created_at AS created_at,
                node.status AS status,
                score

            ORDER BY score DESC
            """,

            user_id=user_id,

            candidate_k=candidate_k,

            query_embedding=query_embedding
        )

        memories = [
            record.data()
            for record in result
        ]

    ranked_memories = []

    for memory in memories:

        similarity = float(
            memory.get("score") or 0.0
        )

        confidence = float(
            memory.get("confidence") or 0.0
        )

        importance = float(
            memory.get("importance") or 0.0
        )

        recency = calculate_recency_score(
            memory.get("created_at")
        )

        final_score = (

            0.65 * similarity
            + 0.15 * importance
            + 0.10 * confidence
            + 0.10 * recency
        )

        memory["similarity_score"] = round(
            similarity,
            4
        )

        memory["recency_score"] = round(
            recency,
            4
        )

        memory["final_score"] = round(
            final_score,
            4
        )

        ranked_memories.append(
            memory
        )

    ranked_memories.sort(
        key=lambda x: x["final_score"],
        reverse=True
    )

    return ranked_memories[:top_k]


# ============================================================
# CONTEXT BUILDER
# ============================================================

def build_memory_context(
    memories: list,
    max_memories: int = 5
):

    if not memories:

        return (
            "No relevant stored memories "
            "were found."
        )

    selected_memories = memories[:max_memories]

    context_parts = []

    for index, memory in enumerate(
        selected_memories,
        start=1
    ):

        fact = memory.get(
            "fact",
            ""
        )

        value = memory.get(
            "value",
            ""
        )

        memory_type = memory.get(
            "type",
            "unknown"
        )

        confidence = memory.get(
            "confidence",
            0.0
        )

        importance = memory.get(
            "importance",
            0.0
        )

        similarity = memory.get(
            "similarity_score",
            0.0
        )

        recency = memory.get(
            "recency_score",
            0.0
        )

        source = memory.get(
            "source",
            "unknown"
        )

        context_parts.append(
            f"""
Memory {index}:
Type: {memory_type}
Fact: {fact}
Value: {value}
Confidence: {confidence}
Importance: {importance}
Similarity: {similarity}
Recency: {recency}
Source: {source}
""".strip()
        )

    return "\n\n".join(
        context_parts
    )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {

        "message":
            "Spotify AI Memory API is running",

        "status":
            "healthy",

        "phase":
            "Phase 3 - Multi User"
    }


# ============================================================
# REGISTER USER
# ============================================================

@app.post("/auth/register")
def register_user(
    request: RegisterRequest
):

    name = request.name.strip()

    email = (
        request.email
        .strip()
        .lower()
    )

    password = request.password

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty"
        )

    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                "6 characters"
            )
        )

    try:

        with driver.session() as session:

            existing_user = session.run(
                """
                MATCH (u:User {
                    email: $email
                })

                RETURN u.user_id AS user_id
                """,

                email=email
            ).single()

            if existing_user:

                raise HTTPException(
                    status_code=409,
                    detail="Email already registered"
                )

            user_id = (
                f"user_"
                f"{uuid.uuid4().hex[:8]}"
            )

            created_at = datetime.now(
                timezone.utc
            ).isoformat()

            password_hash_value = (
                password_hash.hash(password)
            )

            result = session.run(
                """
                CREATE (u:User {
                    user_id: $user_id,
                    name: $name,
                    email: $email,
                    password_hash: $password_hash,
                    created_at: $created_at
                })

                RETURN
                    u.user_id AS user_id,
                    u.name AS name,
                    u.email AS email,
                    u.created_at AS created_at
                """,

                user_id=user_id,

                name=name,

                email=email,

                password_hash=password_hash_value,

                created_at=created_at
            )

            record = result.single()

            return {

                "message":
                    "User registered successfully",

                "user":
                    record.data()
            }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "User registration failed: "
                f"{e}"
            )
        )


# ============================================================
# LOGIN USER
# ============================================================

@app.post("/auth/login")
def login_user(
    request: LoginRequest
):

    email = (
        request.email
        .strip()
        .lower()
    )

    password = request.password

    try:

        with driver.session() as session:

            result = session.run(
                """
                MATCH (u:User {
                    email: $email
                })

                RETURN
                    u.user_id AS user_id,
                    u.name AS name,
                    u.email AS email,
                    u.password_hash AS password_hash
                """,

                email=email
            )

            record = result.single()

            if not record:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            stored_password_hash = (
                record["password_hash"]
            )

            if not stored_password_hash:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            password_valid = (
                password_hash.verify(
                    password,
                    stored_password_hash
                )
            )

            if not password_valid:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            access_token = create_access_token(
                record["user_id"]
            )

            return {

                "message":
                    "Login successful",

                "access_token":
                    access_token,

                "token_type":
                    "bearer",

                "expires_in":
                    ACCESS_TOKEN_EXPIRE_MINUTES * 60,

                "user": {

                    "user_id":
                        record["user_id"],

                    "name":
                        record["name"],

                    "email":
                        record["email"]
                }
            }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Login failed: "
                f"{e}"
            )
        )


# ============================================================
# CREATE USER
# ============================================================

@app.post("/users")
def create_user(
    request: UserCreateRequest
):

    name = request.name.strip()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="User name cannot be empty"
        )

    user_id = (
        f"user_"
        f"{uuid.uuid4().hex[:8]}"
    )

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    try:

        with driver.session() as session:

            result = session.run(
                """
                CREATE (u:User {
                    user_id: $user_id,
                    name: $name,
                    created_at: $created_at
                })

                RETURN
                    u.user_id AS user_id,
                    u.name AS name,
                    u.created_at AS created_at
                """,

                user_id=user_id,

                name=name,

                created_at=created_at
            )

            record = result.single()

            return {

                "message":
                    "User created successfully",

                "user":
                    record.data()
            }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "User creation failed: "
                f"{e}"
            )
        )


# ============================================================
# GET ALL USERS
# ============================================================

@app.get("/users")
def get_users():

    try:

        with driver.session() as session:

            result = session.run(
                """
                MATCH (u:User)

                RETURN
                    u.user_id AS user_id,
                    u.name AS name,
                    u.email AS email,
                    u.created_at AS created_at

                ORDER BY u.created_at
                """
            )

            users = [
                record.data()
                for record in result
            ]

            return {

                "count":
                    len(users),

                "users":
                    users
            }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to get users: "
                f"{e}"
            )
        )


# ============================================================
# GET ALL INTERACTIONS
# ============================================================

@app.get("/interactions")
def get_interactions():

    interactions = load_interactions()

    return {

        "count":
            len(interactions),

        "interactions":
            interactions
    }


# ============================================================
# GET USER INTERACTIONS
# ============================================================

@app.get("/interactions/{user_id}")
def get_user_interactions_endpoint(
    user_id: str
):

    user_data = get_user_interactions(
        user_id
    )

    return {

        "user_id":
            user_id,

        "count":
            len(user_data),

        "interactions":
            user_data
    }


# ============================================================
# GET SAVED MEMORIES
# ============================================================

@app.get("/memory/{user_id}")
def get_saved_memory(
    user_id: str
):

    try:

        with driver.session() as session:

            result = session.run(
                """
                MATCH (
                    u:User {
                        user_id: $user_id
                    }
                )-[:HAS_MEMORY]->(
                    m:Memory
                )

                RETURN
                    u.user_id AS user_id,

                    collect({
                        memory_id: m.memory_id,
                        type: m.type,
                        fact: m.fact,
                        value: m.value,
                        confidence: m.confidence,
                        importance: m.importance,
                        source: m.source,
                        created_at: m.created_at,
                        status: m.status
                    }) AS memories
                """,

                user_id=user_id
            )

            record = result.single()

            if not record:

                return {

                    "user_id":
                        user_id,

                    "message":
                        "No saved memory found",

                    "memories":
                        []
                }

            return {

                "user_id":
                    record["user_id"],

                "memories":
                    record["memories"]
            }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to get memory: "
                f"{e}"
            )
        )


# ============================================================
# SAVE MANUAL MEMORY
# ============================================================

@app.post("/memory/{user_id}/save")
def save_user_memory(
    user_id: str,
    request: SaveMemoryRequest
):

    try:

        memory = save_manual_memory(

            user_id=user_id,

            text=request.text
        )

        if memory.get("duplicate"):

            return {

                "message":
                    "Similar memory already exists",

                "user_id":
                    user_id,

                "memory":
                    memory
            }

        return {

            "message":
                "Memory saved successfully",

            "user_id":
                user_id,

            "memory":
                memory
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Memory save failed: "
                f"{e}"
            )
        )


# ============================================================
# GENERATE MEMORIES FROM LISTENING HISTORY
# ============================================================

@app.post("/memory/{user_id}/generate")
def generate_user_memory(
    user_id: str
):

    user_data = get_user_interactions(
        user_id
    )

    if not user_data:

        return {

            "user_id":
                user_id,

            "message":
                "No interactions found",

            "memories":
                []
        }

    memory = build_memory(
        user_id,
        user_data
    )

    save_memory_to_neo4j(
        memory
    )

    return {

        "message":
            "User memory generated successfully",

        "memory":
            memory
    }


# ============================================================
# SEMANTIC MEMORY SEARCH
# ============================================================

@app.post("/memory/{user_id}/search")
def search_memory(
    user_id: str,
    request: MemorySearchRequest
):

    try:

        memories = semantic_search(

            user_id=user_id,

            query=request.query,

            top_k=request.top_k
        )

        return {

            "user_id":
                user_id,

            "query":
                request.query,

            "count":
                len(memories),

            "relevant_memories":
                memories
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Memory search failed: "
                f"{e}"
            )
        )


# ============================================================
# ASK MEMORY — RAG + GEMINI
# ============================================================

@app.post("/memory/{user_id}/ask")
def ask_memory(
    user_id: str,
    request: AskRequest
):

    try:

        relevant_memories = semantic_search(

            user_id=user_id,

            query=request.question,

            top_k=3
        )

        context = build_memory_context(
            relevant_memories,
            max_memories=5
        )

        prompt = f"""
You are Spotify AI Memory Assistant.

Use the user's stored memories to answer
the question.

USER MEMORIES:
{context}

USER QUESTION:
{request.question}

RULES:
- Use the memories when they are relevant.
- Do not invent personal memories.
- If the memories do not contain enough information,
  clearly say that.
- Give a natural and helpful answer.
"""

        response = gemini_client.models.generate_content(

            model="models/gemini-3.6-flash",

            contents=prompt
        )

        return {

            "user_id":
                user_id,

            "question":
                request.question,

            "relevant_memories":
                relevant_memories,

            "answer":
                response.text
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Ask Memory failed: "
                f"{e}"
            )
        )


# ============================================================
# UPDATE MEMORY
# ============================================================

@app.put("/memory/{user_id}/{memory_id}")
def update_memory(
    user_id: str,
    memory_id: str,
    request: MemoryUpdateRequest
):

    try:

        with driver.session() as session:

            existing = session.run(
                """
                MATCH (
                    u:User {
                        user_id: $user_id
                    }
                )-[:HAS_MEMORY]->(
                    m:Memory {
                        memory_id: $memory_id
                    }
                )

                RETURN
                    m.type AS type,
                    m.confidence AS confidence,
                    m.source AS source,
                    m.importance AS importance
                """,

                user_id=user_id,

                memory_id=memory_id
            ).single()

            if not existing:

                return {

                    "user_id":
                        user_id,

                    "memory_id":
                        memory_id,

                    "message":
                        "Memory not found"
                }

            memory_type = existing["type"]

            text = (
                f"{memory_type}: "
                f"{request.fact}"
            )

            embedding = create_embedding(
                text
            )

            importance = calculate_importance(

                memory_type,

                existing["confidence"]
                if existing["confidence"] is not None
                else 0.5,

                existing["source"]
                if existing["source"] is not None
                else "user_input"
            )

            similar_memory = find_similar_memory(

                user_id=user_id,

                embedding=embedding,

                threshold=DUPLICATE_SIMILARITY_THRESHOLD,

                exclude_memory_id=memory_id
            )

            if similar_memory:

                return {

                    "message":
                        "Similar memory already exists",

                    "user_id":
                        user_id,

                    "memory_id":
                        memory_id,

                    "duplicate":
                        True,

                    "similar_memory":
                        similar_memory
                }

            result = session.run(
                """
                MATCH (
                    u:User {
                        user_id: $user_id
                    }
                )-[:HAS_MEMORY]->(
                    m:Memory {
                        memory_id: $memory_id
                    }
                )

                SET
                    m.fact = $fact,
                    m.value = $value,
                    m.importance = $importance,
                    m.embedding = $embedding,
                    m.updated_at = $updated_at

                RETURN
                    m.memory_id AS memory_id,
                    m.type AS type,
                    m.fact AS fact,
                    m.value AS value,
                    m.confidence AS confidence,
                    m.importance AS importance,
                    m.source AS source,
                    m.created_at AS created_at,
                    m.updated_at AS updated_at,
                    m.status AS status
                """,

                user_id=user_id,

                memory_id=memory_id,

                fact=request.fact,

                value=request.value,

                importance=importance,

                embedding=embedding,

                updated_at=datetime.now(
                    timezone.utc
                ).isoformat()
            )

            record = result.single()

            if not record:

                return {

                    "user_id":
                        user_id,

                    "memory_id":
                        memory_id,

                    "message":
                        "Memory not found"
                }

            return {

                "message":
                    "Memory updated successfully",

                "duplicate":
                    False,

                "memory":
                    record.data()
            }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Memory update failed: "
                f"{e}"
            )
        )


# ============================================================
# DELETE MEMORY
# ============================================================

@app.delete("/memory/{user_id}/{memory_id}")
def delete_memory(
    user_id: str,
    memory_id: str
):

    try:

        with driver.session() as session:

            result = session.run(
                """
                MATCH (
                    u:User {
                        user_id: $user_id
                    }
                )-[:HAS_MEMORY]->(
                    m:Memory {
                        memory_id: $memory_id
                    }
                )

                DETACH DELETE m

                RETURN count(m) AS deleted
                """,

                user_id=user_id,

                memory_id=memory_id
            )

            record = result.single()

            if record["deleted"] == 0:

                return {

                    "user_id":
                        user_id,

                    "memory_id":
                        memory_id,

                    "message":
                        "Memory not found"
                }

            return {

                "message":
                    "Memory deleted successfully",

                "user_id":
                    user_id,

                "memory_id":
                    memory_id
            }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Memory deletion failed: "
                f"{e}"
            )
        )
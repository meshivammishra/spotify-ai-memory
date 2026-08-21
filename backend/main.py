from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import os
import json
from pathlib import Path
from collections import Counter
from datetime import datetime
import uuid

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

    print("✅ Neo4j connection successful!")

except Exception as e:

    print("❌ Neo4j connection failed:", e)

    raise RuntimeError(
        f"Unable to connect to Neo4j: {e}"
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Spotify AI Memory",
    description="Personalized AI Memory System using Neo4j, Vector Search and Gemini",
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
# GET USER INTERACTIONS
# ============================================================

def get_user_interactions(user_id: str):

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

    memories = []

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
                round(artist_confidence, 2),

            "source":
                "listening_history",

            "created_at":
                datetime.now().isoformat(),

            "status":
                "active"
        })

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
                round(genre_confidence, 2),

            "source":
                "listening_history",

            "created_at":
                datetime.now().isoformat(),

            "status":
                "active"
        })

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
                round(context_confidence, 2),

            "source":
                "listening_history",

            "created_at":
                datetime.now().isoformat(),

            "status":
                "active"
        })

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
                round(track_confidence, 2),

            "source":
                "listening_history",

            "created_at":
                datetime.now().isoformat(),

            "status":
                "active"
        })

    return {

        "user_id":
            user_id,

        "total_interactions":
            total,

        "generated_at":
            datetime.now().isoformat(),

        "memories":
            memories
    }


# ============================================================
# SAVE MEMORIES TO NEO4J
# ============================================================

def save_memory_to_neo4j(memory: dict):

    neo4j_memories = []

    for item in memory["memories"]:

        text = (
            f"{item.get('type', '')}: "
            f"{item.get('fact', '')}"
        )

        embedding = create_embedding(text)

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

        print(
            "✅ Memory saved to Neo4j successfully!"
        )

    except Exception as e:

        print(
            "❌ Failed to save memory to Neo4j:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save memory to Neo4j: {e}"
        )


# ============================================================
# SAVE ONE MANUAL MEMORY
# ============================================================

def save_manual_memory(
    user_id: str,
    text: str
):

    memory_id = (
        f"{user_id}_manual_"
        f"{uuid.uuid4().hex[:12]}"
    )

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

        "source":
            "user_input",

        "created_at":
            datetime.now().isoformat(),

        "status":
            "active"
    }

    embedding_text = (
        f"personal: {text}"
    )

    embedding = create_embedding(
        embedding_text
    )

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

                source=memory["source"],

                created_at=memory["created_at"],

                status=memory["status"],

                embedding=embedding
            )

        return memory

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save manual memory: {e}"
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

            RETURN
                node.memory_id AS memory_id,
                node.type AS type,
                node.fact AS fact,
                node.value AS value,
                node.confidence AS confidence,
                node.source AS source,
                node.created_at AS created_at,
                node.status AS status,
                score

            ORDER BY score DESC

            LIMIT $top_k
            """,

            user_id=user_id,

            candidate_k=candidate_k,

            top_k=top_k,

            query_embedding=query_embedding
        )

        return [
            record.data()
            for record in result
        ]


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {

        "message":
            "Spotify AI Memory API is running",

        "status":
            "healthy"
    }


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
            detail=f"Failed to get memory: {e}"
        )


# ============================================================
# SAVE MANUAL MEMORY FROM FRONTEND
# ============================================================

@app.post("/memory/{user_id}/save")
def save_user_memory(
    user_id: str,
    request: SaveMemoryRequest
):

    try:

        memory = save_manual_memory(
            user_id=user_id,
            text=request.text.strip()
        )

        return {

            "message":
                "Memory saved successfully",

            "user_id":
                user_id,

            "memory":
                memory
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Memory save failed: {e}"
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
            detail=f"Memory search failed: {e}"
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

        # ----------------------------------------------------
        # 1. Semantic search
        # ----------------------------------------------------

        relevant_memories = semantic_search(
            user_id=user_id,

            query=request.question,

            top_k=3
        )

        # ----------------------------------------------------
        # 2. Build context
        # ----------------------------------------------------

        if relevant_memories:

            context = "\n".join(
                [
                    f"- {memory.get('fact', '')}"
                    for memory in relevant_memories
                ]
            )

        else:

            context = (
                "No relevant stored memories "
                "were found."
            )

        # ----------------------------------------------------
        # 3. Prompt
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # 4. Gemini
        # ----------------------------------------------------

        response = gemini_client.models.generate_content(
            model="models/gemini-3.6-flash",
            contents=prompt
        )

        # ----------------------------------------------------
        # 5. Return response
        # ----------------------------------------------------

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
            detail=f"Ask Memory failed: {e}"
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

            # ------------------------------------------------
            # Find existing memory
            # ------------------------------------------------

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
                    m.type AS type
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

            # ------------------------------------------------
            # New embedding
            # ------------------------------------------------

            text = (
                f"{memory_type}: "
                f"{request.fact}"
            )

            embedding = create_embedding(
                text
            )

            # ------------------------------------------------
            # Update memory
            # ------------------------------------------------

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
                    m.embedding = $embedding

                RETURN
                    m.memory_id AS memory_id,
                    m.type AS type,
                    m.fact AS fact,
                    m.value AS value,
                    m.confidence AS confidence,
                    m.source AS source,
                    m.created_at AS created_at,
                    m.status AS status
                """,

                user_id=user_id,

                memory_id=memory_id,

                fact=request.fact,

                value=request.value,

                embedding=embedding
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

                "memory":
                    record.data()
            }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Memory update failed: {e}"
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
            detail=f"Memory deletion failed: {e}"
        )
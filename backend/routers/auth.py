from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)


def create_auth_router(
    driver,
    password_hash,
    create_access_token,
    access_token_expire_minutes,
):
    router = APIRouter(prefix="/auth", tags=["Authentication"])

    @router.post("/register")
    def register_user(request: RegisterRequest):
        name = request.name.strip()
        email = request.email.strip().lower()
        password = request.password

        if not name:
            raise HTTPException(400, "Name cannot be empty")

        if not email:
            raise HTTPException(400, "Email cannot be empty")

        if len(password) < 6:
            raise HTTPException(
                400, "Password must be at least 6 characters"
            )

        try:
            with driver.session() as session:
                existing_user = session.run(
                    """
                    MATCH (u:User {email: $email})
                    RETURN u.user_id AS user_id
                    """,
                    email=email,
                ).single()

                if existing_user:
                    raise HTTPException(
                        409, "Email already registered"
                    )

                user_id = f"user_{uuid.uuid4().hex[:8]}"
                created_at = datetime.now(timezone.utc).isoformat()
                hashed_password = password_hash.hash(password)

                record = session.run(
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
                    password_hash=hashed_password,
                    created_at=created_at,
                ).single()

                return {
                    "message": "User registered successfully",
                    "user": record.data(),
                }

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                500, "User registration failed"
            )

    @router.post("/login")
    def login_user(request: LoginRequest):
        email = request.email.strip().lower()
        password = request.password

        try:
            with driver.session() as session:
                record = session.run(
                    """
                    MATCH (u:User {email: $email})
                    RETURN
                        u.user_id AS user_id,
                        u.name AS name,
                        u.email AS email,
                        u.password_hash AS password_hash
                    """,
                    email=email,
                ).single()

                if not record or not record["password_hash"]:
                    raise HTTPException(
                        401, "Invalid email or password"
                    )

                if not password_hash.verify(
                    password, record["password_hash"]
                ):
                    raise HTTPException(
                        401, "Invalid email or password"
                    )

                token = create_access_token(record["user_id"])

                return {
                    "message": "Login successful",
                    "access_token": token,
                    "token_type": "bearer",
                    "expires_in": access_token_expire_minutes * 60,
                    "user": {
                        "user_id": record["user_id"],
                        "name": record["name"],
                        "email": record["email"],
                    },
                }

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(500, "Login failed")

    return router
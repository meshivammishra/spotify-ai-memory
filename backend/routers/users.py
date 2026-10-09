import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field


class UserCreateRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        description="User name",
    )


def create_users_router(driver, require_admin):
    router = APIRouter(tags=["Users"])

    @router.post("/users")
    def create_user(
        request: UserCreateRequest,
        admin_id: str = Depends(require_admin),
    ):
        name = request.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="User name cannot be empty",
            )

        user_id = f"user_{uuid.uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc).isoformat()

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
                    created_at=created_at,
                )

                record = result.single()

                return {
                    "message": "User created successfully",
                    "user": record.data(),
                }

        except Exception:
            raise HTTPException(
                status_code=500,
                detail="User creation failed",
            )

    @router.get("/users")
    def get_users(
    admin_id: str = Depends(require_admin),
):
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

                users = [record.data() for record in result]

                return {
                    "count": len(users),
                    "users": users,
                }

        except Exception:
            raise HTTPException(
                status_code=500,
                detail="Failed to get users",
            )

    return router
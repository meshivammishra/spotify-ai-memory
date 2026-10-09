from fastapi import APIRouter, Depends, HTTPException


def create_interactions_router(
    get_db,
    Interaction,
    InteractionEventRequest,
    get_authenticated_user,
    load_interactions,
    get_user_interactions,
    require_admin,
    admin_user_id,
):
    router = APIRouter(tags=["Interactions"])

    @router.post("/v1/events")
    def create_event(
        request: InteractionEventRequest,
        db=Depends(get_db),
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if request.user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only create events for your own user",
            )

        if not request.consent:
            raise HTTPException(
                status_code=403,
                detail="Consent is required",
            )

        existing = (
            db.query(Interaction)
            .filter(
                Interaction.idempotency_key == request.idempotency_key
            )
            .first()
        )

        if existing:
            return {
                "message": "Event already exists",
                "duplicate": True,
                "interaction": {
                    "id": existing.id,
                    "user_id": existing.user_id,
                    "timestamp": existing.timestamp.isoformat(),
                    "type": existing.type,
                    "artist": existing.artist,
                    "track": existing.track,
                    "genre": existing.genre,
                    "context": existing.context,
                },
            }

        interaction = Interaction(
            user_id=request.user_id,
            timestamp=request.timestamp,
            type=request.type,
            artist=request.artist,
            track=request.track,
            genre=request.genre,
            context=request.context,
            subject_scope=request.subject_scope,
            consent=request.consent,
            source_event_id=request.source_event_id,
            idempotency_key=request.idempotency_key,
        )

        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        return {
            "message": "Event stored successfully",
            "duplicate": False,
            "interaction": {
                "id": interaction.id,
                "user_id": interaction.user_id,
                "timestamp": interaction.timestamp.isoformat(),
                "type": interaction.type,
                "artist": interaction.artist,
                "track": interaction.track,
                "genre": interaction.genre,
                "context": interaction.context,
            },
        }

    @router.get("/interactions")
    def get_interactions(
        db=Depends(get_db),
        admin_id: str = Depends(require_admin),
    ):
        interactions = load_interactions(db)

        return {
            "count": len(interactions),
            "interactions": interactions,
        }

    @router.get("/interactions/{user_id}")
    def get_user_interactions_endpoint(
        user_id: str,
        db=Depends(get_db),
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if (
            user_id != authenticated_user_id
            and authenticated_user_id != admin_user_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You can only access your own interactions",
            )

        user_data = get_user_interactions(db, user_id)

        return {
            "user_id": user_id,
            "count": len(user_data),
            "interactions": user_data,
        }

    return router
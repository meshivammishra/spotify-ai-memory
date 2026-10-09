from fastapi import APIRouter, Depends, HTTPException


def create_memories_router(
    driver,
    get_authenticated_user,
    SaveMemoryRequest,
    MemorySearchRequest,
    AskRequest,
    MemoryUpdateRequest,
    get_db,
    get_user_interactions,
    save_manual_memory,
    build_memory,
    save_memory_to_neo4j,
    semantic_search,
    build_memory_context,
    gemini_client,
    create_embedding,
    calculate_importance,
    find_similar_memory,
    duplicate_similarity_threshold,
    datetime,
    timezone,
    traceable,
):
    router = APIRouter(tags=["Memories"])

    @router.get("/memory/{user_id}")
    def get_saved_memory(
        user_id: str,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (u:User {user_id: $user_id})-[:HAS_MEMORY]->(m:Memory)
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
                    user_id=user_id,
                )

                record = result.single()

                if not record:
                    return {
                        "user_id": user_id,
                        "message": "No saved memory found",
                        "memories": [],
                    }

                return {
                    "user_id": record["user_id"],
                    "memories": record["memories"],
                }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get memory: {e}",
            )

    @router.post("/memory/{user_id}/save")
    def save_user_memory(
        user_id: str,
        request: SaveMemoryRequest,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            memory = save_manual_memory(
                user_id=user_id,
                text=request.text,
            )

            if memory.get("duplicate"):
                return {
                    "message": "Similar memory already exists",
                    "user_id": user_id,
                    "memory": memory,
                }

            return {
                "message": "Memory saved successfully",
                "user_id": user_id,
                "memory": memory,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Memory save failed: {e}",
            )

    @router.post("/memory/{user_id}/generate")
    def generate_user_memory(
        user_id: str,
        db=Depends(get_db),
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        user_data = get_user_interactions(db, user_id)

        if not user_data:
            return {
                "user_id": user_id,
                "message": "No interactions found",
                "memories": [],
            }

        memory = build_memory(user_id, user_data)
        save_memory_to_neo4j(memory)

        return {
            "message": "User memory generated successfully",
            "memory": memory,
        }

    @router.post("/memory/{user_id}/search")
    def search_memory(
        user_id: str,
        request: MemorySearchRequest,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            memories = semantic_search(
                user_id=user_id,
                query=request.query,
                top_k=request.top_k,
            )

            return {
                "user_id": user_id,
                "query": request.query,
                "count": len(memories),
                "relevant_memories": memories,
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Memory search failed: {e}",
            )

    @router.post("/memory/{user_id}/ask")
    @traceable(name="ask_memory_rag", run_type="chain")
    def ask_memory(
        user_id: str,
        request: AskRequest,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            relevant_memories = semantic_search(
                user_id=user_id,
                query=request.question,
                top_k=3,
            )

            context = build_memory_context(
                relevant_memories,
                max_memories=5,
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
                contents=prompt,
            )

            return {
                "user_id": user_id,
                "question": request.question,
                "relevant_memories": relevant_memories,
                "answer": response.text,
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Ask Memory failed: {e}",
            )

    @router.put("/memory/{user_id}/{memory_id}")
    def update_memory(
        user_id: str,
        memory_id: str,
        request: MemoryUpdateRequest,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            with driver.session() as session:
                existing = session.run(
                    """
                    MATCH (u:User {user_id: $user_id})-[:HAS_MEMORY]->
                          (m:Memory {memory_id: $memory_id})
                    RETURN
                        m.type AS type,
                        m.confidence AS confidence,
                        m.source AS source,
                        m.importance AS importance
                    """,
                    user_id=user_id,
                    memory_id=memory_id,
                ).single()

                if not existing:
                    return {
                        "user_id": user_id,
                        "memory_id": memory_id,
                        "message": "Memory not found",
                    }

                memory_type = existing["type"]
                text = f"{memory_type}: {request.fact}"
                embedding = create_embedding(text)

                importance = calculate_importance(
                    memory_type,
                    existing["confidence"]
                    if existing["confidence"] is not None
                    else 0.5,
                    existing["source"]
                    if existing["source"] is not None
                    else "user_input",
                )

                similar_memory = find_similar_memory(
                    user_id=user_id,
                    embedding=embedding,
                    source_text=request.fact,
                    threshold=duplicate_similarity_threshold,
                    exclude_memory_id=memory_id,
                )

                if similar_memory:
                    return {
                        "message": "Similar memory already exists",
                        "user_id": user_id,
                        "memory_id": memory_id,
                        "duplicate": True,
                        "similar_memory": similar_memory,
                    }

                result = session.run(
                    """
                    MATCH (u:User {user_id: $user_id})-[:HAS_MEMORY]->
                          (m:Memory {memory_id: $memory_id})
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
                    updated_at=datetime.now(timezone.utc).isoformat(),
                )

                record = result.single()

                if not record:
                    return {
                        "user_id": user_id,
                        "memory_id": memory_id,
                        "message": "Memory not found",
                    }

                return {
                    "message": "Memory updated successfully",
                    "duplicate": False,
                    "memory": record.data(),
                }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Memory update failed: {e}",
            )

    @router.delete("/memory/{user_id}/{memory_id}")
    def delete_memory(
        user_id: str,
        memory_id: str,
        authenticated_user_id: str = Depends(get_authenticated_user),
    ):
        if user_id != authenticated_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own memories",
            )

        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (u:User {user_id: $user_id})-[:HAS_MEMORY]->
                          (m:Memory {memory_id: $memory_id})
                    WITH m
                    DETACH DELETE m
                    RETURN count(*) AS deleted
                    """,
                    user_id=user_id,
                    memory_id=memory_id,
                )

                record = result.single()

                if record["deleted"] == 0:
                    return {
                        "user_id": user_id,
                        "memory_id": memory_id,
                        "message": "Memory not found",
                    }

                return {
                    "message": "Memory deleted successfully",
                    "user_id": user_id,
                    "memory_id": memory_id,
                }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Memory deletion failed: {e}",
            )

    return router
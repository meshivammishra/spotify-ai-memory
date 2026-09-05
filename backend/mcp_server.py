"""
Spotify Personalized AI Memory System
MCP Memory Tools

Narrow, governed tools for AI memory access.
No generic graph/database query is exposed.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field

from governance import (
    build_provenance,
    governance_decision,
    is_memory_retrievable,
    normalize_memory_text,
)


# ============================================================
# MCP TOOL SCHEMAS
# ============================================================

class SearchMemoryInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=10)


class AddExplicitPreferenceInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    preference: str = Field(..., min_length=1, max_length=500)
    source_event_id: Optional[str] = None
    idempotency_key: Optional[str] = None


class CorrectMemoryInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    memory_id: str = Field(..., min_length=1)
    correction: str = Field(..., min_length=1, max_length=500)


class DeleteMemoryInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    memory_id: str = Field(..., min_length=1)


class ExplainMemoryUseInput(BaseModel):
    user_id: str = Field(..., min_length=1)
    memory_id: str = Field(..., min_length=1)


# ============================================================
# AUDIT EVENT
# ============================================================

def create_audit_event(
    *,
    user_id: str,
    action: str,
    memory_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    return {
        "audit_id": str(uuid.uuid4()),
        "user_id": user_id,
        "memory_id": memory_id,
        "action": action,
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
        "details": details or {},
    }


# ============================================================
# SUBJECT BINDING
# ============================================================

def validate_subject(
    authenticated_user_id: str,
    requested_user_id: str,
) -> None:

    if not authenticated_user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    if authenticated_user_id != requested_user_id:
        raise HTTPException(
            status_code=403,
            detail="Subject binding violation",
        )


# ============================================================
# MCP TOOL DEFINITIONS
# ============================================================

MCP_TOOLS = [
    {
        "name": "search_memory",
        "description": (
            "Search governed user memories using semantic "
            "and relevance-based retrieval."
        ),
        "input_schema": SearchMemoryInput.model_json_schema(),
    },
    {
        "name": "add_explicit_preference",
        "description": (
            "Store an explicit user preference after "
            "policy validation."
        ),
        "input_schema":
            AddExplicitPreferenceInput.model_json_schema(),
    },
    {
        "name": "correct_memory",
        "description": (
            "Correct an existing memory. Explicit corrections "
            "take precedence over previous memory."
        ),
        "input_schema":
            CorrectMemoryInput.model_json_schema(),
    },
    {
        "name": "delete_memory",
        "description": (
            "Delete a user memory after subject authorization."
        ),
        "input_schema":
            DeleteMemoryInput.model_json_schema(),
    },
    {
        "name": "explain_memory_use",
        "description": (
            "Explain why a memory was eligible for retrieval "
            "and what provenance it carries."
        ),
        "input_schema":
            ExplainMemoryUseInput.model_json_schema(),
    },
]


# ============================================================
# TOOL REGISTRY
# ============================================================

def get_mcp_tools() -> list:
    """
    Return only the narrow memory tools.
    """

    return MCP_TOOLS


# ============================================================
# TOOL SECURITY NOTES
# ============================================================

MCP_SECURITY_POLICY = {
    "subject_binding": True,
    "generic_graph_query": False,
    "generic_cypher": False,
    "authentication_required": True,
    "authorization_required": True,
    "audit_events": True,
    "rate_limit_required": True,
    "stored_text_is_untrusted": True,
}


# ============================================================
# GOVERNED MEMORY CHECK
# ============================================================

def validate_memory_for_retrieval(
    memory: Dict[str, Any]
) -> bool:

    return is_memory_retrievable(memory)


# ============================================================
# PROVENANCE RESPONSE
# ============================================================

def explain_memory(
    memory: Dict[str, Any]
) -> Dict[str, Any]:

    if not validate_memory_for_retrieval(memory):

        return {
            "eligible": False,
            "reason": "Memory is not currently retrievable",
            "provenance":
                build_provenance(memory),
        }

    return {
        "eligible": True,
        "reason": (
            "Memory is active, policy-allowed and "
            "within its retention period."
        ),
        "provenance":
            build_provenance(memory),
    }
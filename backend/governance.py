"""
Spotify Personalized AI Memory System
Memory Governance + Policy Layer
"""

from __future__ import annotations

import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional


# ============================================================
# MEMORY TYPES
# ============================================================

MEMORY_TYPES = {
    "personal",
    "preference",
    "candidate_preference",
    "episodic",
    "exclusion",
    "correction",
}


# ============================================================
# MEMORY SOURCES
# ============================================================

MEMORY_SOURCES = {
    "user_input",
    "listening_history",
    "system",
    "correction",
}


# ============================================================
# POLICY CLASSES
# ============================================================

POLICY_STANDARD = "standard"
POLICY_SENSITIVE = "sensitive"
POLICY_BLOCKED = "blocked"


# ============================================================
# RETENTION POLICY
# ============================================================

RETENTION_DAYS = {
    "personal": 365,
    "preference": 365,
    "candidate_preference": 30,
    "episodic": 30,
    "exclusion": 365,
    "correction": 365,
}


# ============================================================
# SENSITIVE MEMORY PATTERNS
# ============================================================

SENSITIVE_PATTERNS = [
    r"\bmedical\b",
    r"\bhealth\b",
    r"\bdisease\b",
    r"\bdiagnosis\b",
    r"\bdepression\b",
    r"\banxiety\b",
    r"\bmental health\b",
    r"\bpolitical\b",
    r"\bpolitics\b",
    r"\breligion\b",
    r"\breligious\b",
    r"\bsexual orientation\b",
    r"\bsexual preference\b",
    r"\bdisability\b",
    r"\baddiction\b",
]


# ============================================================
# TRANSIENT CONTEXT PATTERNS
# ============================================================

TRANSIENT_PATTERNS = [
    r"\bsad today\b",
    r"\bhappy today\b",
    r"\bangry today\b",
    r"\bdepressed today\b",
    r"\bfeeling sad\b",
    r"\bfeeling angry\b",
    r"\bfeeling depressed\b",
    r"\bfeeling anxious\b",
]


# ============================================================
# TIME
# ============================================================

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============================================================
# RETENTION
# ============================================================

def retention_until(memory_type: str) -> Optional[str]:
    days = RETENTION_DAYS.get(memory_type)

    if not days:
        return None

    return (
        datetime.now(timezone.utc)
        + timedelta(days=days)
    ).isoformat()


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_memory_text(text: str) -> str:
    """
    Normalize memory text before governance and storage.
    """

    if text is None:
        return ""

    text = str(text).strip()

    # Collapse repeated whitespace
    text = re.sub(r"\s+", " ", text)

    return text


# ============================================================
# POLICY CLASSIFICATION
# ============================================================

def classify_policy(
    text: str,
    memory_type: str,
    source: str
) -> Dict[str, Any]:

    normalized = normalize_memory_text(text).lower()

    # --------------------------------------------------------
    # Invalid memory type
    # --------------------------------------------------------

    if memory_type not in MEMORY_TYPES:

        return {
            "allowed": False,
            "policy_class": POLICY_BLOCKED,
            "reason": "Unsupported memory type",
        }

    # --------------------------------------------------------
    # Sensitive information
    # --------------------------------------------------------

    for pattern in SENSITIVE_PATTERNS:

        if re.search(pattern, normalized):

            return {
                "allowed": False,
                "policy_class": POLICY_BLOCKED,
                "reason": (
                    "Potentially sensitive attribute "
                    "or high-risk inference"
                ),
            }

    # --------------------------------------------------------
    # Transient emotional context
    # --------------------------------------------------------

    for pattern in TRANSIENT_PATTERNS:

        if re.search(pattern, normalized):

            return {
                "allowed": False,
                "policy_class": POLICY_SENSITIVE,
                "reason": (
                    "Transient emotional context is "
                    "not durable memory by default"
                ),
            }

    # --------------------------------------------------------
    # Candidate preference
    # --------------------------------------------------------

    if memory_type == "candidate_preference":

        return {
            "allowed": True,
            "policy_class": POLICY_SENSITIVE,
            "reason": (
                "Candidate preference requires "
                "lower confidence and short retention"
            ),
        }

    # --------------------------------------------------------
    # Explicit user input / correction
    # --------------------------------------------------------

    if source in {
        "user_input",
        "correction"
    }:

        return {
            "allowed": True,
            "policy_class": POLICY_STANDARD,
            "reason": "Explicit user-provided memory",
        }

    # --------------------------------------------------------
    # Standard memory
    # --------------------------------------------------------

    return {
        "allowed": True,
        "policy_class": POLICY_STANDARD,
        "reason": "Standard product memory",
    }


# ============================================================
# MEMORY METADATA
# ============================================================

def build_memory_metadata(
    *,
    memory_type: str,
    source: str,
    text: str,
    confidence: float,
    source_event_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:

    now = utc_now()

    policy = classify_policy(
        text=text,
        memory_type=memory_type,
        source=source,
    )

    valid_until = retention_until(memory_type)

    return {

        "recorded_at": now,

        "valid_from": now,

        "valid_to": None,

        "retention_until": valid_until,

        "source_event_id":
            source_event_id
            or idempotency_key
            or "",

        "idempotency_key":
            idempotency_key
            or "",

        "policy_class":
            policy["policy_class"],

        "policy_reason":
            policy["reason"],

        "policy_allowed":
            policy["allowed"],

        "confidence":
            round(
                max(
                    0.0,
                    min(
                        float(confidence),
                        1.0
                    )
                ),
                2
            ),

        "status":
            "active"
            if policy["allowed"]
            else "blocked",
    }


# ============================================================
# RETRIEVAL POLICY
# ============================================================

def is_memory_retrievable(
    memory: Dict[str, Any]
) -> bool:

    if not memory:
        return False

    # Only active memories
    if memory.get("status") != "active":
        return False

    # Blocked policy memories must never be retrieved
    if memory.get("policy_class") == POLICY_BLOCKED:
        return False

    # Retention expiry
    retention = memory.get("retention_until")

    if retention:

        try:

            expiry = datetime.fromisoformat(
                retention.replace("Z", "+00:00")
            )

            if expiry.tzinfo is None:

                expiry = expiry.replace(
                    tzinfo=timezone.utc
                )

            if datetime.now(
                timezone.utc
            ) >= expiry:

                return False

        except Exception:
            # If malformed, don't fail the whole request.
            pass

    return True


# ============================================================
# FILTER MEMORIES
# ============================================================

def filter_retrievable_memories(
    memories: list
) -> list:

    filtered = []

    for memory in memories:

        if is_memory_retrievable(memory):

            filtered.append(memory)

    return filtered


# ============================================================
# PROVENANCE
# ============================================================

def build_provenance(
    memory: Dict[str, Any]
) -> Dict[str, Any]:

    return {

        "memory_id":
            memory.get("memory_id"),

        "source":
            memory.get("source"),

        "source_event_id":
            memory.get("source_event_id"),

        "recorded_at":
            memory.get("recorded_at"),

        "valid_from":
            memory.get("valid_from"),

        "valid_to":
            memory.get("valid_to"),

        "confidence":
            memory.get(
                "confidence",
                0.0
            ),

        "importance":
            memory.get(
                "importance",
                0.0
            ),

        "policy_class":
            memory.get(
                "policy_class",
                POLICY_STANDARD
            ),
    }


# ============================================================
# GOVERNANCE DECISION
# ============================================================

def governance_decision(
    text: str,
    memory_type: str,
    source: str,
    confidence: float = 0.5,
    source_event_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:

    policy = classify_policy(
        text=text,
        memory_type=memory_type,
        source=source,
    )

    metadata = build_memory_metadata(
        memory_type=memory_type,
        source=source,
        text=text,
        confidence=confidence,
        source_event_id=source_event_id,
        idempotency_key=idempotency_key,
    )

    return {

        "allowed":
            policy["allowed"],

        "policy_class":
            policy["policy_class"],

        "reason":
            policy["reason"],

        "metadata":
            metadata,
    }
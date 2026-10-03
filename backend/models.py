from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    artist: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    track: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    genre: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    context: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    subject_scope: Mapped[str] = mapped_column(
        String(50),
        default="user",
        nullable=False,
    )

    consent: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    source_event_id: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    idempotency_key: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        unique=True,
        index=True,
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    memory_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
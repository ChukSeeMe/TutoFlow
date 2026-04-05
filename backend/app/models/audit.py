from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AuditLog(Base):
    """
    Immutable record of significant actions in the system.
    Written on every create/update/delete and all AI usages.
    Never deleted — use partitioning or archiving in production.
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Actor — the user who performed the action (nullable for system events)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Subject — the student affected by this action (optional, for GDPR trail)
    student_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # What happened
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # What entity was affected
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Full before/after payload for forensics
    detail_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Network metadata
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")

from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, Text, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SelfReflection(Base):
    __tablename__ = "self_reflections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    # 1–5 Likert scale
    confidence_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    found_hard: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_helped: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_next: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Tutor read flag — allows tutor to mark as reviewed
    tutor_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="reflections")
    session: Mapped["LessonSession | None"] = relationship(
        "LessonSession", back_populates="reflections"
    )

import enum
from datetime import datetime, timezone, date
from sqlalchemy import DateTime, Date, Text, ForeignKey, JSON, Boolean, String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class HomeworkStatus(str, enum.Enum):
    SET = "set"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    MARKED = "marked"
    OVERDUE = "overdue"


class HomeworkTask(Base):
    __tablename__ = "homework_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # JSON: structured task content (questions, instructions, resources)
    task_content_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    status: Mapped[HomeworkStatus] = mapped_column(SAEnum(HomeworkStatus), default=HomeworkStatus.SET)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    session: Mapped["LessonSession | None"] = relationship(
        "LessonSession", back_populates="homework_tasks"
    )
    student: Mapped["Student"] = relationship("Student", back_populates="homework_tasks")

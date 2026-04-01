import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"
    CANCELLED = "cancelled"


class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class LessonSession(Base):
    __tablename__ = "lesson_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_plan_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_plans.id", ondelete="SET NULL"), nullable=True
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    attendance_status: Mapped[AttendanceStatus] = mapped_column(
        SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT
    )
    # 1-5: 1=disengaged, 5=highly engaged
    engagement_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tutor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus), default=SessionStatus.SCHEDULED
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    lesson_plan: Mapped["LessonPlan | None"] = relationship("LessonPlan", back_populates="sessions")
    student: Mapped["Student"] = relationship("Student", back_populates="sessions")
    tutor: Mapped["Tutor"] = relationship("Tutor", back_populates="sessions")
    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="session")
    observations: Mapped[list["ObservationNote"]] = relationship(
        "ObservationNote", back_populates="session"
    )
    homework_tasks: Mapped[list["HomeworkTask"]] = relationship(
        "HomeworkTask", back_populates="session"
    )
    assessment_attempts: Mapped[list["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt", back_populates="session"
    )
    reflections: Mapped[list["SelfReflection"]] = relationship(
        "SelfReflection", back_populates="session"
    )

    def __repr__(self) -> str:
        return f"<LessonSession id={self.id} student_id={self.student_id} at={self.scheduled_at}>"

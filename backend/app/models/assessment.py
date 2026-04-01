import enum
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, JSON, Integer, Float, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AssessmentType(str, enum.Enum):
    QUIZ = "quiz"
    EXIT_TICKET = "exit_ticket"
    VERBAL = "verbal"
    WRITTEN = "written"
    HOMEWORK_CHECK = "homework_check"


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("topics.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))
    assessment_type: Mapped[AssessmentType] = mapped_column(SAEnum(AssessmentType))
    title: Mapped[str | None] = mapped_column(nullable=True)
    # JSON list of question objects:
    # [{"question": "...", "type": "mcq|short|tf", "options": [...], "answer": "...", "marks": 1}]
    questions_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    max_score: Mapped[int] = mapped_column(Integer, default=0)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    session: Mapped["LessonSession | None"] = relationship("LessonSession", back_populates="assessments")
    attempts: Mapped[list["AssessmentAttempt"]] = relationship("AssessmentAttempt", back_populates="assessment")

    def __repr__(self) -> str:
        return f"<Assessment id={self.id} type={self.assessment_type}>"


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    answers_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    max_score: Mapped[int] = mapped_column(Integer, default=0)
    # 1-5 self-reported confidence after attempt
    confidence_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempt_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="attempts")
    student: Mapped["Student"] = relationship("Student", back_populates="assessment_attempts")
    session: Mapped["LessonSession | None"] = relationship(
        "LessonSession", back_populates="assessment_attempts"
    )

    @property
    def percentage_score(self) -> float:
        if self.max_score == 0:
            return 0.0
        return round((self.score / self.max_score) * 100, 1)

import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON, Boolean, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LessonType(str, enum.Enum):
    INTRODUCTION = "introduction"
    REVISION = "revision"
    EXAM_PREP = "exam_prep"
    INTERVENTION = "intervention"
    CATCH_UP = "catch_up"
    CONSOLIDATION = "consolidation"
    ASSESSMENT = "assessment"


class DifficultyLevel(str, enum.Enum):
    FOUNDATION = "foundation"
    CORE = "core"
    HIGHER = "higher"
    EXTENSION = "extension"


class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="RESTRICT"))

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    lesson_type: Mapped[LessonType] = mapped_column(SAEnum(LessonType), default=LessonType.INTRODUCTION)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    difficulty_level: Mapped[DifficultyLevel] = mapped_column(
        SAEnum(DifficultyLevel), default=DifficultyLevel.CORE
    )
    learning_objective: Mapped[str] = mapped_column(Text, nullable=False)

    # Full structured lesson content stored as JSON
    # Includes: success_criteria, prior_knowledge_check, starter, explanation_outline,
    #           worked_examples, guided_practice, independent_tasks, differentiated_tasks,
    #           scaffolded_support, challenge_tasks, misconceptions, assessment_opportunities,
    #           exit_ticket, homework_suggestion, parent_summary_draft, materials
    content_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    # Interactive visual (HTML) generated on-demand after lesson plan approval
    visual_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    visual_status: Mapped[str] = mapped_column(String(20), nullable=False, default="none")
    # visual_status values: "none" | "generating" | "ready" | "failed"
    visual_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    tutor: Mapped["Tutor"] = relationship("Tutor", back_populates="lesson_plans")
    student: Mapped["Student"] = relationship("Student", back_populates="lesson_plans")
    topic: Mapped["Topic"] = relationship("Topic", back_populates="lesson_plans")
    sessions: Mapped[list["LessonSession"]] = relationship("LessonSession", back_populates="lesson_plan")

    def __repr__(self) -> str:
        return f"<LessonPlan id={self.id} title={self.title}>"

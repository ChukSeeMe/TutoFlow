import enum
from datetime import datetime, timezone, date
from sqlalchemy import String, DateTime, Date, Text, ForeignKey, JSON, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class KeyStage(str, enum.Enum):
    KS3 = "KS3"           # Years 7–9, age 11–14
    KS4 = "KS4"           # Years 10–11, age 14–16 (GCSE)
    KS5 = "KS5"           # Years 12–13, age 16–18 (A-Level / BTEC)
    COLLEGE = "College"   # FE / adult learners


class AbilityBand(str, enum.Enum):
    FOUNDATION = "Foundation"
    CORE = "Core"
    HIGHER = "Higher"
    EXTENSION = "Extension"


class MasteryStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    TAUGHT = "taught"
    PRACTISING = "practising"
    DEVELOPING = "developing"
    SECURE = "secure"
    NEEDS_RETEACH = "needs_reteach"
    EXCEEDED = "exceeded"


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # user_id is nullable: students may not have a portal login initially
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))

    # Core identity
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    year_group: Mapped[str | None] = mapped_column(String(10), nullable=True)  # e.g. "Year 10"
    key_stage: Mapped[KeyStage | None] = mapped_column(SAEnum(KeyStage), nullable=True)
    ability_band: Mapped[AbilityBand | None] = mapped_column(SAEnum(AbilityBand), nullable=True)

    # SEND and support notes (sensitive — access-controlled)
    send_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_strategies: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_scaffolds: Mapped[str | None] = mapped_column(Text, nullable=True)
    literacy_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    communication_preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON: {"attention": "short tasks", "sensory": "noise sensitive"}
    additional_considerations: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="student_profile")
    tutor: Mapped["Tutor"] = relationship("Tutor", back_populates="students")
    parent_links: Mapped[list["StudentParentLink"]] = relationship(
        "StudentParentLink", back_populates="student"
    )
    lesson_plans: Mapped[list["LessonPlan"]] = relationship("LessonPlan", back_populates="student")
    sessions: Mapped[list["LessonSession"]] = relationship("LessonSession", back_populates="student")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(
        "ProgressRecord", back_populates="student"
    )
    assessment_attempts: Mapped[list["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt", back_populates="student"
    )
    observations: Mapped[list["ObservationNote"]] = relationship(
        "ObservationNote", back_populates="student"
    )
    homework_tasks: Mapped[list["HomeworkTask"]] = relationship(
        "HomeworkTask", back_populates="student"
    )
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="student")
    reflections: Mapped[list["SelfReflection"]] = relationship(
        "SelfReflection", back_populates="student"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Student id={self.id} name={self.full_name}>"

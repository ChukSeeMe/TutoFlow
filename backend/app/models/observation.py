import enum
from datetime import datetime, timezone
from sqlalchemy import DateTime, Text, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ObservationNoteType(str, enum.Enum):
    OBSERVATION = "observation"
    STRENGTH = "strength"
    MISCONCEPTION = "misconception"
    CONCERN = "concern"
    ENGAGEMENT = "engagement"
    BEHAVIOUR = "behaviour"
    GENERAL = "general"


class ObservationNote(Base):
    __tablename__ = "observation_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    note_type: Mapped[ObservationNoteType] = mapped_column(
        SAEnum(ObservationNoteType), default=ObservationNoteType.OBSERVATION
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Flagged notes appear prominently in student profile and trigger alerts
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    tutor: Mapped["Tutor"] = relationship("Tutor", back_populates="observations")
    student: Mapped["Student"] = relationship("Student", back_populates="observations")
    session: Mapped["LessonSession | None"] = relationship(
        "LessonSession", back_populates="observations"
    )

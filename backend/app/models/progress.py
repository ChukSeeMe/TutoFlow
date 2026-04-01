from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Float, Integer, Boolean, String, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.student import MasteryStatus


class ProgressRecord(Base):
    __tablename__ = "progress_records"
    __table_args__ = (
        UniqueConstraint("student_id", "topic_id", name="uq_student_topic_progress"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"))
    mastery_status: Mapped[MasteryStatus] = mapped_column(
        SAEnum(MasteryStatus), default=MasteryStatus.NOT_STARTED
    )
    sessions_on_topic: Mapped[int] = mapped_column(Integer, default=0)
    average_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Allows tutor to manually override the computed mastery status
    tutor_override: Mapped[bool] = mapped_column(Boolean, default=False)
    last_assessed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="progress_records")
    topic: Mapped["Topic"] = relationship("Topic", back_populates="progress_records")

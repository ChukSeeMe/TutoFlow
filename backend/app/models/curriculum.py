from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    key_stage: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "KS3", "KS4", "KS5", "All"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    topics: Mapped[list["Topic"]] = relationship("Topic", back_populates="subject")

    def __repr__(self) -> str:
        return f"<Subject id={self.id} name={self.name}>"


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    year_group: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "Year 10"
    key_stage: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # England curriculum reference e.g. "GCSE-Maths-Number-1.2"
    curriculum_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    subject: Mapped["Subject"] = relationship("Subject", back_populates="topics")
    lesson_plans: Mapped[list["LessonPlan"]] = relationship("LessonPlan", back_populates="topic")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(
        "ProgressRecord", back_populates="topic"
    )

    def __repr__(self) -> str:
        return f"<Topic id={self.id} name={self.name}>"

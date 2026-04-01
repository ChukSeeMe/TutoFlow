from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Tutor(Base):
    __tablename__ = "tutors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # JSON list of subject names e.g. ["Maths", "Physics"]
    subjects_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # JSON list of qualifications e.g. [{"title": "QTS", "institution": "..."}]
    qualifications_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tutor_profile")
    students: Mapped[list["Student"]] = relationship("Student", back_populates="tutor")
    lesson_plans: Mapped[list["LessonPlan"]] = relationship("LessonPlan", back_populates="tutor")
    sessions: Mapped[list["LessonSession"]] = relationship("LessonSession", back_populates="tutor")
    observations: Mapped[list["ObservationNote"]] = relationship("ObservationNote", back_populates="tutor")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<Tutor id={self.id} name={self.full_name}>"

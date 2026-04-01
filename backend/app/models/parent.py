from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ParentGuardian(Base):
    __tablename__ = "parents_guardians"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    relationship_label: Mapped[str] = mapped_column(
        String(50), default="Parent"
    )  # Parent / Guardian / Carer / Step-parent
    communication_preference: Mapped[str] = mapped_column(
        String(20), default="email"
    )  # email / letter / phone
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="parent_profile")
    student_links: Mapped[list["StudentParentLink"]] = relationship(
        "StudentParentLink", back_populates="parent"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<ParentGuardian id={self.id} name={self.full_name}>"


class StudentParentLink(Base):
    __tablename__ = "student_parent_links"
    __table_args__ = (
        UniqueConstraint("student_id", "parent_id", name="uq_student_parent"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    parent_id: Mapped[int] = mapped_column(ForeignKey("parents_guardians.id", ondelete="CASCADE"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="parent_links")
    parent: Mapped["ParentGuardian"] = relationship("ParentGuardian", back_populates="student_links")

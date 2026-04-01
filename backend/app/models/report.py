import enum
from datetime import datetime, timezone, date
from sqlalchemy import DateTime, Date, ForeignKey, JSON, Boolean, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ReportType(str, enum.Enum):
    WEEKLY_UPDATE = "weekly_update"
    MONTHLY_SUMMARY = "monthly_summary"
    TERM_REPORT = "term_report"
    INTERVENTION_SUMMARY = "intervention_summary"
    PARENT_LETTER = "parent_letter"
    PROGRESS_SNAPSHOT = "progress_snapshot"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    generated_by: Mapped[int] = mapped_column(ForeignKey("tutors.id", ondelete="CASCADE"))
    report_type: Mapped[ReportType] = mapped_column(SAEnum(ReportType))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Structured report data used to render the PDF/HTML
    content_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Raw AI draft text before tutor edits
    ai_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Final tutor-edited text
    final_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="reports")


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    ai_drafted: Mapped[bool] = mapped_column(Boolean, default=False)
    tutor_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

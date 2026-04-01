from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.models.report import ReportType


class ReportGenerateRequest(BaseModel):
    student_id: int
    report_type: ReportType
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    additional_notes: Optional[str] = None


class ReportApproveRequest(BaseModel):
    final_text: str  # tutor-edited final version


class ReportResponse(BaseModel):
    id: int
    student_id: int
    generated_by: int
    report_type: ReportType
    title: str
    period_start: Optional[date]
    period_end: Optional[date]
    content_json: dict
    ai_draft: Optional[str]
    final_text: Optional[str]
    ai_generated: bool
    tutor_approved: bool
    approved_at: Optional[datetime]
    pdf_path: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

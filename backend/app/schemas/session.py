from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.session import AttendanceStatus, SessionStatus


class SessionCreate(BaseModel):
    student_id: int
    lesson_plan_id: Optional[int] = None
    scheduled_at: datetime


class SessionUpdate(BaseModel):
    attendance_status: Optional[AttendanceStatus] = None
    engagement_score: Optional[int] = None
    tutor_notes: Optional[str] = None
    session_summary: Optional[str] = None
    status: Optional[SessionStatus] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    @field_validator("engagement_score")
    @classmethod
    def validate_engagement(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Engagement score must be between 1 and 5")
        return v


class SessionResponse(BaseModel):
    id: int
    lesson_plan_id: Optional[int]
    student_id: int
    tutor_id: int
    scheduled_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    attendance_status: AttendanceStatus
    engagement_score: Optional[int]
    tutor_notes: Optional[str]
    session_summary: Optional[str]
    status: SessionStatus
    created_at: datetime

    model_config = {"from_attributes": True}

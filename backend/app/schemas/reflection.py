from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReflectionCreate(BaseModel):
    session_id: Optional[int] = None
    confidence_before: Optional[int] = Field(None, ge=1, le=5)
    confidence_after: Optional[int] = Field(None, ge=1, le=5)
    found_hard: Optional[str] = None
    what_helped: Optional[str] = None
    what_next: Optional[str] = None


class ReflectionOut(BaseModel):
    id: int
    student_id: int
    session_id: Optional[int]
    confidence_before: Optional[int]
    confidence_after: Optional[int]
    found_hard: Optional[str]
    what_helped: Optional[str]
    what_next: Optional[str]
    tutor_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}

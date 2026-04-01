from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class ParentCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    relationship_label: str = "Parent"
    communication_preference: str = "email"


class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    relationship_label: Optional[str] = None
    communication_preference: Optional[str] = None


class ParentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str]
    relationship_label: str
    communication_preference: str
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ParentWithStudentsResponse(ParentResponse):
    linked_student_ids: list[int] = []


class LinkStudentRequest(BaseModel):
    is_primary: bool = True


# What a parent can see about their linked child — deliberately limited
class ChildSummaryResponse(BaseModel):
    student_id: int
    first_name: str
    year_group: Optional[str]
    key_stage: Optional[str]
    total_sessions: int
    attendance_rate: float
    topics_secure: int
    topics_needs_reteach: int
    last_session_date: Optional[datetime]
    outstanding_homework: int

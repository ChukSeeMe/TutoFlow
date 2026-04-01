from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.models.homework import HomeworkStatus


class HomeworkGenerateRequest(BaseModel):
    student_id: int
    session_id: Optional[int] = None
    topic_id: int
    difficulty_level: str = "core"
    num_tasks: int = 3
    due_date: Optional[date] = None


class HomeworkCreate(BaseModel):
    student_id: int
    session_id: Optional[int] = None
    title: str
    description: str
    due_date: Optional[date] = None
    task_content_json: dict


class HomeworkUpdate(BaseModel):
    status: Optional[HomeworkStatus] = None
    tutor_feedback: Optional[str] = None
    tutor_approved: Optional[bool] = None


class HomeworkResponse(BaseModel):
    id: int
    student_id: int
    session_id: Optional[int]
    title: str
    description: str
    due_date: Optional[date]
    task_content_json: dict
    status: HomeworkStatus
    ai_generated: bool
    tutor_approved: bool
    tutor_feedback: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}

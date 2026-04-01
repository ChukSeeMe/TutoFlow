from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.student import MasteryStatus


class ProgressRecordResponse(BaseModel):
    id: int
    student_id: int
    topic_id: int
    topic_name: str
    subject_name: str
    mastery_status: MasteryStatus
    sessions_on_topic: int
    average_score: Optional[float]
    tutor_override: bool
    last_assessed: Optional[datetime]

    model_config = {"from_attributes": True}


class ProgressOverrideRequest(BaseModel):
    topic_id: int
    mastery_status: MasteryStatus


class MasteryMapResponse(BaseModel):
    student_id: int
    subject_id: int
    subject_name: str
    topics: list[ProgressRecordResponse]

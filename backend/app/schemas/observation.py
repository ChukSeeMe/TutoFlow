from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.observation import ObservationNoteType


class ObservationCreate(BaseModel):
    student_id: int
    session_id: Optional[int] = None
    note_type: ObservationNoteType = ObservationNoteType.OBSERVATION
    content: str
    is_flagged: bool = False


class ObservationResponse(BaseModel):
    id: int
    tutor_id: int
    student_id: int
    session_id: Optional[int]
    note_type: ObservationNoteType
    content: str
    is_flagged: bool
    created_at: datetime

    model_config = {"from_attributes": True}

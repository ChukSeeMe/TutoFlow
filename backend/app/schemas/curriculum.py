from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubjectResponse(BaseModel):
    id: int
    name: str
    key_stage: Optional[str]
    description: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class TopicResponse(BaseModel):
    id: int
    subject_id: int
    name: str
    description: Optional[str]
    year_group: Optional[str]
    key_stage: Optional[str]
    curriculum_ref: Optional[str]
    order_index: int

    model_config = {"from_attributes": True}


class TopicCreate(BaseModel):
    subject_id: int
    name: str
    description: Optional[str] = None
    year_group: Optional[str] = None
    key_stage: Optional[str] = None
    curriculum_ref: Optional[str] = None
    order_index: int = 0

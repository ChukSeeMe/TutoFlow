from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.lesson import LessonType, DifficultyLevel


class LessonGenerateRequest(BaseModel):
    """Parameters passed to the AI lesson generator."""
    student_id: int
    topic_id: int
    lesson_type: LessonType = LessonType.INTRODUCTION
    duration_minutes: int = 60
    difficulty_level: DifficultyLevel = DifficultyLevel.CORE
    learning_objective: str
    # Optional context passed to AI for better differentiation
    send_context: Optional[str] = None  # anonymised — no names
    prior_knowledge: Optional[str] = None
    additional_notes: Optional[str] = None


class LessonPlanCreate(BaseModel):
    student_id: int
    topic_id: int
    title: str
    lesson_type: LessonType = LessonType.INTRODUCTION
    duration_minutes: int = 60
    difficulty_level: DifficultyLevel = DifficultyLevel.CORE
    learning_objective: str
    content_json: dict


class LessonPlanUpdate(BaseModel):
    title: Optional[str] = None
    lesson_type: Optional[LessonType] = None
    duration_minutes: Optional[int] = None
    difficulty_level: Optional[DifficultyLevel] = None
    learning_objective: Optional[str] = None
    content_json: Optional[dict] = None
    tutor_approved: Optional[bool] = None


class LessonPlanResponse(BaseModel):
    id: int
    tutor_id: int
    student_id: int
    topic_id: int
    title: str
    lesson_type: LessonType
    duration_minutes: int
    difficulty_level: DifficultyLevel
    learning_objective: str
    content_json: dict
    ai_generated: bool
    tutor_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LessonPlanSummary(BaseModel):
    id: int
    title: str
    lesson_type: LessonType
    duration_minutes: int
    difficulty_level: DifficultyLevel
    ai_generated: bool
    tutor_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}

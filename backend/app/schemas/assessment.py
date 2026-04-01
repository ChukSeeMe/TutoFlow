from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.assessment import AssessmentType


class QuestionItem(BaseModel):
    question: str
    question_type: str  # "mcq" | "short" | "true_false"
    options: Optional[list[str]] = None  # for MCQ
    answer: str
    marks: int = 1
    explanation: Optional[str] = None  # shown after attempt


class AssessmentCreate(BaseModel):
    session_id: Optional[int] = None
    topic_id: Optional[int] = None
    assessment_type: AssessmentType
    title: Optional[str] = None
    questions_json: list[QuestionItem]


class AssessmentGenerateRequest(BaseModel):
    topic_id: int
    assessment_type: AssessmentType = AssessmentType.QUIZ
    num_questions: int = 5
    difficulty_level: str = "core"
    student_ability_band: Optional[str] = None


class AttemptCreate(BaseModel):
    assessment_id: int
    session_id: Optional[int] = None
    answers_json: list[dict]  # [{"question_index": 0, "answer": "..."}]
    confidence_rating: Optional[int] = None
    time_taken_seconds: Optional[int] = None

    @field_validator("confidence_rating")
    @classmethod
    def validate_confidence(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Confidence rating must be 1–5")
        return v


class AssessmentResponse(BaseModel):
    id: int
    session_id: Optional[int]
    topic_id: Optional[int]
    created_by: int
    assessment_type: AssessmentType
    title: Optional[str]
    questions_json: list
    max_score: int
    ai_generated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AttemptResponse(BaseModel):
    id: int
    assessment_id: int
    student_id: int
    score: float
    max_score: int
    percentage_score: float
    confidence_rating: Optional[int]
    attempt_date: datetime

    model_config = {"from_attributes": True}

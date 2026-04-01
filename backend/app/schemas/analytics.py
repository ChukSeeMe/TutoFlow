from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.student import MasteryStatus


class Recommendation(BaseModel):
    rule_id: str
    priority: str  # "high" | "medium" | "low"
    title: str
    description: str
    action: str
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None


class StudentAnalyticsSummary(BaseModel):
    student_id: int
    student_name: str
    total_sessions: int
    attendance_rate: float  # 0.0–1.0
    average_engagement: Optional[float]
    average_quiz_score: Optional[float]
    topics_secure: int
    topics_needs_reteach: int
    topics_not_started: int
    last_session_date: Optional[datetime]
    flagged_observations: int
    outstanding_homework: int
    recommendations: list[Recommendation]

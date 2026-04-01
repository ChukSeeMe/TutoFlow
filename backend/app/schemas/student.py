from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.student import KeyStage, AbilityBand


class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    year_group: Optional[str] = None
    key_stage: Optional[KeyStage] = None
    ability_band: Optional[AbilityBand] = None
    send_notes: Optional[str] = None
    support_strategies: Optional[str] = None
    preferred_scaffolds: Optional[str] = None
    literacy_notes: Optional[str] = None
    communication_preferences: Optional[str] = None
    additional_considerations: Optional[dict] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    year_group: Optional[str] = None
    key_stage: Optional[KeyStage] = None
    ability_band: Optional[AbilityBand] = None
    send_notes: Optional[str] = None
    support_strategies: Optional[str] = None
    preferred_scaffolds: Optional[str] = None
    literacy_notes: Optional[str] = None
    communication_preferences: Optional[str] = None
    additional_considerations: Optional[dict] = None
    is_active: Optional[bool] = None


class StudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: Optional[date]
    year_group: Optional[str]
    key_stage: Optional[KeyStage]
    ability_band: Optional[AbilityBand]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentDetailResponse(StudentResponse):
    """Full student profile including SEND notes (tutor-only)."""
    send_notes: Optional[str]
    support_strategies: Optional[str]
    preferred_scaffolds: Optional[str]
    literacy_notes: Optional[str]
    communication_preferences: Optional[str]
    additional_considerations: Optional[dict]
    tutor_id: int
    user_id: Optional[int]

    model_config = {"from_attributes": True}

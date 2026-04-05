from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.user import UserRole


class UserMeResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class TutorProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    bio: Optional[str]
    phone: Optional[str]
    subjects_json: Optional[list]
    qualifications_json: Optional[list]

    model_config = {"from_attributes": True}


class TutorProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    subjects_json: Optional[list] = None
    qualifications_json: Optional[list] = None

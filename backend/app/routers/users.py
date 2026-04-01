from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.tutor import Tutor
from app.schemas.user import UserMeResponse, TutorProfileResponse, TutorProfileUpdate
from app.core.dependencies import get_current_user, require_tutor
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserMeResponse.model_validate(current_user)


@router.get("/me/profile", response_model=TutorProfileResponse)
async def get_tutor_profile(
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tutor).where(Tutor.user_id == current_user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise NotFoundError("Tutor profile not found")
    return TutorProfileResponse(
        id=tutor.id,
        first_name=tutor.first_name,
        last_name=tutor.last_name,
        full_name=tutor.full_name,
        bio=tutor.bio,
        phone=tutor.phone,
        subjects_json=tutor.subjects_json,
        qualifications_json=tutor.qualifications_json,
    )


@router.patch("/me/profile", response_model=TutorProfileResponse)
async def update_tutor_profile(
    payload: TutorProfileUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tutor).where(Tutor.user_id == current_user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise NotFoundError("Tutor profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tutor, field, value)

    await db.commit()
    await db.refresh(tutor)
    return TutorProfileResponse(
        id=tutor.id,
        first_name=tutor.first_name,
        last_name=tutor.last_name,
        full_name=tutor.full_name,
        bio=tutor.bio,
        phone=tutor.phone,
        subjects_json=tutor.subjects_json,
        qualifications_json=tutor.qualifications_json,
    )

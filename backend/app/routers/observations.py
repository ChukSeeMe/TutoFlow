from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.observation import ObservationNote
from app.models.tutor import Tutor
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/observations", tags=["observations"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/", response_model=ObservationResponse, status_code=201)
async def create_observation(
    payload: ObservationCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    note = ObservationNote(tutor_id=tutor.id, **payload.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return ObservationResponse.model_validate(note)


@router.get("/{student_id}", response_model=list[ObservationResponse])
async def get_observations(
    student_id: int,
    note_type: str | None = None,
    flagged_only: bool = False,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    query = select(ObservationNote).where(
        ObservationNote.tutor_id == tutor.id,
        ObservationNote.student_id == student_id,
    )
    if note_type:
        query = query.where(ObservationNote.note_type == note_type)
    if flagged_only:
        query = query.where(ObservationNote.is_flagged == True)
    query = query.order_by(ObservationNote.created_at.desc())
    result = await db.execute(query)
    return [ObservationResponse.model_validate(n) for n in result.scalars().all()]

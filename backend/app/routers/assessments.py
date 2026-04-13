from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.assessment import Assessment
from app.models.tutor import Tutor
from app.schemas.assessment import (
    AssessmentCreate, AssessmentGenerateRequest, AttemptCreate,
    AssessmentResponse, AttemptResponse,
)
from app.services.assessment_service import generate_assessment, score_attempt
from app.services.progress_service import update_progress_after_attempt
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/assessments", tags=["assessments"])
limiter = Limiter(key_func=get_remote_address)


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/generate", response_model=AssessmentResponse, status_code=201)
@limiter.limit("20/hour")
async def generate(
    request: Request,
    payload: AssessmentGenerateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    assessment = await generate_assessment(payload, tutor.id, db)
    return AssessmentResponse.model_validate(assessment)


@router.post("", response_model=AssessmentResponse, status_code=201)
async def create_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    max_score = sum(q.marks for q in payload.questions_json)
    assessment = Assessment(
        created_by=tutor.id,
        assessment_type=payload.assessment_type,
        session_id=payload.session_id,
        topic_id=payload.topic_id,
        title=payload.title,
        questions_json=[q.model_dump() for q in payload.questions_json],
        max_score=max_score,
        ai_generated=False,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return AssessmentResponse.model_validate(assessment)


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id,
            Assessment.created_by == tutor.id,
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise NotFoundError("Assessment not found")
    return AssessmentResponse.model_validate(assessment)


@router.post("/attempts", response_model=AttemptResponse, status_code=201)
async def submit_attempt(
    payload: AttemptCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    Tutor submits an attempt on behalf of a student (in-session).
    Automatically recalculates topic mastery.
    """
    tutor = await _get_tutor(current_user, db)

    # Verify assessment belongs to this tutor
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == payload.assessment_id)
    )
    assessment = assessment_result.scalar_one_or_none()
    if not assessment or assessment.created_by != tutor.id:
        raise NotFoundError("Assessment not found")

    # We need student_id — it comes from the session or must be provided
    # For MVP: tutor provides student_id via session linkage
    from app.models.session import LessonSession
    if payload.session_id:
        session_result = await db.execute(
            select(LessonSession).where(LessonSession.id == payload.session_id)
        )
        session = session_result.scalar_one_or_none()
        student_id = session.student_id if session else None
    else:
        # Fallback: get student from assessment's session
        student_id = None

    if not student_id:
        raise ForbiddenError("Cannot determine student for this attempt")

    attempt = await score_attempt(payload, student_id, db)

    # Update progress if topic is known
    if assessment.topic_id:
        await update_progress_after_attempt(student_id, assessment.topic_id, db)

    return AttemptResponse(
        id=attempt.id,
        assessment_id=attempt.assessment_id,
        student_id=attempt.student_id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage_score=attempt.percentage_score,
        confidence_rating=attempt.confidence_rating,
        attempt_date=attempt.attempt_date,
    )

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.lesson import LessonPlan
from app.models.tutor import Tutor
from app.models.audit import AuditLog
from app.schemas.lesson import (
    LessonGenerateRequest, LessonPlanCreate, LessonPlanUpdate,
    LessonPlanResponse, LessonPlanSummary,
)
from app.services.lesson_service import generate_lesson_plan
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/lessons", tags=["lessons"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/generate", response_model=LessonPlanResponse, status_code=201)
async def generate(
    request: Request,
    payload: LessonGenerateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered lesson plan generator. Returns an unapproved draft."""
    tutor = await _get_tutor(current_user, db)
    lesson_plan = await generate_lesson_plan(payload, tutor.id, db)

    db.add(AuditLog(
        user_id=current_user.id,
        action="generate_lesson_plan",
        resource_type="lesson_plan",
        resource_id=str(lesson_plan.id),
        ip_address=request.client.host if request.client else None,
        detail_json={"topic_id": payload.topic_id, "ai_generated": True},
    ))
    await db.commit()
    return LessonPlanResponse.model_validate(lesson_plan)


@router.post("/", response_model=LessonPlanResponse, status_code=201)
async def create_lesson_plan(
    request: Request,
    payload: LessonPlanCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Create a lesson plan manually (not AI-generated)."""
    tutor = await _get_tutor(current_user, db)
    plan = LessonPlan(
        tutor_id=tutor.id,
        ai_generated=False,
        tutor_approved=True,
        **payload.model_dump(),
    )
    db.add(plan)
    db.add(AuditLog(
        user_id=current_user.id,
        action="create_lesson_plan",
        resource_type="lesson_plan",
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(plan)
    return LessonPlanResponse.model_validate(plan)


@router.get("/", response_model=list[LessonPlanSummary])
async def list_lesson_plans(
    student_id: int | None = None,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    query = select(LessonPlan).where(LessonPlan.tutor_id == tutor.id)
    if student_id:
        query = query.where(LessonPlan.student_id == student_id)
    query = query.order_by(LessonPlan.created_at.desc())
    result = await db.execute(query)
    plans = result.scalars().all()
    return [LessonPlanSummary.model_validate(p) for p in plans]


@router.get("/{plan_id}", response_model=LessonPlanResponse)
async def get_lesson_plan(
    plan_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(LessonPlan).where(LessonPlan.id == plan_id, LessonPlan.tutor_id == tutor.id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Lesson plan not found")
    return LessonPlanResponse.model_validate(plan)


@router.patch("/{plan_id}", response_model=LessonPlanResponse)
async def update_lesson_plan(
    request: Request,
    plan_id: int,
    payload: LessonPlanUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(LessonPlan).where(LessonPlan.id == plan_id, LessonPlan.tutor_id == tutor.id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Lesson plan not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    db.add(AuditLog(
        user_id=current_user.id,
        action="update_lesson_plan",
        resource_type="lesson_plan",
        resource_id=str(plan_id),
        ip_address=request.client.host if request.client else None,
        detail_json={"fields_changed": list(payload.model_dump(exclude_unset=True).keys())},
    ))
    await db.commit()
    await db.refresh(plan)
    return LessonPlanResponse.model_validate(plan)

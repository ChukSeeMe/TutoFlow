from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.curriculum import Subject, Topic
from app.schemas.curriculum import SubjectResponse, TopicResponse, TopicCreate
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/subjects", response_model=list[SubjectResponse])
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_tutor),
):
    result = await db.execute(
        select(Subject).where(Subject.is_active == True).order_by(Subject.name)
    )
    return [SubjectResponse.model_validate(s) for s in result.scalars().all()]


@router.get("/subjects/{subject_id}/topics", response_model=list[TopicResponse])
async def list_topics(
    subject_id: int,
    year_group: str | None = None,
    key_stage: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_tutor),
):
    query = select(Topic).where(Topic.subject_id == subject_id)
    if year_group:
        query = query.where(Topic.year_group == year_group)
    if key_stage:
        query = query.where(Topic.key_stage == key_stage)
    query = query.order_by(Topic.order_index, Topic.name)
    result = await db.execute(query)
    return [TopicResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/topics/{topic_id}", response_model=TopicResponse)
async def get_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_tutor),
):
    result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic not found")
    return TopicResponse.model_validate(topic)


@router.post("/topics", response_model=TopicResponse, status_code=201)
async def create_topic(
    payload: TopicCreate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_tutor),
):
    """Tutors can add custom topics."""
    topic = Topic(**payload.model_dump())
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return TopicResponse.model_validate(topic)

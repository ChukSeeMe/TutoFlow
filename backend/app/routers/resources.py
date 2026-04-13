from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.curriculum import Topic, Subject
from app.ai.claude_client import call_claude
from app.ai.prompts import RESOURCE_SYSTEM, resource_prompt
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/resources", tags=["resources"])
limiter = Limiter(key_func=get_remote_address)

VALID_TYPES = {
    "worksheet", "retrieval_quiz", "revision_card",
    "worked_example", "homework", "differentiated_task",
}


class ResourceGenerateRequest(BaseModel):
    topic_id: int
    resource_type: str  # one of VALID_TYPES
    year_group: str
    ability_band: str = "Core"
    context: Optional[str] = None  # any extra tutor notes


class ResourceGenerateResponse(BaseModel):
    resource_type: str
    topic: str
    subject: str
    year_group: str
    ability_band: str
    content: str


@router.post("/generate", response_model=ResourceGenerateResponse)
@limiter.limit("30/hour")
async def generate_resource(
    request: Request,
    payload: ResourceGenerateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    if payload.resource_type not in VALID_TYPES:
        from app.core.exceptions import ValidationError
        raise ValidationError(
            f"resource_type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    topic_result = await db.execute(select(Topic).where(Topic.id == payload.topic_id))
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic not found")

    subject_result = await db.execute(select(Subject).where(Subject.id == topic.subject_id))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject not found")

    prompt = resource_prompt(
        resource_type=payload.resource_type,
        topic=topic.name,
        subject=subject.name,
        year_group=payload.year_group,
        ability_band=payload.ability_band,
        context=payload.context or "",
    )

    content = await call_claude(
        system_prompt=RESOURCE_SYSTEM,
        user_prompt=prompt,
        max_tokens=2000,
    )

    return ResourceGenerateResponse(
        resource_type=payload.resource_type,
        topic=topic.name,
        subject=subject.name,
        year_group=payload.year_group,
        ability_band=payload.ability_band,
        content=content,
    )

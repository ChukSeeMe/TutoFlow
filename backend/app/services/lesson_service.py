from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.lesson import LessonPlan
from app.models.curriculum import Subject, Topic
from app.models.student import Student
from app.schemas.lesson import LessonGenerateRequest
from app.ai.claude_client import call_claude
from app.ai.prompts import LESSON_PLAN_SYSTEM, lesson_plan_prompt
from app.ai.output_parsers import extract_json, validate_lesson_plan
from app.ai.image_service import fetch_topic_image
from app.core.exceptions import NotFoundError, AIServiceError
import structlog

log = structlog.get_logger(__name__)


async def generate_lesson_plan(
    request: LessonGenerateRequest,
    tutor_id: int,
    db: AsyncSession,
) -> LessonPlan:
    """
    Generate an AI-assisted lesson plan and save it as an unapproved draft.
    The tutor must approve it before it is used in a session.
    """
    # Load topic and subject
    topic_result = await db.execute(
        select(Topic).where(Topic.id == request.topic_id)
    )
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic not found")

    subject_result = await db.execute(
        select(Subject).where(Subject.id == topic.subject_id)
    )
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject not found")

    # Load student for year group / key stage context
    student_result = await db.execute(
        select(Student).where(Student.id == request.student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    year_group = student.year_group or "Year 10"
    key_stage = student.key_stage.value if student.key_stage else "KS4"

    # Build prompt (no student name or identifying info sent to AI)
    user_prompt = lesson_plan_prompt(
        subject=subject.name,
        topic=topic.name,
        year_group=year_group,
        key_stage=key_stage,
        lesson_type=request.lesson_type.value,
        duration_minutes=request.duration_minutes,
        difficulty_level=request.difficulty_level.value,
        learning_objective=request.learning_objective,
        send_context=request.send_context,
        prior_knowledge=request.prior_knowledge,
        additional_notes=request.additional_notes,
    )

    log.info(
        "generating_lesson_plan",
        topic=topic.name,
        subject=subject.name,
        tutor_id=tutor_id,
    )

    raw_response = await call_claude(LESSON_PLAN_SYSTEM, user_prompt)

    try:
        content = extract_json(raw_response)
        content = validate_lesson_plan(content)
    except ValueError as e:
        log.error("lesson_plan_parse_error", error=str(e), raw_response=raw_response[:500])
        raise AIServiceError(f"Could not parse lesson plan from AI: {e}. Please try again.")

    # Fetch a topic-relevant image (non-blocking — fails silently if key not set)
    image_url = await fetch_topic_image(topic.name, subject.name)
    if image_url:
        content["image_url"] = image_url

    title = content.get("title", f"{topic.name} — {request.lesson_type.value.replace('_', ' ').title()}")

    lesson_plan = LessonPlan(
        tutor_id=tutor_id,
        student_id=request.student_id,
        topic_id=request.topic_id,
        title=title,
        lesson_type=request.lesson_type,
        duration_minutes=request.duration_minutes,
        difficulty_level=request.difficulty_level,
        learning_objective=request.learning_objective,
        content_json=content,
        ai_generated=True,
        tutor_approved=False,
    )
    db.add(lesson_plan)
    await db.commit()
    await db.refresh(lesson_plan)
    return lesson_plan

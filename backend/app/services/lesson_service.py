from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.lesson import LessonPlan
from app.models.curriculum import Subject, Topic
from app.models.student import Student
from app.schemas.lesson import LessonGenerateRequest
from app.ai.claude_client import call_claude, get_claude_client
from app.ai.prompts import LESSON_PLAN_SYSTEM, lesson_plan_prompt
from app.ai.output_parsers import extract_json, validate_lesson_plan
from app.ai.image_service import fetch_topic_image
from app.config import settings
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
        log.error("lesson_plan_parse_error", error=str(e), raw_response=raw_response)
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
    try:
        db.add(lesson_plan)
        await db.commit()
        await db.refresh(lesson_plan)
    except Exception as db_err:
        await db.rollback()
        log.error("lesson_plan_db_save_error", error=str(db_err))
        raise AIServiceError(f"Database error saving lesson plan: {db_err}")
    return lesson_plan


VISUAL_SYSTEM = """You are an expert educational visual designer.
You create interactive HTML learning visuals for UK secondary school students.
Return ONLY raw HTML with no markdown, no code fences, no preamble.
The HTML must be completely self-contained and work in a sandboxed iframe."""


async def generate_lesson_visual(lesson_id: int, tutor_id: int, db: AsyncSession) -> LessonPlan:
    """
    Generate an interactive HTML visual for an existing lesson plan.
    Stores the result in visual_html and updates visual_status.
    """
    result = await db.execute(
        select(LessonPlan).where(LessonPlan.id == lesson_id, LessonPlan.tutor_id == tutor_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Lesson plan not found")

    plan.visual_status = "generating"
    await db.commit()

    content = plan.content_json or {}
    topic = content.get("topic", "")
    subject = content.get("subject", "")
    year_group = content.get("year_group", "")
    objective = content.get("objective", plan.learning_objective)
    vocabulary = content.get("key_vocabulary", [])
    vocab_text = ", ".join(
        f"{v.get('term', '')}: {v.get('definition', '')}"
        for v in vocabulary if isinstance(v, dict)
    ) if vocabulary else ""

    visual_prompt = f"""Generate a self-contained interactive HTML visual for a UK {year_group} {subject} lesson on: {topic}

Learning objective: {objective}
{f"Key vocabulary: {vocab_text}" if vocab_text else ""}

Requirements:
- Return ONLY raw HTML. No markdown fences, no JSON wrapper, no explanation.
- Must be completely self-contained (all CSS and JS inline; external libraries may load only from cdnjs.cloudflare.com, esm.sh, cdn.jsdelivr.net, or unpkg.com)
- Must work standalone in a sandboxed iframe with sandbox="allow-scripts"
- Use a clean educational design with a white/light background
- Include at minimum: a labelled diagram OR interactive step-through of the key concept
- Add clickable elements where appropriate that reveal explanations
- Include the key vocabulary in a visible section
- Optimised for a 14-16 year old UK student
- Max output: 5000 tokens of HTML"""

    try:
        client = get_claude_client()
        message = await client.messages.create(
            model=settings.ai_model,
            max_tokens=8192,
            system=VISUAL_SYSTEM,
            messages=[{"role": "user", "content": visual_prompt}],
        )
        visual_html = message.content[0].text.strip()

        # Strip accidental markdown code fences
        if visual_html.startswith("```"):
            lines = visual_html.split("\n")
            visual_html = "\n".join(lines[1:])
            if visual_html.endswith("```"):
                visual_html = visual_html[:-3].strip()

        plan.visual_html = visual_html
        plan.visual_status = "ready"
        plan.visual_generated_at = datetime.now(timezone.utc)
        log.info("visual_generated", lesson_id=lesson_id, length=len(visual_html))
    except Exception as e:
        log.error("visual_generation_failed", lesson_id=lesson_id, error=str(e))
        plan.visual_status = "failed"

    await db.commit()
    await db.refresh(plan)
    return plan

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.assessment import Assessment, AssessmentAttempt, AssessmentType
from app.models.curriculum import Topic, Subject
from app.schemas.assessment import AssessmentGenerateRequest, AttemptCreate
from app.ai.claude_client import call_claude
from app.ai.prompts import QUIZ_SYSTEM, quiz_prompt
from app.ai.output_parsers import extract_json, validate_quiz
from app.core.exceptions import NotFoundError, AIServiceError
import structlog

log = structlog.get_logger(__name__)


async def generate_assessment(
    request: AssessmentGenerateRequest,
    tutor_id: int,
    db: AsyncSession,
) -> Assessment:
    topic_result = await db.execute(select(Topic).where(Topic.id == request.topic_id))
    topic = topic_result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic not found")

    subject_result = await db.execute(select(Subject).where(Subject.id == topic.subject_id))
    subject = subject_result.scalar_one_or_none()
    if not subject:
        raise NotFoundError("Subject not found")

    year_group = topic.year_group or "Year 10"

    user_prompt = quiz_prompt(
        subject=subject.name,
        topic=topic.name,
        year_group=year_group,
        num_questions=request.num_questions,
        difficulty_level=request.difficulty_level,
        assessment_type=request.assessment_type.value,
    )

    raw = await call_claude(QUIZ_SYSTEM, user_prompt)

    try:
        data = extract_json(raw)
        data = validate_quiz(data)
    except ValueError as e:
        log.error("quiz_parse_error", error=str(e))
        raise AIServiceError("Could not parse quiz from AI. Please try again.")

    max_score = sum(q.get("marks", 1) for q in data["questions"])

    assessment = Assessment(
        topic_id=request.topic_id,
        created_by=tutor_id,
        assessment_type=request.assessment_type,
        title=data.get("title", f"{topic.name} {request.assessment_type.value.replace('_', ' ').title()}"),
        questions_json=data["questions"],
        max_score=max_score,
        ai_generated=True,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment


async def score_attempt(
    request: AttemptCreate,
    student_id: int,
    db: AsyncSession,
) -> AssessmentAttempt:
    """Score an assessment attempt by comparing answers to stored answers."""
    result = await db.execute(
        select(Assessment).where(Assessment.id == request.assessment_id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise NotFoundError("Assessment not found")

    questions = assessment.questions_json
    answers = request.answers_json

    total_score = 0.0
    for answer_item in answers:
        idx = answer_item.get("question_index", -1)
        given = str(answer_item.get("answer", "")).strip().lower()
        if 0 <= idx < len(questions):
            correct = str(questions[idx].get("answer", "")).strip().lower()
            marks = questions[idx].get("marks", 1)
            if given == correct:
                total_score += marks

    attempt = AssessmentAttempt(
        assessment_id=request.assessment_id,
        student_id=student_id,
        session_id=request.session_id,
        answers_json=request.answers_json,
        score=total_score,
        max_score=assessment.max_score,
        confidence_rating=request.confidence_rating,
        time_taken_seconds=request.time_taken_seconds,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt

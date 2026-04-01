from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.session import LessonSession, SessionStatus, AttendanceStatus
from app.models.lesson import LessonPlan
from app.models.student import Student
from app.models.tutor import Tutor
from app.models.audit import AuditLog
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/sessions", tags=["sessions"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/", response_model=SessionResponse, status_code=201)
async def create_session(
    request: Request,
    payload: SessionCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    session = LessonSession(
        tutor_id=tutor.id,
        student_id=payload.student_id,
        lesson_plan_id=payload.lesson_plan_id,
        scheduled_at=payload.scheduled_at,
    )
    db.add(session)
    db.add(AuditLog(
        user_id=current_user.id,
        action="create_session",
        resource_type="lesson_session",
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("/", response_model=list[SessionResponse])
async def list_sessions(
    student_id: int | None = None,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    query = select(LessonSession).where(LessonSession.tutor_id == tutor.id)
    if student_id:
        query = query.where(LessonSession.student_id == student_id)
    query = query.order_by(LessonSession.scheduled_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    return [SessionResponse.model_validate(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(LessonSession).where(
            LessonSession.id == session_id,
            LessonSession.tutor_id == tutor.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")
    return SessionResponse.model_validate(session)


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    request: Request,
    session_id: int,
    payload: SessionUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(LessonSession).where(
            LessonSession.id == session_id,
            LessonSession.tutor_id == tutor.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    db.add(AuditLog(
        user_id=current_user.id,
        action="update_session",
        resource_type="lesson_session",
        resource_id=str(session_id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


# ── Session Insights (post-session AI summary) ─────────────────────────────────

class SessionInsightResponse(BaseModel):
    session_id: int
    highlights: list[str]
    follow_up: list[str]
    recommended_actions: list[str]
    homework_suggestion: str | None
    parent_summary_draft: str | None


def _session_insights(session: LessonSession, student: Student | None, lesson_plan: LessonPlan | None) -> SessionInsightResponse:
    highlights: list[str] = []
    follow_up: list[str] = []
    actions: list[str] = []
    homework_suggestion: str | None = None
    parent_summary: str | None = None

    eng = session.engagement_score or 0
    notes_lower = (session.tutor_notes or "").lower()
    topic_name = lesson_plan.title if lesson_plan else "today's topic"
    student_name = student.first_name if student else "Your child"

    if eng >= 4:
        highlights.append(f"Strong engagement this session ({eng}/5) — student was actively involved.")
    elif eng == 3:
        highlights.append("Moderate engagement — student participated but may benefit from more active tasks.")
    elif 0 < eng <= 2:
        follow_up.append(f"Low engagement recorded ({eng}/5). Consider shorter task chunks or a change of approach next session.")

    if session.attendance_status == AttendanceStatus.PRESENT:
        highlights.append("Student attended on time.")
    elif session.attendance_status == AttendanceStatus.LATE:
        follow_up.append("Student arrived late — check if this is a pattern and address with parent if recurring.")
    elif session.attendance_status == AttendanceStatus.ABSENT:
        follow_up.append("Student was absent. Ensure missed content is covered at the next session.")
        actions.append("Carry planned content forward and consider a parent update.")

    if any(k in notes_lower for k in ["struggled", "difficult", "couldn't", "confused", "unclear"]):
        follow_up.append("Tutor notes indicate areas of difficulty — prioritise reteaching next session.")
    if any(k in notes_lower for k in ["excellent", "great", "fantastic", "mastered", "confident"]):
        highlights.append("Tutor notes record strong performance or mastery moments this session.")
    if any(k in notes_lower for k in ["misconception", "error", "mistake"]):
        follow_up.append("Misconception(s) noted — plan a targeted correction activity next session.")
        actions.append("Log the misconception as an observation on the student's profile.")
    if any(k in notes_lower for k in ["curious", "asked about", "want to know"]):
        highlights.append("Student showed curiosity — a positive sign of engagement with the topic.")

    if lesson_plan:
        content = lesson_plan.content_json or {}
        exit_qs = (content.get("exit_ticket") or {}).get("questions") if isinstance(content, dict) else None
        if exit_qs:
            actions.append(f"Review exit ticket responses to assess understanding of: {lesson_plan.title}.")
        actions.append(f"Plan the next lesson building on: {lesson_plan.title}.")

    if session.attendance_status == AttendanceStatus.PRESENT:
        if eng >= 4:
            homework_suggestion = f"Set an extension or challenge task on {topic_name} to capitalise on high engagement."
        elif eng == 3:
            homework_suggestion = f"Set a consolidation worksheet on {topic_name} to reinforce what was covered."
        elif eng > 0:
            homework_suggestion = f"Set a short retrieval quiz on {topic_name} to rebuild confidence."

    if session.attendance_status == AttendanceStatus.PRESENT:
        eng_desc = "excellently" if eng >= 4 else "well" if eng == 3 else "steadily"
        parent_summary = (
            session.session_summary
            or f"{student_name} attended their session today and engaged {eng_desc}. "
               f"We worked on {topic_name}. "
               + ("There are some areas we will revisit next time." if follow_up else "Good progress was made.")
        )

    if not highlights:
        highlights.append("Session completed — no specific highlights recorded.")
    if not follow_up:
        follow_up.append("No specific follow-up areas identified. Continue at the current pace.")
    if not actions:
        actions.append("Log any homework and plan the next session.")

    return SessionInsightResponse(
        session_id=session.id,
        highlights=highlights,
        follow_up=follow_up,
        recommended_actions=actions,
        homework_suggestion=homework_suggestion,
        parent_summary_draft=parent_summary,
    )


@router.get("/{session_id}/insights", response_model=SessionInsightResponse)
async def get_session_insights(
    session_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Post-session AI insight summary. Rule-based, fully explainable."""
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(select(LessonSession).where(LessonSession.id == session_id, LessonSession.tutor_id == tutor.id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Session not found")

    student = None
    if session.student_id:
        s_res = await db.execute(select(Student).where(Student.id == session.student_id))
        student = s_res.scalar_one_or_none()

    lesson_plan = None
    if session.lesson_plan_id:
        lp_res = await db.execute(select(LessonPlan).where(LessonPlan.id == session.lesson_plan_id))
        lesson_plan = lp_res.scalar_one_or_none()

    return _session_insights(session, student, lesson_plan)


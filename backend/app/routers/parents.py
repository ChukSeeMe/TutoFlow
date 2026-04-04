"""
Parents/guardians router.

Tutor creates parent accounts. The system generates a temporary password
and stores the parent user. In a future phase this will trigger an email invite.
For MVP, the tutor shares credentials directly.

Privacy boundary: parents can only see their linked child's approved data.
"""
import secrets
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc

from app.database import get_db
from app.models.user import User, UserRole
from app.models.tutor import Tutor
from app.models.parent import ParentGuardian, StudentParentLink
from app.models.student import Student
from app.models.session import LessonSession, SessionStatus, AttendanceStatus
from app.models.progress import ProgressRecord
from app.models.student import MasteryStatus
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.report import Report, Communication
from app.models.audit import AuditLog
from app.schemas.parent import (
    ParentCreate, ParentUpdate, ParentResponse,
    ParentWithStudentsResponse, LinkStudentRequest, ChildSummaryResponse,
)
from app.core.security import hash_password
from app.core.dependencies import require_tutor, require_parent
from app.core.exceptions import NotFoundError, ForbiddenError, ConflictError

router = APIRouter(prefix="/parents", tags=["parents"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


# ── Tutor-facing endpoints ─────────────────────────────────────────────────────

@router.post("", response_model=ParentResponse, status_code=201)
async def create_parent(
    request: Request,
    payload: ParentCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a parent/guardian account.
    A temporary password is auto-generated. Share it with the parent securely.
    MVP: tutor shares credentials directly. Phase 2 will add email invite.
    """
    # Check email not already registered
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise ConflictError("An account with this email already exists")

    temp_password = secrets.token_urlsafe(12)

    parent_user = User(
        email=payload.email.lower(),
        password_hash=hash_password(temp_password),
        role=UserRole.PARENT,
        is_active=True,
        is_verified=False,
    )
    db.add(parent_user)
    await db.flush()

    parent = ParentGuardian(
        user_id=parent_user.id,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone,
        relationship_label=payload.relationship_label,
        communication_preference=payload.communication_preference,
    )
    db.add(parent)

    db.add(AuditLog(
        user_id=current_user.id,
        action="create_parent",
        resource_type="parent",
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(parent)

    # Return with temp password in the response (only shown once)
    response = ParentResponse(
        id=parent.id,
        first_name=parent.first_name,
        last_name=parent.last_name,
        full_name=parent.full_name,
        phone=parent.phone,
        relationship_label=parent.relationship_label,
        communication_preference=parent.communication_preference,
        user_id=parent.user_id,
        created_at=parent.created_at,
    )
    # Attach temp password to response dict so tutor can share it
    response_dict = response.model_dump()
    response_dict["temp_password"] = temp_password
    return response_dict


@router.get("", response_model=list[ParentWithStudentsResponse])
async def list_parents(
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    List all parents linked to students this tutor teaches.
    """
    tutor = await _get_tutor(current_user, db)

    # Get students belonging to this tutor
    students_result = await db.execute(
        select(Student.id).where(Student.tutor_id == tutor.id)
    )
    student_ids = [row[0] for row in students_result.all()]

    if not student_ids:
        return []

    # Get parent links for those students
    links_result = await db.execute(
        select(StudentParentLink)
        .where(StudentParentLink.student_id.in_(student_ids))
    )
    links = links_result.scalars().all()

    parent_ids = list({link.parent_id for link in links})
    if not parent_ids:
        return []

    parents_result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.id.in_(parent_ids))
    )
    parents = parents_result.scalars().all()

    # Build parent → student list map
    parent_student_map: dict[int, list[int]] = {}
    for link in links:
        parent_student_map.setdefault(link.parent_id, []).append(link.student_id)

    return [
        ParentWithStudentsResponse(
            id=p.id,
            first_name=p.first_name,
            last_name=p.last_name,
            full_name=p.full_name,
            phone=p.phone,
            relationship_label=p.relationship_label,
            communication_preference=p.communication_preference,
            user_id=p.user_id,
            created_at=p.created_at,
            linked_student_ids=parent_student_map.get(p.id, []),
        )
        for p in parents
    ]


@router.get("/{parent_id}", response_model=ParentWithStudentsResponse)
async def get_parent(
    parent_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.id == parent_id)
    )
    parent = result.scalar_one_or_none()
    if not parent:
        raise NotFoundError("Parent not found")

    links_result = await db.execute(
        select(StudentParentLink).where(StudentParentLink.parent_id == parent_id)
    )
    links = links_result.scalars().all()
    student_ids = [link.student_id for link in links]

    return ParentWithStudentsResponse(
        id=parent.id,
        first_name=parent.first_name,
        last_name=parent.last_name,
        full_name=parent.full_name,
        phone=parent.phone,
        relationship_label=parent.relationship_label,
        communication_preference=parent.communication_preference,
        user_id=parent.user_id,
        created_at=parent.created_at,
        linked_student_ids=student_ids,
    )


@router.patch("/{parent_id}", response_model=ParentResponse)
async def update_parent(
    parent_id: int,
    payload: ParentUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.id == parent_id)
    )
    parent = result.scalar_one_or_none()
    if not parent:
        raise NotFoundError("Parent not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(parent, field, value)

    await db.commit()
    await db.refresh(parent)
    return ParentResponse.model_validate(parent)


@router.post("/{parent_id}/link/{student_id}", status_code=201)
async def link_student_to_parent(
    parent_id: int,
    student_id: int,
    payload: LinkStudentRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Link a parent to a student. Only the tutor who teaches the student can do this."""
    tutor = await _get_tutor(current_user, db)

    # Verify student belongs to this tutor
    student_result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    # Check parent exists
    parent_result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.id == parent_id)
    )
    parent = parent_result.scalar_one_or_none()
    if not parent:
        raise NotFoundError("Parent not found")

    # Check not already linked
    existing_link = await db.execute(
        select(StudentParentLink).where(
            StudentParentLink.student_id == student_id,
            StudentParentLink.parent_id == parent_id,
        )
    )
    if existing_link.scalar_one_or_none():
        raise ConflictError("This parent is already linked to this student")

    link = StudentParentLink(
        student_id=student_id,
        parent_id=parent_id,
        is_primary=payload.is_primary,
    )
    db.add(link)
    await db.commit()
    return {"message": "Parent linked to student", "student_id": student_id, "parent_id": parent_id}


@router.delete("/{parent_id}/link/{student_id}", status_code=204)
async def unlink_student_from_parent(
    parent_id: int,
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    student_result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id)
    )
    if not student_result.scalar_one_or_none():
        raise NotFoundError("Student not found")

    link_result = await db.execute(
        select(StudentParentLink).where(
            StudentParentLink.student_id == student_id,
            StudentParentLink.parent_id == parent_id,
        )
    )
    link = link_result.scalar_one_or_none()
    if not link:
        raise NotFoundError("Link not found")

    await db.delete(link)
    await db.commit()


# ── Parent-facing endpoints ────────────────────────────────────────────────────

@router.get("/my/children", response_model=list[ChildSummaryResponse])
async def get_my_children(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """Parent views summary of their linked children. Read-only, approved data only."""
    parent_result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.user_id == current_user.id)
    )
    parent = parent_result.scalar_one_or_none()
    if not parent:
        raise NotFoundError("Parent profile not found")

    links_result = await db.execute(
        select(StudentParentLink).where(StudentParentLink.parent_id == parent.id)
    )
    links = links_result.scalars().all()

    summaries = []
    for link in links:
        student_result = await db.execute(
            select(Student).where(Student.id == link.student_id)
        )
        student = student_result.scalar_one_or_none()
        if not student or not student.is_active:
            continue

        # Session stats
        sessions_result = await db.execute(
            select(LessonSession).where(
                LessonSession.student_id == student.id,
                LessonSession.status == SessionStatus.DELIVERED,
            )
        )
        sessions = sessions_result.scalars().all()
        total = len(sessions)
        attended = sum(1 for s in sessions if s.attendance_status == AttendanceStatus.PRESENT)
        attendance_rate = attended / total if total > 0 else 1.0
        last_session = sessions[-1].scheduled_at if sessions else None

        # Mastery counts
        progress_result = await db.execute(
            select(ProgressRecord).where(ProgressRecord.student_id == student.id)
        )
        progress = progress_result.scalars().all()
        topics_secure = sum(1 for p in progress if p.mastery_status == MasteryStatus.SECURE)
        topics_reteach = sum(1 for p in progress if p.mastery_status == MasteryStatus.NEEDS_RETEACH)

        # Outstanding homework
        hw_result = await db.execute(
            select(func.count(HomeworkTask.id)).where(
                HomeworkTask.student_id == student.id,
                HomeworkTask.status == HomeworkStatus.SET,
            )
        )
        outstanding_hw = hw_result.scalar() or 0

        summaries.append(ChildSummaryResponse(
            student_id=student.id,
            first_name=student.first_name,
            year_group=student.year_group,
            key_stage=student.key_stage.value if student.key_stage else None,
            total_sessions=total,
            attendance_rate=round(attendance_rate, 3),
            topics_secure=topics_secure,
            topics_needs_reteach=topics_reteach,
            last_session_date=last_session,
            outstanding_homework=outstanding_hw,
        ))

    return summaries


# ── Helper: resolve parent + linked student IDs ────────────────────────────────

async def _get_parent_student_ids(current_user: User, db: AsyncSession) -> tuple[ParentGuardian, list[int]]:
    parent_result = await db.execute(
        select(ParentGuardian).where(ParentGuardian.user_id == current_user.id)
    )
    parent = parent_result.scalar_one_or_none()
    if not parent:
        raise NotFoundError("Parent profile not found")

    links_result = await db.execute(
        select(StudentParentLink.student_id).where(StudentParentLink.parent_id == parent.id)
    )
    student_ids = [row[0] for row in links_result.all()]
    return parent, student_ids


# ── Parent: Activity Timeline ──────────────────────────────────────────────────

@router.get("/my/timeline")
async def get_my_timeline(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """
    Chronological activity feed for all linked children.
    Merges: delivered sessions, homework tasks, tutor-approved reports.
    """
    _, student_ids = await _get_parent_student_ids(current_user, db)
    if not student_ids:
        return []

    events: list[dict[str, Any]] = []

    # Sessions (delivered only — no sensitive notes)
    sessions_result = await db.execute(
        select(LessonSession, Student.first_name.label("student_name"))
        .join(Student, Student.id == LessonSession.student_id)
        .where(
            LessonSession.student_id.in_(student_ids),
            LessonSession.status == SessionStatus.DELIVERED,
        )
        .order_by(desc(LessonSession.scheduled_at))
        .limit(50)
    )
    for row in sessions_result.mappings():
        s: LessonSession = row["LessonSession"]
        duration_min: int | None = None
        if s.started_at and s.ended_at:
            duration_min = int((s.ended_at - s.started_at).total_seconds() / 60)
        events.append({
            "type": "session",
            "date": s.scheduled_at.isoformat(),
            "student_name": row["student_name"],
            "student_id": s.student_id,
            "id": s.id,
            "attendance": s.attendance_status.value,
            "engagement": s.engagement_score,
            "summary": s.session_summary,
            "duration_min": duration_min,
        })

    # Homework tasks (tutor-approved only)
    hw_result = await db.execute(
        select(HomeworkTask, Student.first_name.label("student_name"))
        .join(Student, Student.id == HomeworkTask.student_id)
        .where(
            HomeworkTask.student_id.in_(student_ids),
            HomeworkTask.tutor_approved == True,
        )
        .order_by(desc(HomeworkTask.created_at))
        .limit(30)
    )
    for row in hw_result.mappings():
        hw: HomeworkTask = row["HomeworkTask"]
        events.append({
            "type": "homework",
            "date": hw.created_at.isoformat(),
            "student_name": row["student_name"],
            "student_id": hw.student_id,
            "id": hw.id,
            "title": hw.title,
            "status": hw.status.value,
            "due_date": hw.due_date.isoformat() if hw.due_date else None,
        })

    # Reports (tutor-approved only)
    reports_result = await db.execute(
        select(Report, Student.first_name.label("student_name"))
        .join(Student, Student.id == Report.student_id)
        .where(
            Report.student_id.in_(student_ids),
            Report.tutor_approved == True,
        )
        .order_by(desc(Report.approved_at))
        .limit(20)
    )
    for row in reports_result.mappings():
        rpt: Report = row["Report"]
        events.append({
            "type": "report",
            "date": (rpt.approved_at or rpt.created_at).isoformat(),
            "student_name": row["student_name"],
            "student_id": rpt.student_id,
            "id": rpt.id,
            "title": rpt.title,
            "report_type": rpt.report_type.value,
        })

    # Sort all events newest first
    events.sort(key=lambda e: e["date"], reverse=True)
    return events[:60]


# ── Parent: Session Notes ──────────────────────────────────────────────────────

@router.get("/my/sessions")
async def get_my_sessions(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """
    List delivered sessions with tutor-approved summaries for parent view.
    Private tutor_notes are never exposed.
    """
    _, student_ids = await _get_parent_student_ids(current_user, db)
    if not student_ids:
        return []

    result = await db.execute(
        select(LessonSession, Student.first_name.label("student_name"))
        .join(Student, Student.id == LessonSession.student_id)
        .where(
            LessonSession.student_id.in_(student_ids),
            LessonSession.status == SessionStatus.DELIVERED,
        )
        .order_by(desc(LessonSession.scheduled_at))
        .limit(100)
    )

    sessions = []
    for row in result.mappings():
        s: LessonSession = row["LessonSession"]
        duration_min: int | None = None
        if s.started_at and s.ended_at:
            duration_min = int((s.ended_at - s.started_at).total_seconds() / 60)
        sessions.append({
            "id": s.id,
            "student_id": s.student_id,
            "student_name": row["student_name"],
            "scheduled_at": s.scheduled_at.isoformat(),
            "attendance": s.attendance_status.value,
            "engagement": s.engagement_score,
            "summary": s.session_summary,   # tutor-approved share; no tutor_notes
            "duration_min": duration_min,
        })
    return sessions


# ── Parent: Messages ───────────────────────────────────────────────────────────

class MessageSendRequest(BaseModel):
    student_id: int
    subject: str
    body: str


@router.get("/my/messages")
async def get_my_messages(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """
    List all Communications (tutor → parent messages + parent replies).
    Filters to messages involving this parent's user account.
    """
    _, student_ids = await _get_parent_student_ids(current_user, db)
    if not student_ids:
        return []

    result = await db.execute(
        select(Communication)
        .where(
            or_(
                Communication.from_user_id == current_user.id,
                Communication.to_user_id == current_user.id,
            ),
            Communication.student_id.in_(student_ids),
        )
        .order_by(desc(Communication.created_at))
        .limit(100)
    )
    messages = result.scalars().all()

    # Mark unread as read
    now = datetime.now(timezone.utc)
    for msg in messages:
        if msg.to_user_id == current_user.id and msg.read_at is None:
            msg.read_at = now
    await db.commit()

    return [
        {
            "id": m.id,
            "from_user_id": m.from_user_id,
            "to_user_id": m.to_user_id,
            "student_id": m.student_id,
            "subject": m.subject,
            "body": m.body,
            "sent_at": m.sent_at.isoformat() if m.sent_at else None,
            "read_at": m.read_at.isoformat() if m.read_at else None,
            "created_at": m.created_at.isoformat(),
            "direction": "outbound" if m.from_user_id == current_user.id else "inbound",
        }
        for m in messages
    ]


@router.post("/my/messages", status_code=201)
async def send_message(
    payload: MessageSendRequest,
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """Parent sends a message to their child's tutor."""
    parent, student_ids = await _get_parent_student_ids(current_user, db)

    if payload.student_id not in student_ids:
        raise ForbiddenError("Not authorised to message about this student")

    # Find the tutor for this student
    student_result = await db.execute(
        select(Student).where(Student.id == payload.student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    tutor_result = await db.execute(
        select(Tutor).where(Tutor.id == student.tutor_id)
    )
    tutor = tutor_result.scalar_one_or_none()
    if not tutor:
        raise NotFoundError("Tutor not found")

    now = datetime.now(timezone.utc)
    msg = Communication(
        from_user_id=current_user.id,
        to_user_id=tutor.user_id,
        student_id=payload.student_id,
        subject=payload.subject,
        body=payload.body,
        ai_drafted=False,
        tutor_approved=True,   # parent-originated messages don't need approval
        sent_at=now,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return {"id": msg.id, "message": "Message sent"}


# ── Parent: Invoice / Session Billing Summary ──────────────────────────────────

DEFAULT_HOURLY_RATE = 35.0   # £ — used if no per-student rate is configured

@router.get("/my/invoice")
async def get_my_invoice(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """
    Compute a billing summary from delivered sessions.
    Duration is derived from started_at / ended_at; default 60 min if not recorded.
    Rate: £35/hr (MVP default — per-student rate configuration is a future feature).
    """
    _, student_ids = await _get_parent_student_ids(current_user, db)
    if not student_ids:
        return {"children": [], "total_sessions": 0, "total_hours": 0.0, "total_amount": 0.0}

    result = await db.execute(
        select(LessonSession, Student.first_name.label("student_name"))
        .join(Student, Student.id == LessonSession.student_id)
        .where(
            LessonSession.student_id.in_(student_ids),
            LessonSession.status == SessionStatus.DELIVERED,
            LessonSession.attendance_status == AttendanceStatus.PRESENT,
        )
        .order_by(LessonSession.student_id, desc(LessonSession.scheduled_at))
    )

    # Group by child
    by_child: dict[int, dict] = {}
    for row in result.mappings():
        s: LessonSession = row["LessonSession"]
        if s.student_id not in by_child:
            by_child[s.student_id] = {
                "student_id": s.student_id,
                "student_name": row["student_name"],
                "sessions": [],
                "total_sessions": 0,
                "total_hours": 0.0,
                "total_amount": 0.0,
                "hourly_rate": DEFAULT_HOURLY_RATE,
            }

        # Duration
        if s.started_at and s.ended_at:
            hours = (s.ended_at - s.started_at).total_seconds() / 3600
        else:
            hours = 1.0   # assume 1 hr if not recorded

        amount = round(hours * DEFAULT_HOURLY_RATE, 2)
        by_child[s.student_id]["sessions"].append({
            "session_id": s.id,
            "date": s.scheduled_at.isoformat(),
            "hours": round(hours, 2),
            "amount": amount,
        })
        by_child[s.student_id]["total_sessions"] += 1
        by_child[s.student_id]["total_hours"] += hours
        by_child[s.student_id]["total_amount"] += amount

    children = list(by_child.values())
    for c in children:
        c["total_hours"] = round(c["total_hours"], 2)
        c["total_amount"] = round(c["total_amount"], 2)

    grand_sessions = sum(c["total_sessions"] for c in children)
    grand_hours = round(sum(c["total_hours"] for c in children), 2)
    grand_amount = round(sum(c["total_amount"] for c in children), 2)

    return {
        "children": children,
        "total_sessions": grand_sessions,
        "total_hours": grand_hours,
        "total_amount": grand_amount,
        "currency": "GBP",
        "hourly_rate": DEFAULT_HOURLY_RATE,
    }

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.tutor import Tutor
from app.models.audit import AuditLog
from app.schemas.student import StudentCreate, StudentUpdate, StudentDetailResponse, StudentResponse
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/students", tags=["students"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.get("", response_model=list[StudentResponse])
async def list_students(
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Student).where(Student.tutor_id == tutor.id, Student.is_active == True)
        .order_by(Student.last_name, Student.first_name)
    )
    students = result.scalars().all()
    return [
        StudentResponse(
            id=s.id, first_name=s.first_name, last_name=s.last_name,
            full_name=s.full_name, date_of_birth=s.date_of_birth,
            year_group=s.year_group, key_stage=s.key_stage,
            ability_band=s.ability_band, is_active=s.is_active,
            created_at=s.created_at,
        )
        for s in students
    ]


@router.post("", response_model=StudentDetailResponse, status_code=201)
async def create_student(
    request: Request,
    payload: StudentCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    student = Student(tutor_id=tutor.id, **payload.model_dump())
    db.add(student)
    await db.flush()
    db.add(AuditLog(
        user_id=current_user.id,
        action="create_student",
        resource_type="student",
        resource_id=str(student.id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(student)
    return StudentDetailResponse.model_validate(student)


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")
    return StudentDetailResponse.model_validate(student)


@router.patch("/{student_id}", response_model=StudentDetailResponse)
async def update_student(
    request: Request,
    student_id: int,
    payload: StudentUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    db.add(AuditLog(
        user_id=current_user.id,
        action="update_student",
        resource_type="student",
        resource_id=str(student.id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()
    await db.refresh(student)
    return StudentDetailResponse.model_validate(student)


@router.delete("/{student_id}", status_code=204)
async def deactivate_student(
    request: Request,
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete — sets is_active=False. Data is retained."""
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    student.is_active = False
    db.add(AuditLog(
        user_id=current_user.id,
        action="deactivate_student",
        resource_type="student",
        resource_id=str(student.id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()


# ── SEND / Support notes endpoint ─────────────────────────────────────────────

class SendUpdateRequest(BaseModel):
    send_notes: str | None = None
    support_strategies: str | None = None
    preferred_scaffolds: str | None = None
    literacy_notes: str | None = None
    communication_preferences: str | None = None
    additional_considerations: dict | None = None


class SendStrategyResponse(BaseModel):
    student_id: int
    send_notes: str | None
    support_strategies: str | None
    preferred_scaffolds: str | None
    literacy_notes: str | None
    communication_preferences: str | None
    additional_considerations: dict | None
    ai_strategies: list[dict]


def _generate_send_strategies(student: Student) -> list[dict]:
    """
    Rule-based SEND strategy suggestions. Deterministic and explainable.
    """
    strategies = []
    notes_lower = (student.send_notes or "").lower()
    lit_lower = (student.literacy_notes or "").lower()
    scaffolds_lower = (student.preferred_scaffolds or "").lower()
    add_lower = str(student.additional_considerations or "").lower()

    # Dyslexia / literacy
    if any(k in notes_lower or k in lit_lower for k in ["dyslexia", "dyslexic", "reading difficulty", "phonics", "decoding"]):
        strategies += [
            {"category": "Literacy Support", "strategy": "Use dyslexia-friendly fonts and coloured overlays on printed worksheets.", "rationale": "Detected literacy/dyslexia indicator in notes.", "source": "send_notes / literacy_notes"},
            {"category": "Literacy Support", "strategy": "Break written tasks into short numbered steps. Offer oral or recorded responses as alternatives.", "rationale": "Reduces written output demands for students with decoding difficulties.", "source": "literacy_notes"},
        ]

    # ADHD / attention
    if any(k in notes_lower for k in ["adhd", "attention", "focus", "hyperactiv", "impulsi"]):
        strategies += [
            {"category": "Attention & Focus", "strategy": "Use 10–15 minute task chunks with movement or brain-break transitions.", "rationale": "Detected ADHD / attention difficulty.", "source": "send_notes"},
            {"category": "Attention & Focus", "strategy": "Provide a visual timer and task checklist at session start.", "rationale": "External structure reduces cognitive load.", "source": "send_notes"},
        ]

    # Autism / ASD
    if any(k in notes_lower for k in ["autism", "asd", "autistic", "asperger", "social communication"]):
        strategies += [
            {"category": "Communication & Routine", "strategy": "Follow a predictable session structure and give advance notice of any changes.", "rationale": "Predictability reduces anxiety for ASD students.", "source": "send_notes"},
            {"category": "Communication & Routine", "strategy": "Use explicit, literal language. Avoid idioms without explanation.", "rationale": "Social communication differences may affect figurative language.", "source": "send_notes"},
        ]

    # Sensory
    if any(k in notes_lower or k in add_lower for k in ["sensory", "noise", "sensitive", "overwhelm", "tactile"]):
        strategies.append({"category": "Sensory", "strategy": "Minimise background noise and visual clutter. Use a quiet, consistent environment.", "rationale": "Sensory sensitivity indicator detected.", "source": "additional_considerations / send_notes"})

    # Scaffolding preferences
    if "worked example" in scaffolds_lower or "modelling" in scaffolds_lower:
        strategies.append({"category": "Scaffolding", "strategy": "Lead every new concept with a fully worked example before the student attempts independently.", "rationale": "Preferred scaffold: worked examples / modelling.", "source": "preferred_scaffolds"})
    if "visual" in scaffolds_lower or "diagram" in scaffolds_lower:
        strategies.append({"category": "Scaffolding", "strategy": "Use mind maps, annotated diagrams, and graphic organisers.", "rationale": "Visual scaffolding preference detected.", "source": "preferred_scaffolds"})
    if "verbal" in scaffolds_lower or "oral" in scaffolds_lower:
        strategies.append({"category": "Scaffolding", "strategy": "Encourage verbal explanation and Socratic questioning before written tasks.", "rationale": "Verbal/oral scaffolding preference detected.", "source": "preferred_scaffolds"})

    # General literacy
    if student.literacy_notes and not any(k in lit_lower for k in ["dyslexia", "dyslexic"]):
        strategies.append({"category": "Literacy", "strategy": "Pre-teach key vocabulary before each topic and provide a glossary sheet.", "rationale": "Literacy notes present.", "source": "literacy_notes"})

    # Always-on if SEND notes present
    if student.send_notes:
        strategies.append({"category": "General", "strategy": "Review SEND notes before each session and check in with the student about their energy and focus at the start.", "rationale": "SEND profile present — regular check-ins keep strategies current.", "source": "send_notes"})

    seen: set[str] = set()
    return [s for s in strategies if not (s["strategy"] in seen or seen.add(s["strategy"]))]  # type: ignore[func-returns-value]


@router.get("/{student_id}/send", response_model=SendStrategyResponse)
async def get_send_profile(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Return SEND notes + rule-based AI strategy suggestions."""
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")
    return SendStrategyResponse(
        student_id=student.id,
        send_notes=student.send_notes,
        support_strategies=student.support_strategies,
        preferred_scaffolds=student.preferred_scaffolds,
        literacy_notes=student.literacy_notes,
        communication_preferences=student.communication_preferences,
        additional_considerations=student.additional_considerations,
        ai_strategies=_generate_send_strategies(student),
    )


@router.patch("/{student_id}/send", response_model=SendStrategyResponse)
async def update_send_profile(
    request: Request,
    student_id: int,
    payload: SendUpdateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Update SEND / support notes for a student."""
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(select(Student).where(Student.id == student_id, Student.tutor_id == tutor.id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    db.add(AuditLog(user_id=current_user.id, action="update_send_profile", resource_type="student", resource_id=str(student.id), ip_address=request.client.host if request.client else None))
    await db.commit()
    await db.refresh(student)
    return SendStrategyResponse(
        student_id=student.id,
        send_notes=student.send_notes,
        support_strategies=student.support_strategies,
        preferred_scaffolds=student.preferred_scaffolds,
        literacy_notes=student.literacy_notes,
        communication_preferences=student.communication_preferences,
        additional_considerations=student.additional_considerations,
        ai_strategies=_generate_send_strategies(student),
    )

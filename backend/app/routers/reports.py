from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.tutor import Tutor
from app.schemas.report import ReportGenerateRequest, ReportApproveRequest, ReportResponse
from app.services.report_service import generate_report
from app.services.pdf_service import generate_pdf
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.student import Student
from app.models.parent import ParentGuardian, StudentParentLink
from app.models.user import User as UserModel
from app.services.email_service import send_report_shared

router = APIRouter(prefix="/reports", tags=["reports"])
limiter = Limiter(key_func=get_remote_address)


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/generate", response_model=ReportResponse, status_code=201)
@limiter.limit("10/hour")
async def generate(
    request: Request,
    payload: ReportGenerateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI-drafted report. Must be approved by tutor before use."""
    tutor = await _get_tutor(current_user, db)
    report = await generate_report(payload, tutor.id, db)
    return ReportResponse.model_validate(report)


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    student_id: int | None = None,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    query = select(Report).where(Report.generated_by == tutor.id)
    if student_id:
        query = query.where(Report.student_id == student_id)
    query = query.order_by(Report.created_at.desc())
    result = await db.execute(query)
    return [ReportResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.generated_by == tutor.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report not found")
    return ReportResponse.model_validate(report)


@router.post("/{report_id}/approve", response_model=ReportResponse)
async def approve_report(
    report_id: int,
    payload: ReportApproveRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    Tutor reviews AI draft, edits it, and approves.
    Only approved reports can be downloaded as PDF.
    """
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.generated_by == tutor.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report not found")

    report.final_text = payload.final_text
    report.tutor_approved = True
    report.approved_at = datetime.now(timezone.utc)

    # Generate PDF
    pdf_path = generate_pdf(
        report_id=report.id,
        content_json=report.content_json,
        final_text=report.final_text,
        tutor_name=tutor.full_name,
        report_type=report.report_type.value,
    )
    report.pdf_path = pdf_path

    await db.commit()
    await db.refresh(report)

    # Notify linked parents — fire-and-forget
    student_result = await db.execute(
        select(Student).where(Student.id == report.student_id)
    )
    student = student_result.scalar_one_or_none()
    if student:
        links_result = await db.execute(
            select(StudentParentLink, ParentGuardian, UserModel)
            .join(ParentGuardian, ParentGuardian.id == StudentParentLink.parent_id)
            .join(UserModel, UserModel.id == ParentGuardian.user_id)
            .where(StudentParentLink.student_id == student.id)
        )
        for _link, parent, parent_user in links_result.all():
            send_report_shared(
                to_email=parent_user.email,
                parent_name=parent.first_name,
                student_name=student.first_name,
                report_title=report.title,
                tutor_name=tutor.full_name,
            )

    return ReportResponse.model_validate(report)


@router.get("/{report_id}/pdf")
async def download_pdf(
    report_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Download the generated PDF. Only available after tutor approval."""
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.generated_by == tutor.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report not found")
    if not report.tutor_approved or not report.pdf_path:
        raise ForbiddenError("Report must be approved before downloading")

    pdf_file = Path(report.pdf_path)
    if not pdf_file.exists():
        raise NotFoundError("PDF file not found. Please re-generate.")

    suffix = pdf_file.suffix  # ".pdf" or ".html"
    media_type = "application/pdf" if suffix == ".pdf" else "text/html"
    content = pdf_file.read_bytes()

    filename = f"report_{report_id}{suffix}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

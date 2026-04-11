"""
Admin-only API router.
All endpoints require a valid JWT with role == "admin".
"""
import csv
import io
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse
from jinja2 import Environment, BaseLoader
from pydantic import BaseModel
from sqlalchemy import and_, or_, select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.models.session import LessonSession, SessionStatus, AttendanceStatus
from app.models.lesson import LessonPlan
from app.models.student import Student
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.report import Report
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError, NotFoundError

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Auth dependency ────────────────────────────────────────────────────────────

async def require_admin(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise UnauthorizedError("Missing token")
    try:
        payload = decode_token(auth.split(" ", 1)[1])
    except ValueError:
        raise UnauthorizedError("Invalid token")
    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.ADMIN or not user.is_active:
        raise UnauthorizedError("Admin access required")
    return user


# ── Schemas ────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    # Users
    total_users: int
    tutors: int
    students: int
    parents: int
    admins: int
    active_users: int
    inactive_users: int
    verified_users: int
    new_users_this_month: int
    new_users_today: int
    # Sessions
    total_sessions: int
    sessions_this_week: int
    sessions_delivered: int
    sessions_cancelled: int
    sessions_no_show: int
    avg_engagement: float | None
    attendance_rate: float | None
    # Content
    total_lessons: int
    ai_lessons: int
    total_students: int
    # Homework
    homework_set: int
    homework_submitted: int
    homework_overdue: int
    # Reports
    reports_generated: int
    reports_approved: int
    # Security
    logins_today: int
    failed_logins_today: int
    failed_logins_last_hour: int


class DailyPoint(BaseModel):
    date: str
    new_users: int
    sessions: int
    lessons: int


class SessionStatusBreakdown(BaseModel):
    status: str
    count: int


class HomeworkBreakdown(BaseModel):
    status: str
    count: int


class PlatformInsights(BaseModel):
    daily_activity: list[DailyPoint]
    session_status_breakdown: list[SessionStatusBreakdown]
    homework_breakdown: list[HomeworkBreakdown]
    ai_usage: dict[str, int]   # lessons, homework, reports counts
    pending_approvals: dict[str, int]  # lessons, homework, reports unapproved


class HealthStatus(BaseModel):
    db_ok: bool
    db_latency_ms: float
    total_audit_logs: int
    failed_logins_last_hour: int
    last_event_at: datetime | None
    table_counts: dict[str, int]
    uptime_note: str


class UserRow(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: datetime | None

    class Config:
        from_attributes = True


class AuditRowFull(BaseModel):
    id: int
    user_id: int | None
    user_email: str | None       # joined from users table
    user_role: str | None        # joined from users table
    student_id: int | None
    action: str
    resource_type: str
    resource_id: str | None
    ip_address: str | None
    created_at: datetime
    detail_json: dict | None


class AuditPageResponse(BaseModel):
    items: list[AuditRowFull]
    total: int
    page: int
    pages: int


class UpdateUserRequest(BaseModel):
    is_active: bool | None = None
    role: str | None = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _day_start(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)

def _hour_ago(dt: datetime) -> datetime:
    return dt - timedelta(hours=1)

def _week_ago(dt: datetime) -> datetime:
    return dt - timedelta(days=7)


# ── /stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    now         = datetime.now(timezone.utc)
    today_start = _day_start(now)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_start  = _week_ago(now)
    hour_ago    = _hour_ago(now)

    async def count(model, *filters):
        q = select(func.count()).select_from(model)
        for f in filters:
            q = q.where(f)
        return (await db.execute(q)).scalar_one()

    # Users
    total_users   = await count(User)
    tutors        = await count(User, User.role == UserRole.TUTOR)
    students_u    = await count(User, User.role == UserRole.STUDENT)
    parents       = await count(User, User.role == UserRole.PARENT)
    admins        = await count(User, User.role == UserRole.ADMIN)
    active_users  = await count(User, User.is_active == True)
    inactive_users= await count(User, User.is_active == False)
    verified_users= await count(User, User.is_verified == True)
    new_month     = await count(User, User.created_at >= month_start)
    new_today     = await count(User, User.created_at >= today_start)

    # Sessions
    total_sessions   = await count(LessonSession)
    sessions_week    = await count(LessonSession, LessonSession.scheduled_at >= week_start)
    sessions_deliv   = await count(LessonSession, LessonSession.status == SessionStatus.DELIVERED)
    sessions_cancel  = await count(LessonSession, LessonSession.status == SessionStatus.CANCELLED)
    sessions_noshow  = await count(LessonSession, LessonSession.status == SessionStatus.NO_SHOW)

    eng_result = (await db.execute(
        select(func.avg(LessonSession.engagement_score))
        .where(LessonSession.engagement_score.isnot(None))
    )).scalar_one()
    avg_engagement = round(float(eng_result), 2) if eng_result else None

    present_count = await count(LessonSession, LessonSession.attendance_status == AttendanceStatus.PRESENT)
    att_rate = round((present_count / total_sessions) * 100, 1) if total_sessions else None

    # Content
    total_lessons = await count(LessonPlan)
    ai_lessons    = await count(LessonPlan, LessonPlan.ai_generated == True)
    total_stud    = await count(Student)

    # Homework
    hw_set       = await count(HomeworkTask, HomeworkTask.status == HomeworkStatus.SET)
    hw_submitted = await count(HomeworkTask, HomeworkTask.status == HomeworkStatus.SUBMITTED)
    hw_overdue   = await count(HomeworkTask, HomeworkTask.status == HomeworkStatus.OVERDUE)

    # Reports
    reports_gen  = await count(Report)
    reports_appr = await count(Report, Report.tutor_approved == True)

    # Security / audit
    logins_today     = await count(AuditLog,
        AuditLog.action == "login",
        AuditLog.created_at >= today_start)
    failed_today     = await count(AuditLog,
        AuditLog.action == "login_failed",
        AuditLog.created_at >= today_start)
    failed_last_hour = await count(AuditLog,
        AuditLog.action == "login_failed",
        AuditLog.created_at >= hour_ago)

    return DashboardStats(
        total_users=total_users, tutors=tutors, students=students_u,
        parents=parents, admins=admins, active_users=active_users,
        inactive_users=inactive_users, verified_users=verified_users,
        new_users_this_month=new_month, new_users_today=new_today,
        total_sessions=total_sessions, sessions_this_week=sessions_week,
        sessions_delivered=sessions_deliv, sessions_cancelled=sessions_cancel,
        sessions_no_show=sessions_noshow, avg_engagement=avg_engagement,
        attendance_rate=att_rate,
        total_lessons=total_lessons, ai_lessons=ai_lessons,
        total_students=total_stud,
        homework_set=hw_set, homework_submitted=hw_submitted, homework_overdue=hw_overdue,
        reports_generated=reports_gen, reports_approved=reports_appr,
        logins_today=logins_today, failed_logins_today=failed_today,
        failed_logins_last_hour=failed_last_hour,
    )


# ── /insights ──────────────────────────────────────────────────────────────────

@router.get("/insights", response_model=PlatformInsights)
async def get_insights(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)

    # ── Daily activity last 14 days ──
    daily: list[DailyPoint] = []
    for i in range(13, -1, -1):
        day_start = _day_start(now - timedelta(days=i))
        day_end   = day_start + timedelta(days=1)

        new_u = (await db.execute(
            select(func.count()).select_from(User)
            .where(User.created_at >= day_start, User.created_at < day_end)
        )).scalar_one()
        sess = (await db.execute(
            select(func.count()).select_from(LessonSession)
            .where(LessonSession.scheduled_at >= day_start, LessonSession.scheduled_at < day_end)
        )).scalar_one()
        less = (await db.execute(
            select(func.count()).select_from(LessonPlan)
            .where(LessonPlan.created_at >= day_start, LessonPlan.created_at < day_end)
        )).scalar_one()

        daily.append(DailyPoint(
            date=day_start.strftime("%d %b"),
            new_users=new_u,
            sessions=sess,
            lessons=less,
        ))

    # ── Session status breakdown ──
    status_rows = (await db.execute(
        select(LessonSession.status, func.count().label("n"))
        .group_by(LessonSession.status)
    )).all()
    session_breakdown = [SessionStatusBreakdown(status=r.status, count=r.n) for r in status_rows]

    # ── Homework breakdown ──
    hw_rows = (await db.execute(
        select(HomeworkTask.status, func.count().label("n"))
        .group_by(HomeworkTask.status)
    )).all()
    hw_breakdown = [HomeworkBreakdown(status=r.status, count=r.n) for r in hw_rows]

    # ── AI usage ──
    ai_lessons = (await db.execute(
        select(func.count()).select_from(LessonPlan).where(LessonPlan.ai_generated == True)
    )).scalar_one()
    ai_homework = (await db.execute(
        select(func.count()).select_from(HomeworkTask).where(HomeworkTask.ai_generated == True)
    )).scalar_one()
    ai_reports = (await db.execute(
        select(func.count()).select_from(Report).where(Report.ai_generated == True)
    )).scalar_one()

    # ── Pending approvals ──
    pend_lessons = (await db.execute(
        select(func.count()).select_from(LessonPlan)
        .where(LessonPlan.ai_generated == True, LessonPlan.tutor_approved == False)
    )).scalar_one()
    pend_homework = (await db.execute(
        select(func.count()).select_from(HomeworkTask)
        .where(HomeworkTask.ai_generated == True, HomeworkTask.tutor_approved == False)
    )).scalar_one()
    pend_reports = (await db.execute(
        select(func.count()).select_from(Report)
        .where(Report.ai_generated == True, Report.tutor_approved == False)
    )).scalar_one()

    return PlatformInsights(
        daily_activity=daily,
        session_status_breakdown=session_breakdown,
        homework_breakdown=hw_breakdown,
        ai_usage={"lessons": ai_lessons, "homework": ai_homework, "reports": ai_reports},
        pending_approvals={"lessons": pend_lessons, "homework": pend_homework, "reports": pend_reports},
    )


# ── /health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthStatus)
async def get_health(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)
    db_ok = False
    latency_ms = 0.0

    try:
        t0 = datetime.now(timezone.utc)
        await db.execute(text("SELECT 1"))
        latency_ms = round((datetime.now(timezone.utc) - t0).total_seconds() * 1000, 2)
        db_ok = True
    except Exception:
        pass

    total_audit = (await db.execute(select(func.count()).select_from(AuditLog))).scalar_one()
    failed_hour = (await db.execute(
        select(func.count()).select_from(AuditLog)
        .where(AuditLog.action == "login_failed", AuditLog.created_at >= now - timedelta(hours=1))
    )).scalar_one()

    last_event = (await db.execute(
        select(AuditLog.created_at).order_by(desc(AuditLog.created_at)).limit(1)
    )).scalar_one_or_none()

    # Row counts for each main table
    counts: dict[str, int] = {}
    for label, model in [
        ("users", User), ("students", Student),
        ("sessions", LessonSession), ("lessons", LessonPlan),
        ("homework", HomeworkTask), ("reports", Report),
        ("audit_logs", AuditLog),
    ]:
        counts[label] = (await db.execute(select(func.count()).select_from(model))).scalar_one()

    return HealthStatus(
        db_ok=db_ok,
        db_latency_ms=latency_ms,
        total_audit_logs=total_audit,
        failed_logins_last_hour=failed_hour,
        last_event_at=last_event,
        table_counts=counts,
        uptime_note="All services running via Docker Compose",
    )


# ── /users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserRow])
async def list_users(
    role: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    q = select(User).order_by(desc(User.created_at)).limit(limit).offset(offset)
    if role:
        q = q.where(User.role == role)
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    result = await db.execute(q)
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserRow)
async def update_user(
    user_id: int,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        try:
            user.role = UserRole(body.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    await db.commit()
    await db.refresh(user)
    return user


# ── Audit helpers ──────────────────────────────────────────────────────────────

_AUDIT_PDF_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;color:#1a1a1a;margin:40px;font-size:11px;line-height:1.5}
    h1{color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;margin-bottom:4px}
    .sub{font-size:12px;color:#374151;margin-bottom:20px}
    .meta{background:#f3f4f6;padding:12px 16px;border-radius:4px;margin-bottom:16px;font-size:11px}
    .summary{display:flex;gap:16px;margin-bottom:20px}
    .scard{background:#dbeafe;color:#1e3a8a;padding:8px 16px;border-radius:4px;text-align:center}
    .scard strong{display:block;font-size:18px}
    table{width:100%;border-collapse:collapse;font-size:9px}
    th{background:#1d4ed8;color:#fff;padding:5px 7px;text-align:left;font-weight:600}
    td{border-bottom:1px solid #e5e7eb;padding:4px 7px;vertical-align:top;word-break:break-word}
    tr:nth-child(even) td{background:#f9fafb}
    .b{padding:2px 5px;border-radius:3px;font-weight:700;font-size:8px}
    .b-ok{background:#d1fae5;color:#065f46}
    .b-fail{background:#fee2e2;color:#991b1b}
    .b-def{background:#e0e7ff;color:#3730a3}
    .footer{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:9px;color:#6b7280}
  </style>
</head>
<body>
  <h1>Teach Harbour — Audit Log Report</h1>
  <p class="sub">{{ title }}</p>
  <div class="meta">
    <strong>Generated:</strong> {{ generated_at }}<br>
    <strong>Exported by:</strong> {{ exported_by }}<br>
    {% if date_from %}<strong>From:</strong> {{ date_from }}<br>{% endif %}
    {% if date_to %}<strong>To:</strong> {{ date_to }}<br>{% endif %}
    {% if student_id %}<strong>Student ID (GDPR SAR):</strong> {{ student_id }}<br>{% endif %}
    {% if filter_summary %}<strong>Filters applied:</strong> {{ filter_summary }}{% endif %}
  </div>
  <div class="summary">
    <div class="scard"><strong>{{ total }}</strong>Records</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Timestamp (UTC)</th><th>User</th><th>Role</th>
        <th>Action</th><th>Entity</th><th>IP</th><th>Details</th>
      </tr>
    </thead>
    <tbody>
      {% for r in rows %}
      <tr>
        <td>{{ r.id }}</td>
        <td>{{ r.created_at }}</td>
        <td>{{ r.user_email or ("uid:" ~ r.user_id) if r.user_id else "system" }}</td>
        <td>{{ r.user_role or "—" }}</td>
        <td>
          <span class="b {% if r.action == 'login' %}b-ok{% elif 'fail' in r.action %}b-fail{% else %}b-def{% endif %}">
            {{ r.action }}
          </span>
        </td>
        <td>{{ r.resource_type }}{% if r.resource_id %} #{{ r.resource_id }}{% endif %}</td>
        <td>{{ r.ip_address or "—" }}</td>
        <td>{{ (r.detail_json | string)[:120] if r.detail_json else "—" }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  <div class="footer">
    Teach Harbour — Confidential. Generated for compliance/audit purposes only.
    © {{ year }} Teach Harbour. All rights reserved.
  </div>
</body>
</html>"""


def _build_audit_filters(
    action: str | None,
    user_id: int | None,
    student_id: int | None,
    ip_address: str | None,
    date_from: str | None,
    date_to: str | None,
) -> list:
    """Return list of SQLAlchemy filter clauses for audit_logs."""
    filters = []
    if action:
        filters.append(AuditLog.action == action)
    if user_id is not None:
        filters.append(AuditLog.user_id == user_id)
    if student_id is not None:
        filters.append(AuditLog.student_id == student_id)
    if ip_address:
        filters.append(AuditLog.ip_address.ilike(f"%{ip_address}%"))
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            filters.append(AuditLog.created_at >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = (datetime.fromisoformat(date_to) + timedelta(days=1)).replace(tzinfo=timezone.utc)
            filters.append(AuditLog.created_at < dt)
        except ValueError:
            pass
    return filters


async def _query_audit_rows(
    db: AsyncSession,
    filters: list,
    limit: int | None = None,
    offset: int = 0,
) -> list[AuditRowFull]:
    """Execute the audit query (with user JOIN) and return AuditRowFull list."""
    q = (
        select(
            AuditLog.id,
            AuditLog.user_id,
            AuditLog.student_id,
            AuditLog.action,
            AuditLog.resource_type,
            AuditLog.resource_id,
            AuditLog.ip_address,
            AuditLog.created_at,
            AuditLog.detail_json,
            User.email.label("user_email"),
            User.role.label("user_role"),
        )
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.created_at))
    )
    if filters:
        q = q.where(and_(*filters))
    q = q.offset(offset)
    if limit is not None:
        q = q.limit(limit)

    rows = (await db.execute(q)).mappings().all()
    return [
        AuditRowFull(
            id=r["id"],
            user_id=r["user_id"],
            user_email=r["user_email"],
            user_role=r["user_role"].value if r["user_role"] else None,
            student_id=r["student_id"],
            action=r["action"],
            resource_type=r["resource_type"],
            resource_id=r["resource_id"],
            ip_address=r["ip_address"],
            created_at=r["created_at"],
            detail_json=r["detail_json"],
        )
        for r in rows
    ]


def _render_audit_pdf(
    items: list[AuditRowFull],
    exported_by: str,
    title: str,
    date_from: str | None = None,
    date_to: str | None = None,
    student_id: int | None = None,
    filter_summary: str = "",
) -> bytes:
    from weasyprint import HTML
    env = Environment(loader=BaseLoader())
    tmpl = env.from_string(_AUDIT_PDF_TEMPLATE)
    html = tmpl.render(
        title=title,
        generated_at=datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC"),
        exported_by=exported_by,
        total=len(items),
        rows=[
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_email": r.user_email,
                "user_role": r.user_role,
                "action": r.action,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "ip_address": r.ip_address,
                "created_at": r.created_at.strftime("%d/%m/%Y %H:%M:%S"),
                "detail_json": r.detail_json,
            }
            for r in items
        ],
        date_from=date_from,
        date_to=date_to,
        student_id=student_id,
        filter_summary=filter_summary,
        year=datetime.now().year,
    )
    return HTML(string=html).write_pdf()


# ── /audit ─────────────────────────────────────────────────────────────────────

@router.get("/audit", response_model=AuditPageResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: str | None = None,
    user_id: int | None = None,
    student_id: int | None = None,
    ip_address: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    filters = _build_audit_filters(action, user_id, student_id, ip_address, date_from, date_to)

    # Total count for pagination
    count_q = select(func.count()).select_from(AuditLog)
    if filters:
        count_q = count_q.where(and_(*filters))
    total = (await db.execute(count_q)).scalar_one()

    offset = (page - 1) * limit
    items = await _query_audit_rows(db, filters, limit=limit, offset=offset)
    pages = max(1, (total + limit - 1) // limit)

    return AuditPageResponse(items=items, total=total, page=page, pages=pages)


@router.get("/audit/export/csv")
async def export_audit_csv(
    action: str | None = None,
    user_id: int | None = None,
    student_id: int | None = None,
    ip_address: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    filters = _build_audit_filters(action, user_id, student_id, ip_address, date_from, date_to)
    items = await _query_audit_rows(db, filters, limit=None)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "ID", "Timestamp (UTC)", "User ID", "User Email", "User Role",
        "Student ID", "Action", "Entity Type", "Entity ID",
        "IP Address", "Details",
    ])
    for r in items:
        writer.writerow([
            r.id,
            r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            r.user_id or "",
            r.user_email or "",
            r.user_role or "",
            r.student_id or "",
            r.action,
            r.resource_type,
            r.resource_id or "",
            r.ip_address or "",
            str(r.detail_json) if r.detail_json else "",
        ])

    filename = f"teach-harbour-audit-{datetime.now().strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audit/export/pdf")
async def export_audit_pdf(
    action: str | None = None,
    user_id: int | None = None,
    student_id: int | None = None,
    ip_address: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    filters = _build_audit_filters(action, user_id, student_id, ip_address, date_from, date_to)
    items = await _query_audit_rows(db, filters, limit=None)

    parts = []
    if action:
        parts.append(f"action={action}")
    if user_id:
        parts.append(f"user_id={user_id}")
    if ip_address:
        parts.append(f"ip={ip_address}")

    pdf_bytes = _render_audit_pdf(
        items=items,
        exported_by=admin.email,
        title="Platform Audit Export",
        date_from=date_from,
        date_to=date_to,
        filter_summary=", ".join(parts) if parts else "None",
    )
    filename = f"teach-harbour-audit-{datetime.now().strftime('%Y%m%d-%H%M')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audit/compliance/{target_student_id}")
async def compliance_export(
    target_student_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    GDPR Subject Access Request — full audit trail for a single student.
    Returns a PDF with every event that touched this student's data.
    """
    # Capture both explicit student_id tag AND resource-level references
    filters = [
        or_(
            AuditLog.student_id == target_student_id,
            and_(
                AuditLog.resource_type == "student",
                AuditLog.resource_id == str(target_student_id),
            ),
        )
    ]
    items = await _query_audit_rows(db, filters, limit=None)

    pdf_bytes = _render_audit_pdf(
        items=items,
        exported_by=admin.email,
        title=f"GDPR Subject Access Request — Student #{target_student_id}",
        student_id=target_student_id,
    )
    filename = f"student-{target_student_id}-audit-trail.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

"""
Async email delivery via aiosmtplib.
All calls are fire-and-forget — email failures never break API responses.
If SMTP is not configured (dev default), emails are logged and skipped.
"""
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import structlog

from app.config import settings

log = structlog.get_logger(__name__)


# ── HTML email templates ───────────────────────────────────────────────────────

def _base_template(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">TutorFlow</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              {body_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f3f4f6;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This message was sent by TutorFlow. All information shared via TutorFlow has been
                personally reviewed and approved by your child&rsquo;s tutor.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _welcome_html(first_name: str) -> str:
    body = f"""
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Welcome to TutorFlow, {first_name}!</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Your tutor account is ready. You can now start adding students, planning lessons,
        and tracking progress.
      </p>
      <a href="{settings.app_base_url}/dashboard"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;
                padding:12px 24px;border-radius:8px;text-decoration:none;">
        Go to dashboard
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        If you didn&rsquo;t create this account, please ignore this email.
      </p>
    """
    return _base_template("Welcome to TutorFlow", body)


def _report_shared_html(parent_name: str, student_name: str, report_title: str, tutor_name: str) -> str:
    body = f"""
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">A new report is ready</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Hi {parent_name}, {tutor_name} has approved and shared a progress report for
        <strong>{student_name}</strong>:
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">{report_title}</p>
      </div>
      <a href="{settings.app_base_url}/reports"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;
                padding:12px 24px;border-radius:8px;text-decoration:none;">
        View report
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        All reports are reviewed and approved by the tutor before being shared with you.
      </p>
    """
    return _base_template(f"New report: {report_title}", body)


def _homework_set_html(student_name: str, homework_title: str, due_date: str | None, tutor_name: str) -> str:
    due_text = f" It is due <strong>{due_date}</strong>." if due_date else ""
    body = f"""
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">New task set</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Hi {student_name}, {tutor_name} has set you a new task:{due_text}
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">{homework_title}</p>
      </div>
      <a href="{settings.app_base_url}/tasks"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;
                padding:12px 24px;border-radius:8px;text-decoration:none;">
        View task
      </a>
    """
    return _base_template(f"New task: {homework_title}", body)


# ── SMTP delivery ──────────────────────────────────────────────────────────────

async def _send(to_email: str, subject: str, html: str) -> None:
    if not settings.email_configured:
        log.info("email_skipped_not_configured", to=to_email, subject=subject)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            use_tls=settings.smtp_use_tls,
            timeout=10,
        )
        log.info("email_sent", to=to_email, subject=subject)
    except Exception as exc:
        # Never propagate — email failure must not break API responses
        log.warning("email_send_failed", to=to_email, subject=subject, error=str(exc))


def _fire(coro) -> None:
    """Schedule a coroutine in the running event loop without awaiting it."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        pass


# ── Public API ─────────────────────────────────────────────────────────────────

def send_welcome(to_email: str, first_name: str) -> None:
    _fire(_send(
        to_email=to_email,
        subject="Welcome to TutorFlow",
        html=_welcome_html(first_name),
    ))


def send_report_shared(
    to_email: str,
    parent_name: str,
    student_name: str,
    report_title: str,
    tutor_name: str,
) -> None:
    _fire(_send(
        to_email=to_email,
        subject=f"New progress report: {report_title}",
        html=_report_shared_html(parent_name, student_name, report_title, tutor_name),
    ))


def send_homework_set(
    to_email: str,
    student_name: str,
    homework_title: str,
    tutor_name: str,
    due_date: str | None = None,
) -> None:
    _fire(_send(
        to_email=to_email,
        subject=f"New task set: {homework_title}",
        html=_homework_set_html(student_name, homework_title, due_date, tutor_name),
    ))

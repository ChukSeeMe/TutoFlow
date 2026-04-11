"""
PDF report generation using WeasyPrint + Jinja2.
Reports are generated server-side and stored on disk.
Only the tutor and linked parent can download a report.
"""
import uuid
from pathlib import Path
from jinja2 import Environment, BaseLoader
from app.config import settings
import structlog

log = structlog.get_logger(__name__)


REPORT_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 40px; line-height: 1.6; }
    h1 { color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; }
    h2 { color: #374151; margin-top: 24px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; }
    .section { margin-bottom: 24px; }
    .tag { display: inline-block; background: #f3f4f6; padding: 2px 8px; border-radius: 3px; margin: 2px; font-size: 0.9em; }
    .strength { color: #166534; }
    .develop { color: #92400e; }
    .disclaimer { font-size: 0.8em; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 12px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Teach Harbour Progress Report</h1>
      <p>Prepared by: <strong>{{ tutor_name }}</strong></p>
    </div>
    <div>
      <p>Date: <strong>{{ generated_date }}</strong></p>
      <span class="badge">{{ report_type }}</span>
    </div>
  </div>

  <div class="section">
    <h2>Report for {{ data.student_name }}</h2>
    <p>Period: {{ data.period }}</p>
    <p>Sessions attended: <strong>{{ data.total_sessions }}</strong>
       ({{ data.attendance_rate }}% attendance)</p>
    {% if data.avg_engagement %}
    <p>Average engagement: <strong>{{ data.avg_engagement }}/5</strong></p>
    {% endif %}
  </div>

  {% if data.topics_covered %}
  <div class="section">
    <h2>Topics Covered</h2>
    {% for topic in data.topics_covered %}
    <span class="tag">{{ topic }}</span>
    {% endfor %}
  </div>
  {% endif %}

  {% if data.secure_topics %}
  <div class="section">
    <h2>Strengths</h2>
    <ul>
    {% for s in data.strengths %}
    <li class="strength">{{ s }}</li>
    {% endfor %}
    </ul>
    <p><strong>Topics showing secure understanding:</strong>
    {% for t in data.secure_topics %}<span class="tag">{{ t }}</span>{% endfor %}</p>
  </div>
  {% endif %}

  {% if data.areas_to_develop %}
  <div class="section">
    <h2>Areas to Develop</h2>
    <ul>
    {% for a in data.areas_to_develop %}
    <li class="develop">{{ a }}</li>
    {% endfor %}
    </ul>
  </div>
  {% endif %}

  {% if data.next_steps %}
  <div class="section">
    <h2>Next Steps</h2>
    <ul>
    {% for step in data.next_steps %}
    <li>{{ step }}</li>
    {% endfor %}
    </ul>
  </div>
  {% endif %}

  {% if final_text %}
  <div class="section">
    <h2>Tutor's Comment</h2>
    <p>{{ final_text | replace('\n', '<br>') }}</p>
  </div>
  {% endif %}

  <p>Homework: {{ data.homework_status }}</p>

  <div class="disclaimer">
    This report was prepared by your tutor using Teach Harbour and has been reviewed and approved
    before sending. Please contact your tutor with any questions.
  </div>
</body>
</html>
"""


def generate_pdf(
    report_id: int,
    content_json: dict,
    final_text: str | None,
    tutor_name: str,
    report_type: str,
) -> str:
    """
    Render the report as PDF and save to disk.
    Returns the file path.
    """
    try:
        from weasyprint import HTML as WeasyprintHTML
    except ImportError:
        log.warning("weasyprint_not_available_generating_html_only")
        return _save_html_fallback(report_id, content_json, final_text, tutor_name, report_type)

    env = Environment(loader=BaseLoader())
    template = env.from_string(REPORT_TEMPLATE)
    from datetime import date
    html_content = template.render(
        data=content_json,
        final_text=final_text,
        tutor_name=tutor_name,
        report_type=report_type.replace("_", " ").title(),
        generated_date=date.today().strftime("%d %B %Y"),
    )

    reports_dir = Path(settings.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    filename = f"report_{report_id}_{uuid.uuid4().hex[:8]}.pdf"
    filepath = reports_dir / filename

    WeasyprintHTML(string=html_content).write_pdf(str(filepath))
    log.info("pdf_generated", path=str(filepath))
    return str(filepath)


def _save_html_fallback(
    report_id: int,
    content_json: dict,
    final_text: str | None,
    tutor_name: str,
    report_type: str,
) -> str:
    """Fallback: save HTML when WeasyPrint is not available."""
    env = Environment(loader=BaseLoader())
    template = env.from_string(REPORT_TEMPLATE)
    from datetime import date
    html_content = template.render(
        data=content_json,
        final_text=final_text,
        tutor_name=tutor_name,
        report_type=report_type.replace("_", " ").title(),
        generated_date=date.today().strftime("%d %B %Y"),
    )
    reports_dir = Path(settings.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    filepath = reports_dir / f"report_{report_id}.html"
    filepath.write_text(html_content, encoding="utf-8")
    return str(filepath)

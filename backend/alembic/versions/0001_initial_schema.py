"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-28

Complete initial schema for TutorFlow MVP.
Run with: alembic upgrade head
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("tutor", "student", "parent", name="userrole"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── tutors ───────────────────────────────────────────────────────────────
    op.create_table(
        "tutors",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("subjects_json", sa.JSON(), nullable=True),
        sa.Column("qualifications_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── students ─────────────────────────────────────────────────────────────
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "tutor_id",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("year_group", sa.String(20), nullable=True),
        sa.Column(
            "key_stage",
            sa.Enum("KS3", "KS4", "KS5", "College", name="keystage"),
            nullable=True,
        ),
        sa.Column(
            "ability_band",
            sa.Enum("Foundation", "Core", "Higher", "Extension", name="abilityband"),
            nullable=True,
        ),
        sa.Column("send_notes", sa.Text(), nullable=True),
        sa.Column("support_strategies", sa.Text(), nullable=True),
        sa.Column("preferred_scaffolds", sa.Text(), nullable=True),
        sa.Column("literacy_notes", sa.Text(), nullable=True),
        sa.Column("communication_preferences", sa.Text(), nullable=True),
        sa.Column("additional_considerations", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── parents_guardians ────────────────────────────────────────────────────
    op.create_table(
        "parents_guardians",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("relationship_label", sa.String(50), server_default="Parent", nullable=False),
        sa.Column("communication_preference", sa.String(20), server_default="email", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── student_parent_links ─────────────────────────────────────────────────
    op.create_table(
        "student_parent_links",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "parent_id",
            sa.Integer(),
            sa.ForeignKey("parents_guardians.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("relationship_label", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("student_id", "parent_id", name="uq_student_parent"),
    )

    # ── subjects ─────────────────────────────────────────────────────────────
    op.create_table(
        "subjects",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("key_stage", sa.String(20), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── topics ───────────────────────────────────────────────────────────────
    op.create_table(
        "topics",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "subject_id",
            sa.Integer(),
            sa.ForeignKey("subjects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("year_group", sa.String(20), nullable=True),
        sa.Column("key_stage", sa.String(20), nullable=True),
        sa.Column("curriculum_ref", sa.String(100), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── lesson_plans ─────────────────────────────────────────────────────────
    op.create_table(
        "lesson_plans",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "tutor_id",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "topic_id",
            sa.Integer(),
            sa.ForeignKey("topics.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column(
            "lesson_type",
            sa.Enum(
                "introduction", "revision", "exam_prep", "intervention",
                "catch_up", "consolidation", "assessment",
                name="lessontype",
            ),
            nullable=False,
            server_default="introduction",
        ),
        sa.Column("duration_minutes", sa.Integer(), server_default="60", nullable=False),
        sa.Column(
            "difficulty_level",
            sa.Enum("foundation", "core", "higher", "extension", name="difficultylevel"),
            nullable=False,
            server_default="core",
        ),
        sa.Column("learning_objective", sa.Text(), nullable=False),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("ai_generated", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("tutor_approved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── lesson_sessions ──────────────────────────────────────────────────────
    op.create_table(
        "lesson_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "lesson_plan_id",
            sa.Integer(),
            sa.ForeignKey("lesson_plans.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tutor_id",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "attendance_status",
            sa.Enum("present", "late", "absent", "cancelled", name="attendancestatus"),
            nullable=False,
            server_default="present",
        ),
        sa.Column("engagement_score", sa.Integer(), nullable=True),
        sa.Column("tutor_notes", sa.Text(), nullable=True),
        sa.Column("session_summary", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("scheduled", "delivered", "cancelled", "no_show", name="sessionstatus"),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── assessments ──────────────────────────────────────────────────────────
    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("lesson_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "topic_id",
            sa.Integer(),
            sa.ForeignKey("topics.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_by",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "assessment_type",
            sa.Enum(
                "quiz", "exit_ticket", "verbal", "written", "homework_check",
                name="assessmenttype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=True),
        sa.Column("questions_json", sa.JSON(), nullable=False),
        sa.Column("max_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_generated", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── assessment_attempts ──────────────────────────────────────────────────
    op.create_table(
        "assessment_attempts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "assessment_id",
            sa.Integer(),
            sa.ForeignKey("assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("lesson_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("answers_json", sa.JSON(), nullable=False),
        sa.Column("score", sa.Float(), server_default="0", nullable=False),
        sa.Column("max_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("confidence_rating", sa.Integer(), nullable=True),
        sa.Column("time_taken_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "attempt_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── progress_records ─────────────────────────────────────────────────────
    op.create_table(
        "progress_records",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "topic_id",
            sa.Integer(),
            sa.ForeignKey("topics.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "mastery_status",
            sa.Enum(
                "not_started", "taught", "practising", "developing",
                "secure", "needs_reteach", "exceeded",
                name="masterystatus",
            ),
            nullable=False,
            server_default="not_started",
        ),
        sa.Column("sessions_on_topic", sa.Integer(), server_default="0", nullable=False),
        sa.Column("average_score", sa.Float(), nullable=True),
        sa.Column("tutor_override", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("last_assessed", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("student_id", "topic_id", name="uq_student_topic_progress"),
    )

    # ── reports ──────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "generated_by",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "report_type",
            sa.Enum(
                "weekly_update", "monthly_summary", "term_report",
                "intervention_summary", "parent_letter", "progress_snapshot",
                name="reporttype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=True),
        sa.Column("period_end", sa.Date(), nullable=True),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("ai_draft", sa.Text(), nullable=True),
        sa.Column("final_text", sa.Text(), nullable=True),
        sa.Column("ai_generated", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("tutor_approved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pdf_path", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── communications ───────────────────────────────────────────────────────
    op.create_table(
        "communications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "from_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "to_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("ai_drafted", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("tutor_approved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── homework_tasks ───────────────────────────────────────────────────────
    op.create_table(
        "homework_tasks",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("lesson_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tutor_id",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("task_content_json", sa.JSON(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("set", "in_progress", "submitted", "marked", "overdue", name="homeworkstatus"),
            nullable=False,
            server_default="set",
        ),
        sa.Column("ai_generated", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("tutor_approved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("tutor_feedback", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── observation_notes ────────────────────────────────────────────────────
    op.create_table(
        "observation_notes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "tutor_id",
            sa.Integer(),
            sa.ForeignKey("tutors.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("lesson_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "note_type",
            sa.Enum(
                "observation", "strength", "misconception", "concern",
                "engagement", "behaviour", "general",
                name="observationnotetype",
            ),
            nullable=False,
            server_default="observation",
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_flagged", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── audit_logs ───────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=False),
        sa.Column("resource_id", sa.String(50), nullable=True),
        sa.Column("detail_json", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
            index=True,
        ),
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("audit_logs")
    op.drop_table("observation_notes")
    op.drop_table("homework_tasks")
    op.drop_table("communications")
    op.drop_table("reports")
    op.drop_table("progress_records")
    op.drop_table("assessment_attempts")
    op.drop_table("assessments")
    op.drop_table("lesson_sessions")
    op.drop_table("lesson_plans")
    op.drop_table("topics")
    op.drop_table("subjects")
    op.drop_table("student_parent_links")
    op.drop_table("parents_guardians")
    op.drop_table("students")
    op.drop_table("tutors")
    op.drop_table("users")

    # Drop enums
    for enum_name in [
        "userrole", "keystage", "abilityband", "masterystatus",
        "lessontype", "difficultylevel", "attendancestatus", "sessionstatus",
        "assessmenttype", "reporttype", "homeworkstatus", "observationnotetype",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")

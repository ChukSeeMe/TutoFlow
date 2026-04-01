"""audit_log: add student_id, action/user_id indexes for fast filtering

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add student_id column to track which student an action affected (GDPR trail)
    op.add_column(
        "audit_logs",
        sa.Column("student_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_audit_logs_student_id",
        "audit_logs", "students",
        ["student_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_audit_logs_student_id", "audit_logs", ["student_id"])

    # Performance indexes for the new filter queries
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_ip ON audit_logs (ip_address)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_ip")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_action")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_user_id")
    op.drop_index("ix_audit_logs_student_id", table_name="audit_logs")
    op.drop_constraint("fk_audit_logs_student_id", "audit_logs", type_="foreignkey")
    op.drop_column("audit_logs", "student_id")

"""add self_reflections table

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "self_reflections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=True),
        sa.Column("confidence_before", sa.Integer(), nullable=True),
        sa.Column("confidence_after", sa.Integer(), nullable=True),
        sa.Column("found_hard", sa.Text(), nullable=True),
        sa.Column("what_helped", sa.Text(), nullable=True),
        sa.Column("what_next", sa.Text(), nullable=True),
        sa.Column("tutor_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["lesson_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_self_reflections_id", "self_reflections", ["id"])
    op.create_index(
        "ix_self_reflections_student_id", "self_reflections", ["student_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_self_reflections_student_id", table_name="self_reflections")
    op.drop_index("ix_self_reflections_id", table_name="self_reflections")
    op.drop_table("self_reflections")

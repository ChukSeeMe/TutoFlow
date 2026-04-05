"""add visual columns to lesson_plans

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("lesson_plans", sa.Column("visual_html", sa.Text(), nullable=True))
    op.add_column(
        "lesson_plans",
        sa.Column("visual_status", sa.String(20), nullable=False, server_default="none"),
    )
    op.add_column(
        "lesson_plans",
        sa.Column("visual_generated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("lesson_plans", "visual_generated_at")
    op.drop_column("lesson_plans", "visual_status")
    op.drop_column("lesson_plans", "visual_html")

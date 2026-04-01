# Communication model is defined in report.py to avoid circular imports.
# This file re-exports it for module clarity.
from app.models.report import Communication

__all__ = ["Communication"]

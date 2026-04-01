# Import all models here so Alembic can detect them for migrations
from app.models.user import User, UserRole
from app.models.tutor import Tutor
from app.models.student import Student, MasteryStatus, AbilityBand, KeyStage
from app.models.parent import ParentGuardian, StudentParentLink
from app.models.curriculum import Subject, Topic
from app.models.lesson import LessonPlan, LessonType, DifficultyLevel
from app.models.session import LessonSession, AttendanceStatus
from app.models.assessment import Assessment, AssessmentType, AssessmentAttempt
from app.models.progress import ProgressRecord
from app.models.observation import ObservationNote, ObservationNoteType
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.report import Report, ReportType
from app.models.communication import Communication
from app.models.audit import AuditLog
from app.models.reflection import SelfReflection

__all__ = [
    "User", "UserRole",
    "Tutor",
    "Student", "MasteryStatus", "AbilityBand", "KeyStage",
    "ParentGuardian", "StudentParentLink",
    "Subject", "Topic",
    "LessonPlan", "LessonType", "DifficultyLevel",
    "LessonSession", "AttendanceStatus",
    "Assessment", "AssessmentType", "AssessmentAttempt",
    "ProgressRecord",
    "ObservationNote", "ObservationNoteType",
    "HomeworkTask", "HomeworkStatus",
    "Report", "ReportType",
    "Communication",
    "AuditLog",
    "SelfReflection",
]

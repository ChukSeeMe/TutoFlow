from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "TutorFlow API"
    environment: str = "development"
    log_level: str = "INFO"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://tutorflow:tutorflow_dev@localhost:5432/tutorflow_db"

    # ── Security ──────────────────────────────────────────────────────────────
    secret_key: str = "change-this-to-a-long-random-secret-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ── CORS ──────────────────────────────────────────────────────────────────
    backend_cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",")]

    # ── AI ────────────────────────────────────────────────────────────────────
    anthropic_api_key: str = ""
    ai_model: str = "claude-opus-4-5"
    ai_max_tokens: int = 4096

    # ── Images (Unsplash) ─────────────────────────────────────────────────────
    unsplash_access_key: str = ""

    # ── Reports ───────────────────────────────────────────────────────────────
    reports_dir: str = "/app/reports"

    # ── Email (SMTP) ──────────────────────────────────────────────────────────
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "TutorFlow"
    smtp_from_email: str = "noreply@tutorflow.co.uk"
    smtp_use_tls: bool = True
    app_base_url: str = "http://localhost:3000"

    @property
    def email_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_username)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

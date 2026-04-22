import os
from pathlib import Path


DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")
    return database_url


def get_port() -> int:
    return int(os.getenv("PORT", "8000"))


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def get_frontend_static_dir() -> Path:
    configured = os.getenv("FRONTEND_DIST_DIR", "").strip()
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parent / "static"

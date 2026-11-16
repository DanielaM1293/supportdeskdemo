"""Configuration loaded from environment variables only."""

import os
from datetime import timedelta

DEV_SECRET_KEY = "dev-only-secret-key-not-for-production"
DEV_JWT_SECRET_KEY = "dev-only-jwt-secret-key-not-for-production-use"
DEFAULT_DATABASE_URI = "sqlite:///supportdesk.db"  # resolved inside the instance folder
DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000"


def is_production() -> bool:
    env = os.environ.get("APP_ENV") or os.environ.get("FLASK_ENV") or "development"
    return env.strip().lower() == "production"


def normalize_database_url(url: str) -> str:
    """Heroku-style URLs start with postgres://, which SQLAlchemy 2 rejects."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def load_config() -> dict:
    """Build the config dict from the environment.

    In production the app refuses to start without a non-sqlite DATABASE_URL and
    explicit secrets. Dev defaults are only ever used outside production.
    """
    production = is_production()
    database_url = normalize_database_url(os.environ.get("DATABASE_URL", "").strip())
    secret_key = os.environ.get("SECRET_KEY", "").strip()
    jwt_secret_key = os.environ.get("JWT_SECRET_KEY", "").strip()

    if production:
        if not database_url:
            raise RuntimeError("DATABASE_URL is required in production")
        if database_url.startswith("sqlite"):
            raise RuntimeError("SQLite is not allowed in production; use PostgreSQL")
        if not secret_key or not jwt_secret_key:
            raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY are required in production")
    else:
        database_url = database_url or DEFAULT_DATABASE_URI
        secret_key = secret_key or DEV_SECRET_KEY
        jwt_secret_key = jwt_secret_key or DEV_JWT_SECRET_KEY

    origins_raw = os.environ.get("CORS_ORIGINS", "" if production else DEFAULT_CORS_ORIGINS)
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]

    return {
        "SECRET_KEY": secret_key,
        "JWT_SECRET_KEY": jwt_secret_key,
        "JWT_ACCESS_TOKEN_EXPIRES": timedelta(hours=int(os.environ.get("JWT_EXPIRES_HOURS", "12"))),
        "SQLALCHEMY_DATABASE_URI": database_url,
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "CORS_ORIGINS": origins,
        "JSON_SORT_KEYS": False,
    }

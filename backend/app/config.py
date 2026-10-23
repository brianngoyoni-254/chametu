# app/config.py
import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///chametu.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Comma-separated extra origins for CORS (e.g. "https://app.chametu.co.ke")
    FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "")

    # ------------------------------------------------------------------
    # Logging (read by app.logging_config)
    # ------------------------------------------------------------------
    # LOG_LEVEL: DEBUG | INFO | WARNING | ERROR  (default: DEBUG in dev, INFO in prod)
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "")
    # LOG_FORMAT: '' (human) or 'json'
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "")
    # LOG_FILE: optional path; if set, also writes rotating log file
    LOG_FILE = os.environ.get("LOG_FILE", "")
    # FLASK_ENV: 'development' | 'production' — drives format defaults
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
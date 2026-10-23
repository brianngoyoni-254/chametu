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

    # 24h in dev makes it easy to refresh the React app without re-logging in.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Comma-separated extra origins for CORS (e.g. "https://app.chametu.co.ke")
    FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "")
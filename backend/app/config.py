# app/config.py
import os
from datetime import timedelta


def _bool(name, default="false"):
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///chametu.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "chametu.co.ke@gmail.com")

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "")
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "")
    LOG_FILE = os.environ.get("LOG_FILE", "")
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")

    # --- IntaSend ---
    INTASEND_PUBLISHABLE_KEY = os.environ.get("INTASEND_PUBLISHABLE_KEY", "")
    INTASEND_SECRET_KEY = os.environ.get("INTASEND_SECRET_KEY", "")
    INTASEND_TEST_MODE = _bool("INTASEND_TEST_MODE", "false")
    
    # Webhook Settings
    INTASEND_WEBHOOK_URL = os.environ.get("INTASEND_WEBHOOK_URL", "")
    INTASEND_WEBHOOK_CHALLENGE = os.environ.get("INTASEND_WEBHOOK_CHALLENGE", "")

    BILLING_API_REF_PREFIX = os.environ.get("BILLING_API_REF_PREFIX", "CHMT")

    # Only apply override if explicitly set AND not in production
    _override_raw = os.environ.get("BILLING_PRICE_OVERRIDE_KSH", "").strip()
    BILLING_PRICE_OVERRIDE_KSH = (
        _override_raw if (FLASK_ENV != "production" and _override_raw) else ""
    )
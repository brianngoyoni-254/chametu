# app/config.py
import os
from datetime import timedelta


def _bool(name, default="false"):
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


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

    # Base URL for the frontend (used in emails for invite links)
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    # ------------------------------------------------------------------
    # Brevo Email Integration
    # ------------------------------------------------------------------
    BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "no-reply@chametu.co.ke")

    # ------------------------------------------------------------------
    # Logging (read by app.logging_config)
    # ------------------------------------------------------------------
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "")
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "")
    LOG_FILE = os.environ.get("LOG_FILE", "")
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")

    # ------------------------------------------------------------------
    # IntaSend (tier subscription payments)
    # ------------------------------------------------------------------
    INTASEND_PUBLISHABLE_KEY = os.environ.get("INTASEND_PUBLISHABLE_KEY", "")
    INTASEND_SECRET_KEY = os.environ.get("INTASEND_SECRET_KEY", "")
    # false = LIVE (real money). true = IntaSend sandbox (needs sandbox keys).
    INTASEND_TEST_MODE = _bool("INTASEND_TEST_MODE", "false")
    # Must match the "challenge" you set on the Chametu webhook in the
    # IntaSend dashboard. If empty, ALL webhooks are rejected.
    INTASEND_WEBHOOK_CHALLENGE = os.environ.get("INTASEND_WEBHOOK_CHALLENGE", "")

    # Every api_ref we send starts with this, so the webhook can tell
    # Chametu payments apart from other apps sharing the same IntaSend account.
    BILLING_API_REF_PREFIX = os.environ.get("BILLING_API_REF_PREFIX", "CHMT")

    # LIVE-TESTING ONLY: charge this many KES instead of the real tier price
    # (e.g. 10). Ignored when FLASK_ENV=production. Leave empty otherwise.
    BILLING_PRICE_OVERRIDE_KSH = os.environ.get("BILLING_PRICE_OVERRIDE_KSH", "")
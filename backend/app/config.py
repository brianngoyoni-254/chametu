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

    # ------------------------------------------------------------------
    # Connection pooling
    #
    # Neon's pooler kills idle connections server-side (short timeout on
    # the free tier). pool_pre_ping validates at checkout; pool_recycle
    # rotates before Neon's idle kill fires; pool_use_lifo prefers the
    # freshest connection so we don't cycle through stale ones.
    #
    # The keepalive connect_args catch the rarer case where the socket
    # dies *during* an in-flight query ("SSL connection has been closed
    # unexpectedly") — the kernel detects the dead peer instead of us
    # blocking on a read that will never return.
    #
    # These options are Postgres-specific: SQLite's pool (Singleton /
    # Static) doesn't accept pool_size / max_overflow, and sqlite3.connect
    # doesn't accept keepalives kwargs. So we only apply them for
    # Postgres URIs and fall back to the minimal safe config otherwise.
    # ------------------------------------------------------------------
    if SQLALCHEMY_DATABASE_URI.startswith("postgres"):
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 240,        # < Neon's ~5min idle timeout
            "pool_use_lifo": True,      # prefer freshest connections
            "pool_size": 5,
            "max_overflow": 5,
            "pool_timeout": 30,
            "connect_args": {
                "keepalives": 1,
                "keepalives_idle": 30,     # start probing after 30s idle
                "keepalives_interval": 10, # probe every 10s
                "keepalives_count": 5,     # give up after 5 failed probes
            },
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
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
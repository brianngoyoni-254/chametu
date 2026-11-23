# app/__init__.py
import logging
import time
import uuid
import os
import atexit
from apscheduler.schedulers.background import BackgroundScheduler

from flask import Flask, jsonify, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, get_jwt, get_jwt_identity, verify_jwt_in_request
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException
from sqlalchemy import MetaData

from app.config import Config
from app.logging_config import configure_logging
from app.logging_utils import attach_request_id, set_context

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

db = SQLAlchemy(metadata=MetaData(naming_convention=convention))
jwt = JWTManager()
migrate = Migrate()

logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    configure_logging()

    app = Flask(__name__)
    app.config.from_object(config_class)

    # ---------- CORS ----------
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    extra = app.config.get("FRONTEND_ORIGINS") or ""
    if extra:
        allowed_origins.extend([o.strip() for o in extra.split(",") if o.strip()])

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept", "X-Request-ID"],
        expose_headers=["Content-Type", "Authorization", "X-Request-ID"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=600,
    )

    # ---------- extensions ----------
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # ---------- blueprints ----------
    from app.routes.auth import auth_bp
    from app.routes.chama import chama_bp
    from app.routes.finance import finance_bp
    from app.routes.member import member_bp
    from app.routes.settings import settings_bp
    from app.routes.support import support_bp
    from app.routes.rewards import rewards_bp
    from app.routes.ledger import ledger_bp
    from app.routes.notifications import notif_bp
    from app.routes.superadmin import superadmin_bp
    from app.routes.chat import chat_bp
    from app.routes.billing import billing_bp
    from app.routes.receipts import receipts_bp

    app.register_blueprint(superadmin_bp, url_prefix='/api/superadmin')
    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(chama_bp,    url_prefix="/api/chama")
    app.register_blueprint(finance_bp,  url_prefix="/api/finance")
    app.register_blueprint(member_bp,   url_prefix="/api/member")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(support_bp,  url_prefix="/api/support")
    app.register_blueprint(rewards_bp,  url_prefix="/api/rewards")
    app.register_blueprint(ledger_bp,   url_prefix="/api/ledger")
    app.register_blueprint(notif_bp,    url_prefix="/api/notifications")
    app.register_blueprint(chat_bp,     url_prefix="/api/chat")
    app.register_blueprint(billing_bp,  url_prefix="/api/billing")
    app.register_blueprint(receipts_bp, url_prefix="/api/billing/receipts")

    # ---------- request lifecycle ----------
    @app.before_request
    def _start_request():
        attach_request_id()
        g._start_time = time.perf_counter()

        try:
            verify_jwt_in_request(optional=True)
            claims = get_jwt() or {}
            if claims.get('chama_id'):
                set_context(chama_id=claims['chama_id'])
            uid = get_jwt_identity()
            if uid:
                set_context(user_id=uid)
        except Exception:
            pass

    # ---------- trial gate on /api/chama/*, /api/finance/*, etc. ----------
    TRIAL_GATED_PREFIXES = (
        '/api/chama/',
        '/api/finance/',
        '/api/ledger/',
        '/api/notifications/',
    )
    TRIAL_BYPASS_SUFFIXES = (
        '/api/chama/shared_data',
    )

    @app.before_request
    def _enforce_trial():
        # ---- 1) Never gate the CORS preflight ----
        # Browsers send an OPTIONS request first; if we return 402 here the
        # preflight fails and the browser reports a CORS error instead of
        # surfacing the real 402. Skip OPTIONS entirely so the preflight
        # always succeeds.
        if request.method == 'OPTIONS':
            return None

        path = request.path or ''
        if not any(path.startswith(p) for p in TRIAL_GATED_PREFIXES):
            return None
        if any(path.startswith(b) for b in TRIAL_BYPASS_SUFFIXES):
            return None

        claims = get_jwt() or {}
        if claims.get('is_superadmin'):
            return None
        chama_id = claims.get('chama_id')
        if not chama_id:
            return None

        try:
            from app.services import trial_service
            trial = trial_service.get_trial(chama_id)
            if trial and trial.is_locked():
                # ---- 2) Explicitly CORS-enable the 402 ----
                # Even with the OPTIONS bypass, we make sure the actual 402
                # response carries the CORS headers so the browser delivers
                # the body to the JS fetch handler instead of hiding it.
                resp = jsonify({
                    'message': 'Your free trial has ended. Upgrade to continue.',
                    'reason': 'trial_expired',
                    'endsAt': trial.ends_at.isoformat() if trial.ends_at else None,
                    'tier': trial.tier,
                })
                resp.status_code = 402
                origin = request.headers.get('Origin')
                if origin:
                    resp.headers['Access-Control-Allow-Origin'] = origin
                    resp.headers['Access-Control-Allow-Credentials'] = 'true'
                    resp.headers['Access-Control-Allow-Headers'] = (
                        'Content-Type, Authorization, Accept, X-Request-ID'
                    )
                    resp.headers['Access-Control-Allow-Methods'] = (
                        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                    )
                    resp.headers['Vary'] = 'Origin'
                return resp
        except Exception:
            logger.exception('trial enforcement failed (path=%s)', path)

        return None

    @app.after_request
    def _log_response(response):
        duration_ms = round(
            (time.perf_counter() - getattr(g, '_start_time', time.perf_counter())) * 1000, 2
        )
        rid = getattr(g, 'request_id', None)
        if rid:
            response.headers['X-Request-ID'] = rid

        level = logging.INFO
        if response.status_code >= 500:
            level = logging.ERROR
        elif response.status_code >= 400:
            level = logging.WARNING

        logger.log(
            level,
            f'{request.method} {request.path} -> {response.status_code}',
            extra={
                'method': request.method,
                'path': request.path,
                'status': response.status_code,
                'duration_ms': duration_ms,
                'request_id': rid,
                'remote_addr': request.remote_addr,
            },
        )
        return response

    # ---------- seed ----------
    from app.services import rewards_service
    with app.app_context():
        try:
            rewards_service.seed_tiers_if_empty()
            rewards_service.seed_rewards_if_empty()
            logger.info('rewards/tier catalogs verified')
        except Exception as exc:
            logger.info('seed skipped (tables not ready): %s', exc)

    # ---------- health ----------
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    # ---------- error handlers ----------
    @app.errorhandler(Exception)
    def handle_any_error(e):
        if isinstance(e, HTTPException):
            message = "Not found" if e.code == 404 else (e.description or e.name)
            if e.code and e.code >= 500:
                logger.error('HTTP %s: %s', e.code, message, exc_info=True)
            else:
                logger.warning('HTTP %s: %s', e.code, message)
            return jsonify({"message": message}), e.code

        logger.exception('Unhandled error on %s %s', request.method, request.path)
        body = {"message": "Internal server error"}
        if app.debug:
            body["detail"] = f"{type(e).__name__}: {e}"
        return jsonify(body), 500

    # ---------- JWT error handlers ----------
    @jwt.unauthorized_loader
    def missing_token(reason):
        logger.info('JWT missing: %s', reason)
        return jsonify({"message": "Authorization required", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        logger.warning('JWT invalid: %s', reason)
        return jsonify({"message": "Invalid token", "detail": reason}), 422

    @jwt.expired_token_loader
    def expired_token(_h, _p):
        logger.info('JWT expired')
        return jsonify({"message": "Token has expired"}), 401

    # ------------------------------------------------------------------
    # BACKGROUND JOBS
    # ------------------------------------------------------------------
    if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        from app.services.billing_service import reconcile_stale_payments
        from app.services.trial_service import expire_due_trials, send_due_reminders

        def reconcile_job():
            with app.app_context():
                try:
                    reconcile_stale_payments()
                except Exception as e:
                    logger.error("Background reconciliation job failed: %s", e, exc_info=True)

        def expire_trials_job():
            with app.app_context():
                try:
                    n = expire_due_trials()
                    if n:
                        logger.info('trial expiry job: expired=%s', n)
                except Exception as e:
                    logger.error("Trial expiry job failed: %s", e, exc_info=True)

        def reminders_job():
            with app.app_context():
                try:
                    send_due_reminders()
                except Exception as e:
                    logger.error("Trial reminder job failed: %s", e, exc_info=True)

        scheduler = BackgroundScheduler()
        scheduler.add_job(id='reconcile_payments', func=reconcile_job,
                          trigger="interval", minutes=3)
        scheduler.add_job(id='expire_trials', func=expire_trials_job,
                          trigger="interval", minutes=30)
        scheduler.add_job(id='trial_reminders', func=reminders_job,
                          trigger="interval", hours=1)
        scheduler.start()
        atexit.register(lambda: scheduler.shutdown())

    logger.info(
        'Chametu app started | env=%s | debug=%s',
        app.config.get('FLASK_ENV', 'development'),
        app.debug,
    )
    return app
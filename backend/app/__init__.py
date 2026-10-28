# app/__init__.py
import logging
import time
import uuid

from flask import Flask, jsonify, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, get_jwt, get_jwt_identity, verify_jwt_in_request
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException
from sqlalchemy import MetaData  # <-- NEW IMPORT

from app.config import Config
from app.logging_config import configure_logging
from app.logging_utils import attach_request_id, set_context

# Add naming convention to permanently fix SQLite constraint naming issues
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

db = SQLAlchemy(metadata=MetaData(naming_convention=convention))  # <-- UPDATED
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

    # ---------- request lifecycle ----------
    @app.before_request
    def _start_request():
        attach_request_id()
        g._start_time = time.perf_counter()

        # Try to extract JWT context so logs have chama_id/user_id.
        # We do this defensively — public endpoints don't have a JWT.
        try:
            verify_jwt_in_request(optional=True)
            claims = get_jwt() or {}
            if claims.get('chama_id'):
                set_context(chama_id=claims['chama_id'])
            uid = get_jwt_identity()
            if uid:
                set_context(user_id=uid)
        except Exception:
            # Malformed token — let the route's @jwt_required handle it
            pass

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

    # ---------- seed (idempotent; only warn once) ----------
    from app.services import rewards_service
    with app.app_context():
        try:
            rewards_service.seed_tiers_if_empty()
            rewards_service.seed_rewards_if_empty()
            logger.info('rewards/tier catalogs verified')
        except Exception as exc:
            # On first boot before `flask db upgrade`, tables don't exist yet.
            # Log at INFO (not WARNING) so the boot isn't noisy.
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

        logger.exception(
            'Unhandled error on %s %s', request.method, request.path,
        )
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

    logger.info(
        'Chametu app started | env=%s | debug=%s',
        app.config.get('FLASK_ENV', 'development'),
        app.debug,
    )
    return app
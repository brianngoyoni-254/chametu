# app/__init__.py
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

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
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=600,
    )

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    from app.routes.auth import auth_bp
    from app.routes.chama import chama_bp
    from app.routes.finance import finance_bp
    from app.routes.member import member_bp
    from app.routes.settings import settings_bp
    from app.routes.support import support_bp
    from app.routes.rewards import rewards_bp
    from app.routes.ledger import ledger_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(chama_bp,    url_prefix="/api/chama")
    app.register_blueprint(finance_bp,  url_prefix="/api/finance")
    app.register_blueprint(member_bp,   url_prefix="/api/member")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(support_bp,  url_prefix="/api/support")
    app.register_blueprint(rewards_bp,  url_prefix="/api/rewards")
    app.register_blueprint(ledger_bp,   url_prefix="/api/ledger")

    from app.services import rewards_service
    with app.app_context():
        try:
            rewards_service.seed_tiers_if_empty()
            rewards_service.seed_rewards_if_empty()
        except Exception as exc:
            app.logger.warning('rewards seed skipped: %s', exc)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"message": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(_e):
        return jsonify({"message": "Internal server error"}), 500

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Authorization required", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": "Invalid token", "detail": reason}), 422

    @jwt.expired_token_loader
    def expired_token(_h, _p):
        return jsonify({"message": "Token has expired"}), 401

    return app
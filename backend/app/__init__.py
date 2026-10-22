from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from flask_migrate import Migrate

db=SQLAlchemy()
migrate=Migrate()
jwt=JWTManager()

def create_app(config_class=Config):
    app=Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import auth_bp
    from app.routes.chama import chama_bp
    from app.routes.finance import finance_bp

    app.register_blueprint(auth_bp,url_prefix='/api/auth')
    app.register_blueprint(chama_bp,url_prefix='/api/chama')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')

    return app
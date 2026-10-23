# app/models/chama.py
from app import db
from datetime import datetime
import uuid

class Chama(db.Model):
    __tablename__ = 'chamas'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    type = db.Column(db.String(50), default='Investment')
    base_tier = db.Column(db.String(20), default='Starter')
    
    monthly_contribution = db.Column(db.Float, default=0.0)
    due_day = db.Column(db.Integer, default=30)
    late_fee = db.Column(db.Float, default=100.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    members = db.relationship('Member', backref='chama', lazy=True)

class Member(db.Model):
    __tablename__ = 'members'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    
    role = db.Column(db.String(50), default='Member') 
    status = db.Column(db.String(20), default='active') 
    savings = db.Column(db.Float, default=0.0)
    phone = db.Column(db.String(20), nullable=True)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'chama_id', name='_user_chama_uc'),)

class ChamaSettings(db.Model):
    __tablename__ = 'chama_settings'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False, unique=True)
    platform_name = db.Column(db.String(100), default='Chametu')
    support_email = db.Column(db.String(120), default='support@chametu.co.ke')
    timezone = db.Column(db.String(50), default='Africa/Nairobi')
    paybill = db.Column(db.String(20), default='400200')
    account_ref = db.Column(db.String(50), default='CHAMETU')
    grace_period = db.Column(db.Integer, default=7)
    auto_block_days = db.Column(db.Integer, default=14)
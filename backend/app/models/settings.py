# app/models/settings.py
from app import db
from datetime import datetime
import uuid

class PlatformSettings(db.Model):
    __tablename__ = 'platform_settings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    platform_name = db.Column(db.String(100), default='Chametu')
    support_email = db.Column(db.String(120), default='support@chametu.co.ke')
    timezone = db.Column(db.String(50), default='Africa/Nairobi')
    
    paybill = db.Column(db.String(20), default='400200')
    account_ref = db.Column(db.String(50), default='CHAMETU')
    
    grace_period = db.Column(db.Integer, default=7)
    auto_block_days = db.Column(db.Integer, default=14)
    
    prices = db.Column(db.JSON, default=lambda: {
        'Starter': 500, 'Growth': 1000, 'Business': 2000, 'Gold': 3000
    })

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
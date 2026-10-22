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
    
    role = db.Column(db.String(50), default='Member') #others are Chairman, Treasurer, Secretary
    status = db.Column(db.String(20), default='active') # others are active, invited, inactive
    savings = db.Column(db.Float, default=0.0)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'chama_id', name='_user_chama_uc'),)
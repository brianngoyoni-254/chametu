from app import db
from datetime import datetime
import uuid

class Invite(db.Model):
    __tablename__ = 'invites'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token = db.Column(db.String(64), unique=True, nullable=False)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    contact = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), default='Member')
    status = db.Column(db.String(20), default='pending') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
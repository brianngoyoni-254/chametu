# app/models/support.py
from app import db
from datetime import datetime
import uuid

class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False) # The person who raised it
    
    subject = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='technical') # billing, technical, account, feature, other
    priority = db.Column(db.String(20), default='normal') # low, normal, high, urgent
    status = db.Column(db.String(20), default='open') # open, pending, resolved, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to User
    user = db.relationship('User', backref='tickets')
    
    # Relationship to TicketMessage
    messages = db.relationship('TicketMessage', backref='ticket', lazy=True, cascade="all, delete-orphan")

class TicketMessage(db.Model):
    __tablename__ = 'ticket_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String(36), db.ForeignKey('tickets.id'), nullable=False)
    author_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='requester') # requester, agent
    body = db.Column(db.Text, nullable=False)
    internal = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
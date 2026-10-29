# app/models/chat.py
from app import db
from datetime import datetime
import uuid


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # 'open' | 'ended' — ended sessions show a summary in admin
    status = db.Column(db.String(20), nullable=False, default='open', index=True)

    started_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    last_activity_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    messages = db.relationship(
        'ChatMessage',
        backref='session',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='ChatMessage.created_at.asc()',
    )


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('chat_sessions.id'), nullable=False)

    # 'user' | 'bot' | 'agent'
    sender = db.Column(db.String(20), nullable=False)
    body = db.Column(db.Text, nullable=False)

    # Optional link the bot attaches to an answer
    link = db.Column(db.String(255), nullable=True)
    link_text = db.Column(db.String(100), nullable=True)

    # Matched KB entry id (for analytics)
    matched_entry = db.Column(db.String(60), nullable=True)

    # Feedback: 'up' | 'down' | None
    feedback = db.Column(db.String(10), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
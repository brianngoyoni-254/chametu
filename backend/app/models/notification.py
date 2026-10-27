# app/models/notification.py
from app import db
from datetime import datetime
import uuid


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    type = db.Column(db.String(20), default='info')
    event = db.Column(db.String(40), default='system')
    title = db.Column(db.String(150), nullable=False)
    body = db.Column(db.Text, nullable=True)
    link = db.Column(db.String(255), nullable=True)

    read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    read_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    prefs = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotificationReadReceipt(db.Model):
    __tablename__ = 'notification_read_receipts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = db.Column(
        db.String(36), db.ForeignKey('notifications.id'), nullable=False
    )
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    read_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('notification_id', 'user_id', name='_notif_user_read_uc'),
    )
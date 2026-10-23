# app/models/contribution.py
from app import db
from datetime import datetime
import uuid


def _uid():
    return str(uuid.uuid4())


class Contribution(db.Model):
    """One row per monthly contribution payment."""
    __tablename__ = 'contributions'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)

    period = db.Column(db.String(7), nullable=False, index=True)  # 'YYYY-MM'
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='paid')  # paid | pending | overdue
    reference = db.Column(db.String(100), nullable=True)
    method = db.Column(db.String(20), nullable=False, default='cash')  # cash | mpesa | bank

    recorded_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    paid_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MemberInvite(db.Model):
    """Persistent invite record (replaces the localStorage `invites` array)."""
    __tablename__ = 'member_invites'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)

    contact = db.Column(db.String(120), nullable=False)  # email or phone
    role = db.Column(db.String(50), nullable=False, default='Member')
    token = db.Column(db.String(64), nullable=False, unique=True)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending | joined | expired | cancelled

    invited_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    invited_name = db.Column(db.String(100), nullable=True)  # optional display name for invites

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    joined_at = db.Column(db.DateTime, nullable=True)
    joined_member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=True)
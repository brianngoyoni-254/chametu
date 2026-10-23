# app/models/ledger.py
from app import db
from datetime import datetime
import uuid


def _uid():
    return str(uuid.uuid4())


class SavingsLedger(db.Model):
    """One row per deposit/withdrawal against a member's savings.
    `Member.savings` remains the running total; this is the audit trail.
    """
    __tablename__ = 'savings_ledger'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)

    kind = db.Column(db.String(20), nullable=False)  # 'deposit' | 'withdrawal'
    amount = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(255), nullable=False, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class Payment(db.Model):
    """Incoming M-Pesa / bank / cash payments tracked per chama.
    Mirrors the old `chametu_payments_v1` local array.
    """
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)

    payer_name = db.Column(db.String(120), nullable=False, default='')
    phone = db.Column(db.String(20), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    reference = db.Column(db.String(64), nullable=False, default='')  # M-Pesa ref
    channel = db.Column(db.String(20), nullable=False, default='mpesa')  # mpesa | bank | cash

    status = db.Column(db.String(20), nullable=False, default='unmatched')  # unmatched | matched
    matched_member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=True)
    matched_at = db.Column(db.DateTime, nullable=True)
    matched_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    occurred_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WelfareContribution(db.Model):
    """Monthly welfare fund contributions (separate from regular savings)."""
    __tablename__ = 'welfare_contributions'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('members.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reference = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class AuditLogEntry(db.Model):
    """Append-only log of financial mutations (used by admin audit page)."""
    __tablename__ = 'audit_log'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    actor_user_id = db.Column(db.String(36), nullable=True)
    action = db.Column(db.String(60), nullable=False)
    target = db.Column(db.String(255), nullable=False, default='')
    payload = db.Column(db.Text, nullable=True)  # JSON dump
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
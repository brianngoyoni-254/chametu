# app/models/billing.py
from datetime import datetime
import uuid

from app import db


class SubscriptionPayment(db.Model):
    """One row per attempt to pay for a tier via IntaSend."""
    __tablename__ = 'subscription_payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    tier = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)        # what we actually charged
    list_price = db.Column(db.Float, nullable=False)    # the tier's real price
    phone = db.Column(db.String(20), nullable=False)    # 2547XXXXXXXX
    method = db.Column(db.String(20), nullable=False, default='mpesa_stk')

    # pending | processing | complete | failed | expired | review
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    api_ref = db.Column(db.String(64), nullable=False, unique=True)
    invoice_id = db.Column(db.String(40), nullable=True, index=True)
    failed_reason = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
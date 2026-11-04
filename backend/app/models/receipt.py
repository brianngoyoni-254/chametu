# app/models/receipt.py
"""
Persistent receipt record.

One row per successful payment (either a pay-first signup or an upgrade).
Receipts are immutable once issued — a receipt number is generated at issue
time and never reused.
"""
import uuid
from datetime import datetime

from app import db


class Receipt(db.Model):
    __tablename__ = 'receipts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Human-readable, stable, searchable. e.g. CHM-2026-000123
    receipt_number = db.Column(db.String(40), unique=True, nullable=False, index=True)

    # Owner scope
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False, index=True)
    user_id  = db.Column(db.String(36), db.ForeignKey('users.id'),  nullable=False, index=True)

    # Link back to the source payment (either a signup OR an upgrade)
    payment_id = db.Column(db.String(36), db.ForeignKey('subscription_payments.id'),
                           nullable=True, index=True)
    signup_id  = db.Column(db.String(36), db.ForeignKey('pending_signups.id'),
                           nullable=True, index=True)

    # Immutable snapshot
    tier        = db.Column(db.String(20),  nullable=False)
    amount      = db.Column(db.Float,       nullable=False)
    currency    = db.Column(db.String(8),   nullable=False, default='KES')
    status      = db.Column(db.String(20),  nullable=False, default='paid')  # paid | refunded

    # Snapshot of the entities at issue time — never changes even if chama/user
    # is later renamed or deleted.
    chama_name  = db.Column(db.String(120), nullable=False)
    chama_code  = db.Column(db.String(40),  nullable=True)
    payer_name  = db.Column(db.String(120), nullable=False)
    payer_email = db.Column(db.String(160), nullable=True)
    payer_phone = db.Column(db.String(24),  nullable=True)

    # Method metadata
    method      = db.Column(db.String(30),  nullable=False, default='mpesa_stk')
    mpesa_ref   = db.Column(db.String(64),  nullable=True)   # gateway api_ref
    mpesa_code  = db.Column(db.String(32),  nullable=True)   # e.g. 'SJ41KA9XLM'

    issued_at   = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('payment_id', name='_receipt_payment_uc'),
        db.UniqueConstraint('signup_id',  name='_receipt_signup_uc'),
    )
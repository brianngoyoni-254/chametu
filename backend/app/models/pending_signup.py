# app/models/pending_signup.py
"""
A chairman signup that is waiting for its tier payment.

Nothing real (User / Chama / Member) exists until IntaSend confirms the
payment; at that point billing_service finalises this row into a real account.
The password is stored only as a hash.
"""
import uuid
from datetime import datetime

from app import db


class PendingSignup(db.Model):
    __tablename__ = 'pending_signups'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # What the person entered on the Register form
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    phone = db.Column(db.String(32), nullable=False)          # as typed (stored on User.phone)
    mpesa_phone = db.Column(db.String(16), nullable=False, index=True)  # 2547XXXXXXXX
    password_hash = db.Column(db.String(512), nullable=False)
    chama_name = db.Column(db.String(160), nullable=False)
    tier = db.Column(db.String(40), nullable=False)

    # Payment
    amount = db.Column(db.Float, nullable=False)              # what we actually charge
    list_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    # pending | processing | complete | failed | expired | review
    failed_reason = db.Column(db.String(255))
    api_ref = db.Column(db.String(64), unique=True, nullable=False, index=True)
    invoice_id = db.Column(db.String(64), index=True)

    # Proves the browser that started the signup is the one polling it
    claim_token = db.Column(db.String(64), nullable=False)

    # Filled in once the account has been created
    user_id = db.Column(db.String(36))
    chama_id = db.Column(db.String(36))

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime)
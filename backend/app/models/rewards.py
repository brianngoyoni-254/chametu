# app/models/rewards.py
from app import db
from datetime import datetime
import uuid


def _uid():
    return str(uuid.uuid4())


class TierConfig(db.Model):
    """One row per plan tier. Seeded once; admins can edit prices/limits."""
    __tablename__ = 'tier_configs'

    name = db.Column(db.String(20), primary_key=True)  # 'Starter', 'Growth', ...
    rank = db.Column(db.Integer, nullable=False)
    price_ksh = db.Column(db.Float, nullable=False, default=0.0)
    max_members = db.Column(db.Integer, nullable=False, default=10)
    points_multiplier = db.Column(db.Float, nullable=False, default=1.0)
    annual_redeem_cap = db.Column(db.Integer, nullable=False, default=1000)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChamaSubscription(db.Model):
    """Current subscription + trial state for a chama."""
    __tablename__ = 'chama_subscriptions'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(
        db.String(36), db.ForeignKey('chamas.id'), nullable=False, unique=True
    )

    base_tier = db.Column(db.String(20), nullable=False, default='Starter')
    trial_expires_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Reward(db.Model):
    """Catalog of redeemable perks."""
    __tablename__ = 'rewards'

    id = db.Column(db.String(40), primary_key=True)
    icon = db.Column(db.String(40), nullable=False, default='Gift')
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=False, default='')
    points_cost = db.Column(db.Integer, nullable=False)
    cash_value_ksh = db.Column(db.Float, nullable=False, default=0.0)
    active = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PointLot(db.Model):
    """A batch of points that expires together (FIFO consumption)."""
    __tablename__ = 'point_lots'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # >= 0; 0 means exhausted
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PointLedgerEntry(db.Model):
    """Immutable append-only log of point events."""
    __tablename__ = 'point_ledger'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    event = db.Column(db.String(40), nullable=False)  # 'grant', 'redeem', 'expiry'
    points = db.Column(db.Integer, nullable=False)
    note = db.Column(db.String(255), nullable=False, default='')
    reward_id = db.Column(db.String(40), nullable=True)
    idempotency_key = db.Column(db.String(160), nullable=True, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class RewardRedemption(db.Model):
    """A single redemption, with its generated code."""
    __tablename__ = 'reward_redemptions'

    id = db.Column(db.String(36), primary_key=True, default=_uid)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    reward_id = db.Column(db.String(40), db.ForeignKey('rewards.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    code = db.Column(db.String(60), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reward = db.relationship('Reward')
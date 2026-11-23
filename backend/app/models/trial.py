# app/models/trial.py
"""ChamaTrial — one row per chama tracking its 7-day free trial lifecycle.

Statuses:
    trialing  -> free trial running, no charge yet
    active    -> user paid, subscription active
    expired   -> trial ended without payment, account locked
    cancelled -> user opted out / chama deleted

The `ends_at` column is the single source of truth for lock decision:
if `ends_at < now()` and `status == 'trialing'`, the chama is locked.
"""
import uuid
from datetime import datetime, timedelta

from app import db


TRIAL_LENGTH_DAYS = 7


class ChamaTrial(db.Model):
    __tablename__ = 'chama_trials'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(
        db.String(36),
        db.ForeignKey('chamas.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    tier = db.Column(db.String(32), nullable=False, default='Growth')

    status = db.Column(db.String(16), nullable=False, default='trialing', index=True)
    # 'trialing' | 'active' | 'expired' | 'cancelled'

    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ends_at = db.Column(db.DateTime, nullable=False, index=True)

    # Reminder bookkeeping — we stamp these so we never send the same
    # reminder twice, even if the scheduler runs while a user is active.
    reminder_3_sent_at = db.Column(db.DateTime, nullable=True)
    reminder_1_sent_at = db.Column(db.DateTime, nullable=True)
    expired_notice_sent_at = db.Column(db.DateTime, nullable=True)

    # When they upgrade, we stamp this so support can see who converted.
    converted_at = db.Column(db.DateTime, nullable=True)
    converted_tier = db.Column(db.String(32), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=datetime.utcnow, onupdate=datetime.utcnow,
    )

    chama = db.relationship('Chama', backref=db.backref('trial', uselist=False))

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------
    def is_locked(self, now=None):
        now = now or datetime.utcnow()
        if self.status in ('active', 'cancelled'):
            return False
        if self.status == 'expired':
            return True
        return self.ends_at is not None and self.ends_at < now

    def days_left(self, now=None):
        if self.status != 'trialing':
            return 0 if self.status in ('expired', 'cancelled') else None
        now = now or datetime.utcnow()
        delta = self.ends_at - now
        # Ceil so day 1 shows "1 day" all the way to the last hour.
        days = delta.days
        if delta.seconds > 0 or delta.microseconds > 0:
            days += 1
        return max(0, days)

    def to_dict(self):
        return {
            'id': self.id,
            'chamaId': self.chama_id,
            'status': self.status,
            'tier': self.tier,
            'startedAt': self.started_at.isoformat() if self.started_at else None,
            'endsAt': self.ends_at.isoformat() if self.ends_at else None,
            'daysLeft': self.days_left(),
            'isLocked': self.is_locked(),
            'convertedAt': self.converted_at.isoformat() if self.converted_at else None,
            'convertedTier': self.converted_tier,
        }


def default_ends_at(started_at=None):
    started_at = started_at or datetime.utcnow()
    return started_at + timedelta(days=TRIAL_LENGTH_DAYS)
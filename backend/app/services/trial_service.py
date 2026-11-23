# app/services/trial_service.py
"""All trial lifecycle logic in one place.

Public API:
    start_trial(chama_id, tier)                -> ChamaTrial
    get_trial(chama_id)                        -> ChamaTrial | None
    get_status(chama_id)                       -> dict  (serialized)
    mark_paid(chama_id, tier)                  -> ChamaTrial (converts to 'active')
    expire_due_trials()                        -> int (count expired)
    send_due_reminders()                       -> int (count sent)
    is_chama_locked(chama_id)                  -> bool
"""
import logging
from datetime import datetime

from app import db
from app.models.chama import Chama
from app.models.trial import ChamaTrial, TRIAL_LENGTH_DAYS, default_ends_at
from app.services import notification_service as notif_svc

logger = logging.getLogger(__name__)


def _serialize(trial):
    if not trial:
        return None
    return {
        'status': trial.status,
        'tier': trial.tier,
        'startedAt': trial.started_at.isoformat() if trial.started_at else None,
        'endsAt': trial.ends_at.isoformat() if trial.ends_at else None,
        'daysLeft': trial.days_left(),
        'isLocked': trial.is_locked(),
    }


def start_trial(chama_id, tier='Growth'):
    """Create a fresh 7-day trial for a chama. If one already exists, return it."""
    existing = ChamaTrial.query.filter_by(chama_id=chama_id).first()
    if existing:
        return existing

    now = datetime.utcnow()
    trial = ChamaTrial(
        chama_id=chama_id,
        tier=tier,
        status='trialing',
        started_at=now,
        ends_at=default_ends_at(now),
    )
    db.session.add(trial)
    db.session.commit()
    logger.info('trial started: chama=%s tier=%s ends=%s',
                chama_id, tier, trial.ends_at.isoformat())
    return trial


def get_trial(chama_id):
    return ChamaTrial.query.filter_by(chama_id=chama_id).first()


def get_status(chama_id):
    trial = get_trial(chama_id)
    if not trial:
        return None

    # If the trial has elapsed but wasn't flipped yet (scheduler lag), flip now.
    if trial.status == 'trialing' and trial.is_locked():
        _expire_one(trial)

    return _serialize(trial)


def mark_paid(chama_id, tier):
    """Called when a subscription payment succeeds — ends the trial, sets active."""
    trial = get_trial(chama_id)
    if not trial:
        # Chama paid without ever having a trial — create a synthetic 'active'
        # record so downstream code has something consistent to work with.
        trial = ChamaTrial(
            chama_id=chama_id, tier=tier, status='active',
            started_at=datetime.utcnow(), ends_at=datetime.utcnow(),
            converted_at=datetime.utcnow(), converted_tier=tier,
        )
        db.session.add(trial)
        db.session.commit()
        return trial

    trial.status = 'active'
    trial.converted_at = datetime.utcnow()
    trial.converted_tier = tier
    db.session.commit()
    logger.info('trial converted to paid: chama=%s tier=%s', chama_id, tier)
    return trial


def _expire_one(trial):
    """Flip one trial to 'expired' and notify admins."""
    trial.status = 'expired'
    if not trial.expired_notice_sent_at:
        trial.expired_notice_sent_at = datetime.utcnow()
        try:
            notif_svc.notify_chama_admins(
                chama_id=trial.chama_id,
                type='warning',
                event='billing',
                title='Your free trial has ended',
                body='Your account is now locked. Upgrade to unlock your dashboard.',
                link='/billing/upgrade',
            )
        except Exception:
            logger.exception('expired-notice notification failed chama=%s', trial.chama_id)
    db.session.commit()
    logger.info('trial expired: chama=%s', trial.chama_id)


def expire_due_trials():
    """Called by the scheduler every hour. Flips all due trials to 'expired'."""
    now = datetime.utcnow()
    due = ChamaTrial.query.filter(
        ChamaTrial.status == 'trialing',
        ChamaTrial.ends_at < now,
    ).all()

    count = 0
    for trial in due:
        _expire_one(trial)
        count += 1
    return count


def send_due_reminders():
    """Called by the scheduler every hour. Sends day-3 and day-1 reminders."""
    now = datetime.utcnow()
    sent = 0

    for trial in ChamaTrial.query.filter(ChamaTrial.status == 'trialing').all():
        days = trial.days_left(now)
        if days is None:
            continue

        # Day 1 reminder — highest priority, only if not yet sent.
        if days <= 1 and not trial.reminder_1_sent_at:
            try:
                notif_svc.notify_chama_admins(
                    chama_id=trial.chama_id,
                    type='warning',
                    event='billing',
                    title='Last day of your free trial',
                    body='Upgrade today to keep your chama dashboard running.',
                    link='/billing/upgrade',
                )
                trial.reminder_1_sent_at = now
                sent += 1
            except Exception:
                logger.exception('day-1 reminder failed chama=%s', trial.chama_id)

        # Day 3 reminder — only if not already at the day-1 window.
        elif days <= 3 and not trial.reminder_3_sent_at:
            try:
                notif_svc.notify_chama_admins(
                    chama_id=trial.chama_id,
                    type='info',
                    event='billing',
                    title=f'{days} days left on your trial',
                    body='Upgrade any time before day 7 to keep everything running.',
                    link='/billing/upgrade',
                )
                trial.reminder_3_sent_at = now
                sent += 1
            except Exception:
                logger.exception('day-3 reminder failed chama=%s', trial.chama_id)

    db.session.commit()
    if sent:
        logger.info('trial reminders sent: %s', sent)
    return sent


def is_chama_locked(chama_id):
    """Fast check used by the gating decorator."""
    trial = get_trial(chama_id)
    if not trial:
        # No trial row → don't lock. Lets legacy chamas keep working until
        # you backfill them via the migration.
        return False
    return trial.is_locked()
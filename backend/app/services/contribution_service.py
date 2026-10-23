# app/services/contribution_service.py
import logging
from datetime import datetime, date, timedelta

from sqlalchemy import func

from app import db
from app.models.chama import Chama, Member
from app.models.user import User
from app.models.contribution import Contribution
from app.models.finance import Transaction
from app.services import ledger_service, rewards_service

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ helpers
def _period_key(dt=None, frequency='monthly'):
    """Return a stable period string for the given date and frequency."""
    d = dt or datetime.utcnow()
    if frequency == 'weekly':
        iso = d.isocalendar()
        return f'{iso.year}-W{iso.week:02d}'
    if frequency == 'quarterly':
        q = (d.month - 1) // 3 + 1
        return f'{d.year}-Q{q}'
    return d.strftime('%Y-%m')  # monthly


def _expected_for_member(member, chama):
    """Per-member override wins; otherwise the chama default."""
    if member.contribution_override is not None:
        return float(member.contribution_override)
    return float(chama.monthly_contribution or 0)


def _is_past_due(chama, now=None):
    """Has this period's deadline passed?"""
    now = now or datetime.utcnow()
    freq = chama.contribution_frequency or 'monthly'

    if freq == 'weekly':
        # Weekly period starts on Monday (0). Past due if we're past the due weekday.
        target_weekday = int(chama.due_weekday or 1)  # default Tue
        return now.weekday() > target_weekday

    if freq == 'quarterly':
        due_day = int(chama.due_day or 30)
        q_start_month = ((now.month - 1) // 3) * 3 + 1
        months_into_quarter = now.month - q_start_month
        # Overdue after the last month of the quarter is past due_day
        if months_into_quarter < 2:
            return False
        return now.day > due_day

    # monthly
    due_day = int(chama.due_day or 30)
    return now.day > due_day


# ------------------------------------------------------------------ reads
def list_for_month(chama_id, period=None):
    """
    Return one row per active member: expected / paid / balance / status
    for the *current* period (weekly, monthly or quarterly depending on
    Chama.contribution_frequency). Everything is derived from DB rows —
    nothing is seeded.
    """
    chama = Chama.query.get(chama_id)
    if not chama:
        return {
            'period': '', 'frequency': 'monthly',
            'expectedPerMember': 0, 'totalCollected': 0,
            'totalExpected': 0, 'pct': 0, 'members': [],
        }

    frequency = chama.contribution_frequency or 'monthly'
    period = period or _period_key(frequency=frequency)

    members = (
        db.session.query(Member, User)
        .join(User, Member.user_id == User.id)
        .filter(Member.chama_id == chama_id, Member.status == 'active')
        .all()
    )

    payments = Contribution.query.filter_by(chama_id=chama_id, period=period).all()
    by_member = {}
    for p in payments:
        by_member.setdefault(p.member_id, 0.0)
        by_member[p.member_id] += float(p.amount)

    overdue = _is_past_due(chama)

    rows = []
    for m, u in members:
        expected = _expected_for_member(m, chama)
        paid = float(by_member.get(m.id, 0.0))

        if expected > 0 and paid >= expected:
            status = 'done'
        elif paid > 0:
            status = 'partial'
        elif overdue:
            status = 'overdue'
        else:
            status = 'pending'

        rows.append({
            'memberId': m.id,
            'name': u.name,
            'email': u.email,
            'role': m.role,
            'expected': expected,
            'paid': paid,
            'balance': max(0.0, expected - paid),
            'status': status,
            'override': m.contribution_override,
        })

    total_collected = sum(r['paid'] for r in rows)
    total_expected = sum(r['expected'] for r in rows)

    return {
        'period': period,
        'frequency': frequency,
        'dueDay': chama.due_day,
        'dueWeekday': chama.due_weekday,
        'expectedPerMember': float(chama.monthly_contribution or 0),
        'totalCollected': total_collected,
        'totalExpected': total_expected,
        'pct': round((total_collected / total_expected) * 100) if total_expected else 0,
        'members': rows,
    }


def history_for_member(chama_id, member_id, limit=24):
    rows = (
        Contribution.query
        .filter_by(chama_id=chama_id, member_id=member_id)
        .order_by(Contribution.paid_at.desc())
        .limit(limit).all()
    )
    return [
        {
            'id': r.id,
            'period': r.period,
            'amount': r.amount,
            'status': r.status,
            'method': r.method,
            'reference': r.reference,
            'paidAt': r.paid_at.isoformat(),
        }
        for r in rows
    ]


# ------------------------------------------------------------------ writes
def record_contribution(chama_id, member_id, amount, period=None,
                       reference=None, method='cash', actor_user_id=None):
    """Record a contribution. All writes are atomic and idempotent-safe."""
    if amount <= 0:
        raise ValueError('Amount must be greater than 0')

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        raise ValueError('Member not found in this chama')

    chama = Chama.query.get(chama_id)
    frequency = chama.contribution_frequency or 'monthly'
    period = period or _period_key(frequency=frequency)

    contribution = Contribution(
        chama_id=chama_id,
        member_id=member_id,
        period=period,
        amount=amount,
        status='paid',
        reference=reference,
        method=method,
        recorded_by_user_id=actor_user_id,
    )
    db.session.add(contribution)

    ledger_service.record_savings_entry(
        chama_id, member_id, 'deposit', amount,
        note=f'Contribution {period}',
    )

    db.session.add(Transaction(
        chama_id=chama_id,
        member_id=member_id,
        amount=amount,
        type='contribution',
        status='completed',
        reference=reference or method,
    ))
    db.session.commit()

    logger.info(
        'contribution: chama=%s member=%s amount=%s period=%s',
        chama_id, member_id, amount, period,
    )

    rewards_service.emit_event(
        chama_id, 'subscription_paid',
        {'onTime': True, 'amountKsh': amount},
    )

    return contribution


def set_schedule(chama_id, amount=None, frequency=None, due_day=None, due_weekday=None):
    """Admin action — configure the chama-wide contribution schedule."""
    chama = Chama.query.get(chama_id)
    if not chama:
        raise ValueError('Chama not found')

    if amount is not None:
        try:
            v = float(amount)
        except (TypeError, ValueError):
            raise ValueError('Invalid contribution amount')
        if v < 0:
            raise ValueError('Contribution amount cannot be negative')
        chama.monthly_contribution = v

    if frequency is not None:
        if frequency not in ('weekly', 'monthly', 'quarterly'):
            raise ValueError('frequency must be weekly, monthly or quarterly')
        chama.contribution_frequency = frequency

    if due_day is not None:
        d = int(due_day)
        if not (1 <= d <= 31):
            raise ValueError('due_day must be between 1 and 31')
        chama.due_day = d

    if due_weekday is not None:
        w = int(due_weekday)
        if not (0 <= w <= 6):
            raise ValueError('due_weekday must be between 0 (Mon) and 6 (Sun)')
        chama.due_weekday = w

    db.session.commit()
    logger.info(
        'contribution schedule set: chama=%s amount=%s frequency=%s due_day=%s',
        chama_id, chama.monthly_contribution, chama.contribution_frequency, chama.due_day,
    )
    return chama


def set_member_override(chama_id, member_id, amount):
    """Admin action — set (or clear) a per-member contribution override."""
    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        raise ValueError('Member not found in this chama')

    if amount is None or amount == '':
        member.contribution_override = None
    else:
        try:
            v = float(amount)
        except (TypeError, ValueError):
            raise ValueError('Invalid override amount')
        if v < 0:
            raise ValueError('Override cannot be negative')
        member.contribution_override = v

    db.session.commit()
    logger.info(
        'member override set: chama=%s member=%s override=%s',
        chama_id, member_id, member.contribution_override,
    )
    return member
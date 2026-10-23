# app/services/contribution_service.py
from datetime import datetime
from sqlalchemy import func
from app import db
from app.models.chama import Member
from app.models.user import User
from app.models.contribution import Contribution
from app.models.finance import Transaction
from app.services import ledger_service, rewards_service


def _period(dt=None):
    d = dt or datetime.utcnow()
    return d.strftime('%Y-%m')


def list_for_month(chama_id, period=None):
    """
    Return one row per active member: how much they've paid this month
    vs what they owe. This is what the Contributions table renders.
    """
    period = period or _period()
    chama = db.session.query(Member.chama_id).filter_by(chama_id=chama_id).first()
    # Get the chama's monthly_contribution
    from app.models.chama import Chama
    chama_row = Chama.query.get(chama_id)
    expected = float(chama_row.monthly_contribution or 0) if chama_row else 0.0
    due_day = int(chama_row.due_day or 30) if chama_row else 30

    members = (
        db.session.query(Member, User)
        .join(User, Member.user_id == User.id)
        .filter(Member.chama_id == chama_id, Member.status == 'active')
        .all()
    )

    payments = (
        Contribution.query
        .filter_by(chama_id=chama_id, period=period)
        .all()
    )
    by_member = {}
    for p in payments:
        by_member.setdefault(p.member_id, 0.0)
        by_member[p.member_id] += float(p.amount)

    today = datetime.utcnow()
    is_past_due = today.day > due_day

    rows = []
    for m, u in members:
        paid = float(by_member.get(m.id, 0.0))
        if paid >= expected and expected > 0:
            status = 'done'
        elif paid > 0:
            status = 'partial'
        elif is_past_due:
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
        })

    total_collected = sum(r['paid'] for r in rows)
    total_expected = sum(r['expected'] for r in rows)
    return {
        'period': period,
        'expectedPerMember': expected,
        'totalCollected': total_collected,
        'totalExpected': total_expected,
        'pct': round((total_collected / total_expected) * 100) if total_expected else 0,
        'members': rows,
    }


def record_contribution(chama_id, member_id, amount, period=None, reference=None,
                       method='cash', actor_user_id=None):
    """
    Record a contribution. Creates:
    - Contribution row (source of truth for "who paid this month")
    - SavingsLedger deposit (audit trail)
    - Transaction row (ledger view)
    - Points event (via rewards_service)
    """
    if amount <= 0:
        raise ValueError('Amount must be greater than 0')

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        raise ValueError('Member not found in this chama')

    period = period or _period()

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

    # Update member savings + write audit row
    ledger_service.record_savings_entry(
        chama_id, member_id, 'deposit', amount,
        note=f'Contribution {period}',
    )

    # Transaction row for the general ledger view
    db.session.add(Transaction(
        chama_id=chama_id,
        member_id=member_id,
        amount=amount,
        type='contribution',
        status='completed',
        reference=reference or method,
    ))
    db.session.commit()

    # Points (idempotent per-chama per-month via emit_event)
    rewards_service.emit_event(
        chama_id, 'subscription_paid',
        {'onTime': True, 'amountKsh': amount},
    )

    return contribution


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
# app/services/ledger_service.py
import json
from datetime import datetime
from sqlalchemy import func, or_
from app import db
from app.models.chama import Member
from app.models.finance import Transaction, Loan, WelfareClaim
from app.models.ledger import (
    SavingsLedger, Payment, WelfareContribution, AuditLogEntry,
)
from app.services import rewards_service


# ---------------------------------------------------------------- savings
def record_savings_entry(chama_id, member_id, kind, amount, note=''):
    """
    Append a savings ledger row and update the member's running total.
    `kind` = 'deposit' | 'withdrawal'.
    """
    if kind not in ('deposit', 'withdrawal'):
        raise ValueError("kind must be 'deposit' or 'withdrawal'")
    if amount <= 0:
        raise ValueError('amount must be > 0')

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        raise ValueError('Member not found in this chama')

    if kind == 'withdrawal' and amount > member.savings:
        raise ValueError('Withdrawal exceeds available savings')

    if kind == 'deposit':
        member.savings += amount
    else:
        member.savings -= amount

    entry = SavingsLedger(
        chama_id=chama_id,
        member_id=member_id,
        kind=kind,
        amount=amount,
        balance_after=member.savings,
        note=note or '',
    )
    db.session.add(entry)
    db.session.commit()
    return entry


def savings_history(chama_id, member_id=None, limit=100):
    q = SavingsLedger.query.filter_by(chama_id=chama_id)
    if member_id:
        q = q.filter_by(member_id=member_id)
    rows = q.order_by(SavingsLedger.created_at.desc()).limit(limit).all()
    return [
        {
            'id': r.id,
            'memberId': r.member_id,
            'kind': r.kind,
            'amount': r.amount,
            'balanceAfter': r.balance_after,
            'note': r.note,
            'createdAt': r.created_at.isoformat(),
        }
        for r in rows
    ]


def savings_summary(chama_id):
    member_savings = db.session.query(
        func.coalesce(func.sum(Member.savings), 0)
    ).filter(Member.chama_id == chama_id).scalar() or 0

    total_deposits = db.session.query(
        func.coalesce(func.sum(SavingsLedger.amount), 0)
    ).filter(
        SavingsLedger.chama_id == chama_id,
        SavingsLedger.kind == 'deposit',
    ).scalar() or 0

    total_withdrawals = db.session.query(
        func.coalesce(func.sum(SavingsLedger.amount), 0)
    ).filter(
        SavingsLedger.chama_id == chama_id,
        SavingsLedger.kind == 'withdrawal',
    ).scalar() or 0

    return {
        'memberSavings': float(member_savings),
        'totalDeposits': float(total_deposits),
        'totalWithdrawals': float(total_withdrawals),
        'groupReserve': 600000.0,  # placeholder — swap for real reserve table later
        'totalSavings': float(member_savings) + 600000.0,
    }


# ---------------------------------------------------------------- payments
def list_payments(chama_id, query=None, limit=200):
    q = Payment.query.filter_by(chama_id=chama_id)
    if query:
        like = f'%{query}%'
        q = q.filter(or_(
            Payment.payer_name.ilike(like),
            Payment.phone.ilike(like),
            Payment.reference.ilike(like),
        ))
    rows = q.order_by(Payment.occurred_at.desc()).limit(limit).all()

    member_names = {
        m.id: m.user.name if m.user else ''
        for m in Member.query.filter_by(chama_id=chama_id).all()
    }

    return [
        {
            'id': r.id,
            'name': r.payer_name,
            'phone': r.phone or '',
            'amount': r.amount,
            'ref': r.reference,
            'channel': r.channel,
            'status': r.status,
            'matchedTo': member_names.get(r.matched_member_id),
            'time': r.occurred_at.isoformat(),
        }
        for r in rows
    ]


def match_payment(chama_id, payment_id, member_id, actor_user_id):
    payment = Payment.query.filter_by(id=payment_id, chama_id=chama_id).first()
    if not payment:
        return None

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        raise ValueError('Member not found in this chama')

    if payment.status == 'matched':
        raise ValueError('Payment is already matched')

    payment.status = 'matched'
    payment.matched_member_id = member_id
    payment.matched_at = datetime.utcnow()
    payment.matched_by_user_id = actor_user_id

    # Match = deposit into savings + transaction + points
    record_savings_entry(
        chama_id, member_id, 'deposit', payment.amount,
        note=f'M-Pesa {payment.reference}',
    )

    db.session.add(Transaction(
        chama_id=chama_id,
        member_id=member_id,
        amount=payment.amount,
        type='contribution',
        status='completed',
        reference=payment.reference or 'M-Pesa',
    ))
    db.session.commit()

    rewards_service.emit_event(
        chama_id, 'subscription_paid',
        {'onTime': True, 'amountKsh': payment.amount},
    )

    return payment


# ---------------------------------------------------------------- transactions
def list_transactions(chama_id, limit=200):
    rows = (
        Transaction.query
        .filter_by(chama_id=chama_id)
        .order_by(Transaction.created_at.desc())
        .limit(limit).all()
    )
    return [
        {
            'id': r.id,
            'amount': r.amount,
            'type': r.type,
            'status': r.status,
            'reference': r.reference,
            'createdAt': r.created_at.isoformat(),
        }
        for r in rows
    ]


def add_manual_transaction(chama_id, kind, description, amount, actor_user_id):
    """kind = 'credit' | 'debit'. Creates a Transaction row and returns it."""
    if kind not in ('credit', 'debit'):
        raise ValueError("kind must be 'credit' or 'debit'")
    if amount <= 0:
        raise ValueError('amount must be > 0')

    row = Transaction(
        chama_id=chama_id,
        member_id=None,
        amount=amount,
        type=kind,
        status='completed',
        reference=description[:100] if description else '',
    )
    db.session.add(row)
    _audit(chama_id, actor_user_id, f'transaction.{kind}', description, {'amount': amount})
    db.session.commit()
    return row


# ---------------------------------------------------------------- welfare
def list_welfare_claims(chama_id):
    rows = (
        WelfareClaim.query
        .filter_by(chama_id=chama_id)
        .order_by(WelfareClaim.submitted_at.desc())
        .all()
    )
    return [
        {
            'id': r.id,
            'memberId': r.member_id,
            'member': r.member.user.name if r.member and r.member.user else 'Unknown',
            'amount': r.amount,
            'reason': r.reason,
            'status': r.status,
            'note': r.note,
            'submittedAt': r.submitted_at.isoformat(),
            'reviewedAt': r.reviewed_at.isoformat() if r.reviewed_at else None,
        }
        for r in rows
    ]


def welfare_summary(chama_id, monthly_fee=500):
    claims = WelfareClaim.query.filter_by(chama_id=chama_id).all()
    collected = db.session.query(
        func.coalesce(func.sum(WelfareContribution.amount), 0)
    ).filter(WelfareContribution.chama_id == chama_id).scalar() or 0

    paid = sum(c.amount for c in claims if c.status == 'paid')
    pending = sum(c.amount for c in claims if c.status == 'pending')
    rejected = sum(c.amount for c in claims if c.status == 'rejected')

    active_count = Member.query.filter_by(chama_id=chama_id, status='active').count()

    return {
        'collected': float(collected),
        'paid': float(paid),
        'pending': float(pending),
        'rejected': float(rejected),
        'balance': max(0.0, float(collected) - float(paid)),
        'monthlyFee': monthly_fee,
        'memberCount': active_count,
        'expectedMonthly': active_count * monthly_fee,
        'totalClaims': len(claims),
        'approvedClaims': sum(1 for c in claims if c.status == 'paid'),
        'pendingClaims': sum(1 for c in claims if c.status == 'pending'),
        'rejectedClaims': sum(1 for c in claims if c.status == 'rejected'),
    }


# ---------------------------------------------------------------- audit
def _audit(chama_id, actor_user_id, action, target='', payload=None):
    db.session.add(AuditLogEntry(
        chama_id=chama_id,
        actor_user_id=actor_user_id,
        action=action,
        target=target[:255],
        payload=json.dumps(payload) if payload else None,
    ))


def list_audit(chama_id, limit=200):
    rows = (
        AuditLogEntry.query
        .filter_by(chama_id=chama_id)
        .order_by(AuditLogEntry.created_at.desc())
        .limit(limit).all()
    )
    return [
        {
            'id': r.id,
            'action': r.action,
            'target': r.target,
            'createdAt': r.created_at.isoformat(),
        }
        for r in rows
    ]
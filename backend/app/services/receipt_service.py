# app/services/receipt_service.py
"""
Receipt issuance + retrieval.

Public API:
    issue_for_signup(pending_signup) -> Receipt | None
    issue_for_payment(payment)       -> Receipt | None
    get_by_number(receipt_number)    -> Receipt | None
    get_by_id(receipt_id)            -> Receipt | None
    get_for_payment(payment_id)      -> Receipt | None
    get_for_signup(signup_id)        -> Receipt | None
    list_for_chama(chama_id, limit)  -> list[Receipt]
    serialize(receipt)               -> dict
    serialize_full(receipt)          -> dict  (with chama, payer, brand)
"""
import logging
from datetime import datetime

from sqlalchemy.exc import IntegrityError

from app import db
from app.models.receipt import Receipt
from app.models.chama import Chama
from app.models.user import User
from app.models.billing import SubscriptionPayment
from app.models.pending_signup import PendingSignup

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ helpers
def _next_receipt_number():
    """Sequential, human-friendly receipt number: CHM-YYYY-NNNNNN.

    The `receipt_number` column is UNIQUE, so concurrent inserts that
    collide will raise IntegrityError and be retried.
    """
    year = datetime.utcnow().year
    count = db.session.query(db.func.count(Receipt.id)).scalar() or 0
    return f'CHM-{year}-{count + 1:06d}'


def _issue_with_retry(build_fn, attempts=5):
    last_exc = None
    for i in range(attempts):
        receipt = build_fn()
        receipt.receipt_number = _next_receipt_number()
        db.session.add(receipt)
        try:
            db.session.flush()
            return receipt
        except IntegrityError as exc:
            db.session.rollback()
            last_exc = exc
            logger.warning('receipt number collision, retrying (%s/%s)', i + 1, attempts)
    raise RuntimeError('Could not allocate a receipt number') from last_exc


# ------------------------------------------------------------------ builders
def _build_from_signup(ps: PendingSignup) -> Receipt:
    chama = Chama.query.get(ps.chama_id) if ps.chama_id else None
    user  = User.query.get(ps.user_id) if ps.user_id else None
    if not chama or not user:
        raise RuntimeError('Cannot issue receipt: signup not finalized')

    return Receipt(
        chama_id=chama.id,
        user_id=user.id,
        signup_id=ps.id,
        tier=ps.tier,
        amount=float(ps.amount or 0),
        currency='KES',
        status='paid',
        chama_name=chama.name,
        chama_code=chama.code,
        payer_name=user.name,
        payer_email=user.email,
        payer_phone=ps.phone or user.phone,
        method='mpesa_stk',
        mpesa_ref=ps.api_ref,
        mpesa_code=getattr(ps, 'mpesa_code', None),
        issued_at=ps.completed_at or datetime.utcnow(),
    )


def _build_from_payment(p: SubscriptionPayment) -> Receipt:
    chama = Chama.query.get(p.chama_id)
    user  = User.query.get(p.user_id)
    if not chama or not user:
        raise RuntimeError('Cannot issue receipt: chama or user missing')

    return Receipt(
        chama_id=chama.id,
        user_id=user.id,
        payment_id=p.id,
        tier=p.tier,
        amount=float(p.amount or 0),
        currency='KES',
        status='paid',
        chama_name=chama.name,
        chama_code=chama.code,
        payer_name=user.name,
        payer_email=user.email,
        payer_phone=p.phone or user.phone,
        method='mpesa_stk',
        mpesa_ref=p.api_ref,
        mpesa_code=getattr(p, 'mpesa_code', None),
        issued_at=p.completed_at or datetime.utcnow(),
    )


# ------------------------------------------------------------------ public: issue
def issue_for_signup(ps: PendingSignup):
    """Called once a PendingSignup flips to 'complete'. Idempotent."""
    if not ps or not ps.chama_id or not ps.user_id:
        return None

    existing = Receipt.query.filter_by(signup_id=ps.id).first()
    if existing:
        return existing

    receipt = _issue_with_retry(lambda: _build_from_signup(ps))
    db.session.commit()
    logger.info('receipt issued (signup): %s -> %s', ps.id, receipt.receipt_number)
    return receipt


def issue_for_payment(p: SubscriptionPayment):
    """Called once a SubscriptionPayment flips to 'complete'. Idempotent."""
    if not p:
        return None

    existing = Receipt.query.filter_by(payment_id=p.id).first()
    if existing:
        return existing

    receipt = _issue_with_retry(lambda: _build_from_payment(p))
    db.session.commit()
    logger.info('receipt issued (payment): %s -> %s', p.id, receipt.receipt_number)
    return receipt


# ------------------------------------------------------------------ public: get
def get_by_number(receipt_number):
    if not receipt_number:
        return None
    return Receipt.query.filter_by(receipt_number=receipt_number).first()


def get_by_id(receipt_id):
    if not receipt_id:
        return None
    return Receipt.query.get(receipt_id)


def get_for_payment(payment_id):
    if not payment_id:
        return None
    return Receipt.query.filter_by(payment_id=payment_id).first()


def get_for_signup(signup_id):
    if not signup_id:
        return None
    return Receipt.query.filter_by(signup_id=signup_id).first()


def list_for_chama(chama_id, limit=100):
    return (Receipt.query
            .filter_by(chama_id=chama_id)
            .order_by(Receipt.issued_at.desc())
            .limit(limit).all())


# ------------------------------------------------------------------ public: serialize
def serialize(r: Receipt) -> dict:
    return {
        'id': r.id,
        'receiptNumber': r.receipt_number,
        'chamaId': r.chama_id,
        'userId': r.user_id,
        'paymentId': r.payment_id,
        'signupId': r.signup_id,
        'tier': r.tier,
        'amount': r.amount,
        'currency': r.currency,
        'status': r.status,
        'method': r.method,
        'mpesaRef': r.mpesa_ref,
        'mpesaCode': r.mpesa_code,
        'issuedAt': r.issued_at.isoformat() if r.issued_at else None,
    }


def serialize_full(r: Receipt) -> dict:
    """Everything the frontend needs to render the printable receipt."""
    return {
        **serialize(r),
        'chama': {
            'name': r.chama_name,
            'code': r.chama_code,
        },
        'payer': {
            'name': r.payer_name,
            'email': r.payer_email,
            'phone': r.payer_phone,
        },
        'brand': {
            'name': 'Chametu',
            'tagline': 'Chama Management Platform',
            'supportEmail': 'support@chametu.co.ke',
            'supportPhone': '+254 110 279 735',
        },
        'amountLabel': f"KSh {int(round(r.amount or 0)):,}",
        'issuedAtLabel': (
            r.issued_at.strftime('%d %b %Y, %H:%M') if r.issued_at else None
        ),
    }
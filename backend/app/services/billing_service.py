# app/services/billing_service.py
import hmac
import logging
import secrets
import uuid
from datetime import datetime, timedelta

from flask import current_app
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.billing import SubscriptionPayment
from app.models.chama import Chama, Member
from app.models.pending_signup import PendingSignup
from app.models.rewards import TierConfig
from app.models.settings import PlatformSettings
from app.models.user import User
from app.services import intasend, rewards_service, signup_service
from app.services import notification_service as notif_svc
from app.services.intasend import friendly_failure_reason

logger = logging.getLogger(__name__)

DUPLICATE_WINDOW = timedelta(minutes=2)
EXPIRE_AFTER = timedelta(minutes=15)
OPEN_STATES = ('pending', 'processing')


def _fmt_ksh(n):
    return 'KSh ' + f'{int(round(float(n))):,}'


def tier_list_price(tier_name):
    cfg = TierConfig.query.get(tier_name) if tier_name else None
    if not cfg:
        raise ValueError(f'Unknown tier: {tier_name}')
    settings = PlatformSettings.query.first()
    prices = (settings.prices if settings and settings.prices else None) or {}
    try:
        return float(prices.get(tier_name) or cfg.price_ksh or 0)
    except (TypeError, ValueError):
        return float(cfg.price_ksh or 0)


def price_for(tier_name):
    list_price = tier_list_price(tier_name)
    if list_price <= 0:
        raise ValueError('This plan is not available for purchase right now. Please contact support.')

    charge = list_price
    override = (current_app.config.get('BILLING_PRICE_OVERRIDE_KSH') or '').strip()
    if override and current_app.config.get('FLASK_ENV') != 'production':
        try:
            o = float(override)
            if o >= 1:
                charge = o
                logger.warning(
                    'BILLING_PRICE_OVERRIDE_KSH active: charging KSh %s instead of %s',
                    o, list_price,
                )
        except ValueError:
            pass
    return list_price, charge


def serialize(p):
    return {
        'id': p.id,
        'tier': p.tier,
        'amount': p.amount,
        'listPrice': p.list_price,
        'phone': p.phone,
        'status': p.status,
        'failedReason': p.failed_reason,
        'createdAt': p.created_at.isoformat() if p.created_at else None,
        'completedAt': p.completed_at.isoformat() if p.completed_at else None,
    }


def start_payment(chama_id, user_id, tier_name, phone_raw):
    phone = intasend.normalize_phone(phone_raw)
    if not phone:
        raise ValueError('Enter a valid Safaricom number, e.g. 0712345678.')

    list_price, charge = price_for(tier_name)

    sub = rewards_service.get_or_create_subscription(chama_id)
    current = rewards_service.tier_config(sub.base_tier)
    target = TierConfig.query.get(tier_name)
    if current and target.rank <= current.rank:
        raise ValueError(f'Your chama is already on {sub.base_tier} or higher.')

    recent = SubscriptionPayment.query.filter(
        SubscriptionPayment.chama_id == chama_id,
        SubscriptionPayment.tier == tier_name,
        SubscriptionPayment.status.in_(OPEN_STATES),
        SubscriptionPayment.created_at >= datetime.utcnow() - DUPLICATE_WINDOW,
    ).first()
    if recent:
        raise ValueError('A payment is already in progress. Check your phone for the M-Pesa prompt.')

    user = User.query.get(user_id)
    prefix = current_app.config.get('BILLING_API_REF_PREFIX', 'CHMT')
    payment = SubscriptionPayment(
        chama_id=chama_id,
        user_id=user_id,
        tier=tier_name,
        amount=charge,
        list_price=list_price,
        phone=phone,
        status='pending',
        api_ref=f'{prefix}-{uuid.uuid4().hex[:16].upper()}',
    )
    db.session.add(payment)
    db.session.commit()

    try:
        res = intasend.stk_push(
            phone=phone,
            amount=charge,
            api_ref=payment.api_ref,
            narrative=f'Chametu {tier_name} plan',
            email=(user.email if user else 'support@chametu.co.ke'),
        )
    except intasend.IntaSendError as exc:
        payment.status = 'failed'
        payment.failed_reason = str(exc)[:250]
        db.session.commit()
        raise ValueError(str(exc))

    payment.invoice_id = res['invoice_id']
    if res['state'] == 'PROCESSING':
        payment.status = 'processing'
    db.session.commit()

    logger.info('billing: STK sent chama=%s tier=%s amount=%s ref=%s invoice=%s',
                chama_id, tier_name, charge, payment.api_ref, payment.invoice_id)
    return payment


def _apply_state(payment_id, state, failed_reason=None, amount_seen=None, source='poll'):
    p = (SubscriptionPayment.query
         .filter_by(id=payment_id).with_for_update().first())
    if not p:
        return None
    if p.status == 'complete':
        return p

    state = (state or '').upper()

    if state == 'COMPLETE':
        if amount_seen is not None and amount_seen + 0.01 < float(p.amount):
            p.status = 'review'
            p.failed_reason = f'Amount mismatch: expected {p.amount}, got {amount_seen}'
            db.session.commit()
            logger.error('billing: AMOUNT MISMATCH payment=%s expected=%s got=%s',
                         p.id, p.amount, amount_seen)
            return p

        p.status = 'complete'
        p.failed_reason = None
        p.completed_at = datetime.utcnow()

        sub = rewards_service.get_or_create_subscription(p.chama_id)
        sub.base_tier = p.tier
        sub.trial_expires_at = None
        chama = Chama.query.get(p.chama_id)
        if chama:
            chama.base_tier = p.tier
        db.session.commit()

        logger.info('billing: COMPLETE (%s) payment=%s chama=%s -> %s',
                    source, p.id, p.chama_id, p.tier)
        _after_success(p)
        return p

    if state == 'FAILED':
        p.status = 'failed'
        p.failed_reason = (failed_reason or 'Payment was cancelled or failed.')[:250]
        db.session.commit()
        logger.info('billing: FAILED (%s) payment=%s reason=%s', source, p.id, p.failed_reason)
        return p

    if state == 'PROCESSING' and p.status == 'pending':
        p.status = 'processing'
        db.session.commit()
    return p


def _after_success(p):
    try:
        notif_svc.notify_chama_admins(
            chama_id=p.chama_id, type='success', event='payments',
            title=f'{p.tier} plan activated',
            body=f'Payment of {_fmt_ksh(p.amount)} received. Your chama is now on {p.tier}.',
            link='/dashboard/billing',
        )
    except Exception:
        logger.exception('billing: notification failed')
    try:
        rewards_service.emit_event(p.chama_id, 'tier_upgraded', {'to': p.tier})
    except Exception:
        logger.exception('billing: rewards event failed')


def refresh(payment):
    """Ask IntaSend for the truth about an open payment (used by polling)."""
    if payment.status not in OPEN_STATES or not payment.invoice_id:
        return payment
    try:
        res = intasend.get_status(payment.invoice_id)
    except intasend.IntaSendError:
        return payment

    updated = _apply_state(
        payment.id, res['state'],
        friendly_failure_reason(res['failed_reason'], res['state']),
        amount_seen=res['net_amount'] if res['net_amount'] is not None else res['value'],
        source='poll',
    ) or payment

    if (updated.status in OPEN_STATES
            and updated.created_at < datetime.utcnow() - EXPIRE_AFTER):
        updated.status = 'expired'
        updated.failed_reason = (
            'We didn’t get a response from M-Pesa in time. No money was taken. '
            'Please try again.'
        )
        db.session.commit()
    return updated


def _verify_with_gateway(invoice_id, payload):
    state = str(payload.get('state') or '').upper()
    failed_reason = payload.get('failed_reason')
    amount_seen = None
    try:
        res = intasend.get_status(invoice_id)
        state = res['state'] or state
        failed_reason = res['failed_reason'] or failed_reason
        amount_seen = res['net_amount'] if res['net_amount'] is not None else res['value']
    except intasend.IntaSendError:
        logger.warning('billing: could not verify webhook with IntaSend; using payload')
        try:
            amount_seen = float(payload.get('net_amount') or payload.get('value'))
        except (TypeError, ValueError):
            amount_seen = None
    return state, failed_reason, amount_seen


def handle_webhook(payload):
    """Returns (http_status, body)."""
    if not intasend.verify_challenge(payload.get('challenge')):
        logger.warning('billing: webhook rejected (bad/missing challenge)')
        return 401, {'message': 'Invalid challenge'}

    api_ref = payload.get('api_ref') or ''
    invoice_id = payload.get('invoice_id')
    prefix = current_app.config.get('BILLING_API_REF_PREFIX', 'CHMT')

    signup = None
    if api_ref.startswith(prefix + '-SU-'):
        signup = PendingSignup.query.filter_by(api_ref=api_ref).first()
    if not signup and invoice_id:
        signup = PendingSignup.query.filter_by(invoice_id=invoice_id).first()
    if signup:
        if signup.status == 'complete':
            return 200, {'ok': True}
        state, failed_reason, amount_seen = _verify_with_gateway(
            invoice_id or signup.invoice_id, payload)
        if not signup.invoice_id and invoice_id:
            signup.invoice_id = invoice_id
            db.session.commit()
        _apply_signup_state(
            signup.id, state,
            friendly_failure_reason(failed_reason, state),
            amount_seen, source='webhook',
        )
        return 200, {'ok': True}

    payment = None
    if api_ref.startswith(prefix + '-'):
        payment = SubscriptionPayment.query.filter_by(api_ref=api_ref).first()
    if not payment and invoice_id:
        payment = SubscriptionPayment.query.filter_by(invoice_id=invoice_id).first()
    if not payment:
        return 200, {'ignored': True}

    if payment.status == 'complete':
        return 200, {'ok': True}

    state, failed_reason, amount_seen = _verify_with_gateway(
        invoice_id or payment.invoice_id, payload)

    if not payment.invoice_id and invoice_id:
        payment.invoice_id = invoice_id
        db.session.commit()

    _apply_state(
        payment.id, state,
        friendly_failure_reason(failed_reason, state),
        amount_seen, source='webhook',
    )
    return 200, {'ok': True}


# ======================================================================
# PAY-FIRST SIGNUP
# ======================================================================
SIGNUP_MAX_ATTEMPTS_PER_HOUR = 5
SIGNUP_SESSION_WINDOW = timedelta(minutes=30)


def serialize_signup(ps):
    return {
        'id': ps.id,
        'tier': ps.tier,
        'amount': ps.amount,
        'listPrice': ps.list_price,
        'phone': ps.mpesa_phone,
        'status': ps.status,
        'failedReason': ps.failed_reason,
        'createdAt': ps.created_at.isoformat() if ps.created_at else None,
        'completedAt': ps.completed_at.isoformat() if ps.completed_at else None,
    }


def start_signup_payment(*, name, email, password, phone_raw, chama_name, tier_name):
    name = (name or '').strip()
    email = (email or '').lower().strip()
    phone_raw = (phone_raw or '').strip()
    chama_name = (chama_name or '').strip() or f"{name}'s Chama"

    if not name or not email or len(password or '') < 8:
        raise ValueError('Name, email and a password of at least 8 characters are required.')

    mpesa_phone = intasend.normalize_phone(phone_raw)
    if not mpesa_phone:
        raise ValueError('Enter a valid Safaricom number, e.g. 0712345678.')

    list_price, charge = price_for(tier_name)

    if User.query.filter_by(email=email).first():
        raise ValueError('An account with that email already exists. Please log in instead.')

    now = datetime.utcnow()
    in_progress = PendingSignup.query.filter(
        PendingSignup.status.in_(OPEN_STATES),
        PendingSignup.created_at >= now - EXPIRE_AFTER,
        or_(PendingSignup.email == email, PendingSignup.mpesa_phone == mpesa_phone),
    ).first()
    if in_progress:
        raise ValueError('A payment is already in progress. Check your phone for the M-Pesa prompt.')

    attempts = PendingSignup.query.filter(
        PendingSignup.mpesa_phone == mpesa_phone,
        PendingSignup.invoice_id.isnot(None),
        PendingSignup.created_at >= now - timedelta(hours=1),
    ).count()
    if attempts >= SIGNUP_MAX_ATTEMPTS_PER_HOUR:
        raise ValueError('Too many payment attempts for this number. Please try again later.')

    prefix = current_app.config.get('BILLING_API_REF_PREFIX', 'CHMT')
    ps = PendingSignup(
        name=name,
        email=email,
        phone=phone_raw,
        mpesa_phone=mpesa_phone,
        password_hash=signup_service.hash_password(password),
        chama_name=chama_name,
        tier=tier_name,
        amount=charge,
        list_price=list_price,
        status='pending',
        api_ref=f'{prefix}-SU-{uuid.uuid4().hex[:16].upper()}',
        claim_token=secrets.token_urlsafe(32),
    )
    db.session.add(ps)
    db.session.commit()

    try:
        res = intasend.stk_push(
            phone=mpesa_phone,
            amount=charge,
            api_ref=ps.api_ref,
            narrative=f'Chametu {tier_name} plan',
            email=email,
        )
    except intasend.IntaSendError as exc:
        ps.status = 'failed'
        ps.failed_reason = str(exc)[:250]
        db.session.commit()
        raise ValueError(str(exc))

    ps.invoice_id = res['invoice_id']
    if res['state'] == 'PROCESSING':
        ps.status = 'processing'
    db.session.commit()

    logger.info('billing: signup STK sent tier=%s amount=%s ref=%s invoice=%s',
                tier_name, charge, ps.api_ref, ps.invoice_id)
    return ps


def get_signup(signup_id, claim):
    ps = PendingSignup.query.filter_by(id=signup_id).first()
    if not ps or not hmac.compare_digest(str(ps.claim_token), str(claim or '')):
        return None
    return ps


def refresh_signup(ps):
    """Ask IntaSend for the truth about an open signup payment (used by polling)."""
    if ps.status not in OPEN_STATES or not ps.invoice_id:
        return ps
    try:
        res = intasend.get_status(ps.invoice_id)
    except intasend.IntaSendError:
        return ps

    updated = _apply_signup_state(
        ps.id, res['state'],
        friendly_failure_reason(res['failed_reason'], res['state']),
        amount_seen=res['net_amount'] if res['net_amount'] is not None else res['value'],
        source='poll',
    ) or ps

    if (updated.status in OPEN_STATES
            and updated.created_at < datetime.utcnow() - EXPIRE_AFTER):
        updated.status = 'expired'
        updated.failed_reason = (
            'We didn’t get a response from M-Pesa in time. No money was taken. '
            'Please try again.'
        )
        db.session.commit()
    return updated


def session_for_signup(ps):
    if ps.status != 'complete' or not ps.user_id or not ps.chama_id:
        return None
    if ps.completed_at and datetime.utcnow() - ps.completed_at > SIGNUP_SESSION_WINDOW:
        return None
    user = User.query.get(ps.user_id)
    chama = Chama.query.get(ps.chama_id)
    member = Member.query.filter_by(user_id=ps.user_id, chama_id=ps.chama_id).first()
    if not (user and chama and member):
        return None
    return signup_service.build_session(user, chama, member)


def _apply_signup_state(signup_id, state, failed_reason=None, amount_seen=None, source='poll'):
    ps = (PendingSignup.query
          .filter_by(id=signup_id).with_for_update().first())
    if not ps:
        return None
    if ps.status == 'complete':
        return ps

    state = (state or '').upper()

    if state == 'COMPLETE':
        if amount_seen is not None and amount_seen + 0.01 < float(ps.amount):
            ps.status = 'review'
            ps.failed_reason = f'Amount mismatch: expected {ps.amount}, got {amount_seen}'
            db.session.commit()
            logger.error('billing: SIGNUP AMOUNT MISMATCH signup=%s expected=%s got=%s',
                         ps.id, ps.amount, amount_seen)
            return ps
        return _finalize_signup(ps, source)

    if state == 'FAILED':
        ps.status = 'failed'
        ps.failed_reason = (failed_reason or 'Payment was cancelled or failed.')[:250]
        db.session.commit()
        logger.info('billing: signup FAILED (%s) signup=%s reason=%s', source, ps.id, ps.failed_reason)
        return ps

    if state == 'PROCESSING' and ps.status == 'pending':
        ps.status = 'processing'
        db.session.commit()
    return ps


def _mark_signup_review(signup_id, reason):
    ps = PendingSignup.query.get(signup_id)
    if ps:
        ps.status = 'review'
        ps.failed_reason = reason[:250]
        db.session.commit()
    logger.error('billing: signup %s needs review: %s', signup_id, reason)
    return ps


def _finalize_signup(ps, source):
    signup_id = ps.id

    if User.query.filter_by(email=ps.email).first():
        return _mark_signup_review(
            signup_id,
            'Payment received but this email is already registered. Contact support.')

    phone_taken = User.query.filter_by(phone=ps.phone).first() is not None
    if phone_taken:
        logger.warning('billing: signup %s phone already on another user; stored on member only',
                       signup_id)

    try:
        user, chama, member = signup_service.create_chama_account(
            name=ps.name, email=ps.email,
            phone=None if phone_taken else ps.phone,
            member_phone=ps.phone,
            chama_name=ps.chama_name, tier=ps.tier,
            password_hash=ps.password_hash,
        )

        ps.status = 'complete'
        ps.failed_reason = None
        ps.user_id = user.id
        ps.chama_id = chama.id
        ps.completed_at = datetime.utcnow()

        db.session.add(SubscriptionPayment(
            chama_id=chama.id,
            user_id=user.id,
            tier=ps.tier,
            amount=ps.amount,
            list_price=ps.list_price,
            phone=ps.mpesa_phone,
            status='complete',
            api_ref=ps.api_ref,
            invoice_id=ps.invoice_id,
            created_at=ps.created_at,
            completed_at=ps.completed_at,
        ))

        sub = rewards_service.get_or_create_subscription(chama.id)
        sub.base_tier = ps.tier
        sub.trial_expires_at = None
        chama.base_tier = ps.tier
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return _mark_signup_review(
            signup_id,
            'Payment received but the account could not be created. Contact support.')

    logger.info('billing: SIGNUP COMPLETE (%s) signup=%s chama=%s tier=%s',
                source, signup_id, ps.chama_id, ps.tier)
    try:
        notif_svc.notify_chama_admins(
            chama_id=ps.chama_id, type='success', event='payments',
            title=f'{ps.tier} plan activated',
            body=f'Payment of {_fmt_ksh(ps.amount)} received. Welcome to Chametu!',
            link='/dashboard/billing',
        )
    except Exception:
        logger.exception('billing: signup notification failed')
    return ps
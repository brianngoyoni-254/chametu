# app/services/intasend.py
"""
Thin wrapper around the official `intasend-python` SDK.
(pip install intasend-python)
"""
import hmac
import logging
import re

from flask import current_app

logger = logging.getLogger(__name__)


class IntaSendError(Exception):
    """Raised for any problem talking to IntaSend. Message is safe to show users."""


def _client():
    cfg = current_app.config
    secret = cfg.get('INTASEND_SECRET_KEY')
    public = cfg.get('INTASEND_PUBLISHABLE_KEY')
    if not secret or not public:
        raise IntaSendError('Payments are not configured yet.')
    try:
        from intasend import APIService
    except ImportError as exc:
        import sys
        logger.error(
            'IntaSend SDK import failed: %r | python=%s | sys.path[:4]=%s',
            exc, sys.executable, sys.path[:4], exc_info=True,
        )
        raise IntaSendError('Payment library could not be loaded. Check the server log for details.')
    return APIService(
        token=secret,
        publishable_key=public,
        test=bool(cfg.get('INTASEND_TEST_MODE')),
    )


def _friendly(exc):
    """Pull a readable message out of an SDK/requests error without leaking keys."""
    resp = getattr(exc, 'response', None)
    if resp is not None:
        try:
            data = resp.json()
            if isinstance(data, dict):
                msg = data.get('detail') or data.get('message')
                if not msg and data.get('errors'):
                    msg = str(data['errors'])[:200]
                if msg:
                    return str(msg)[:200]
        except Exception:
            pass
    return str(exc)[:200] or 'Payment provider error'


def normalize_phone(raw):
    """07XXXXXXXX / 01XXXXXXXX / +2547XXXXXXXX / 2547XXXXXXXX -> 254XXXXXXXXX, else None."""
    digits = re.sub(r'\D', '', raw or '')
    if digits.startswith('0') and len(digits) == 10:
        digits = '254' + digits[1:]
    elif len(digits) == 9 and digits[0] in '17':
        digits = '254' + digits
    if re.fullmatch(r'254[17]\d{8}', digits):
        return digits
    return None


def _parse(resp):
    """Normalise STK-push and status responses (both nest data under 'invoice')."""
    resp = resp if isinstance(resp, dict) else {}
    inv = resp.get('invoice') if isinstance(resp.get('invoice'), dict) else resp

    def _num(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    return {
        'invoice_id': inv.get('invoice_id') or inv.get('id') or resp.get('invoice_id'),
        'state': str(inv.get('state') or resp.get('state') or '').upper(),
        'api_ref': inv.get('api_ref'),
        'net_amount': _num(inv.get('net_amount')),
        'value': _num(inv.get('value')),
        'failed_reason': inv.get('failed_reason'),
    }


def stk_push(phone, amount, api_ref, narrative, email):
    svc = _client()
    amt = int(amount) if float(amount).is_integer() else float(amount)
    try:
        try:
            resp = svc.collect.mpesa_stk_push(
                phone_number=phone, email=email, amount=amt,
                narrative=narrative, api_ref=api_ref,
            )
        except TypeError:
            logger.warning('intasend SDK has no api_ref support; upgrade intasend-python')
            resp = svc.collect.mpesa_stk_push(
                phone_number=phone, email=email, amount=amt, narrative=narrative,
            )
    except IntaSendError:
        raise
    except Exception as exc:
        logger.error('IntaSend STK push failed: %s', _friendly(exc))
        raise IntaSendError(_friendly(exc))

    parsed = _parse(resp)
    if not parsed['invoice_id']:
        logger.error('IntaSend STK push returned no invoice id: %r', resp)
        raise IntaSendError('Payment provider did not accept the request.')
    return parsed


def get_status(invoice_id):
    svc = _client()
    try:
        return _parse(svc.collect.status(invoice_id=invoice_id))
    except IntaSendError:
        raise
    except Exception as exc:
        logger.warning('IntaSend status check failed for %s: %s', invoice_id, _friendly(exc))
        raise IntaSendError(_friendly(exc))


def verify_challenge(received):
    expected = current_app.config.get('INTASEND_WEBHOOK_CHALLENGE') or ''
    if not expected:
        return False
    return hmac.compare_digest(str(received or ''), expected)


# ---------------------------------------------------------------------
# Friendly failure messages
# ---------------------------------------------------------------------
_CANCEL_PATTERNS = [
    re.compile(r'cancel', re.I),
    re.compile(r'user\s+(did\s+)?not\s+(enter|complete)', re.I),
    re.compile(r'request\s+(was\s+)?cancell?ed', re.I),
    re.compile(r'transaction\s+(was\s+)?cancell?ed', re.I),
    re.compile(r'declined', re.I),
    re.compile(r'timed?\s*out|timeout', re.I),
    re.compile(r'no\s+response', re.I),
    re.compile(r'ds-?\d+.*cancel', re.I),
    re.compile(r'\b1037\b'),
    re.compile(r'\b1032\b'),
]
_INSUFFICIENT_PATTERNS = [
    re.compile(r'insufficient', re.I),
    re.compile(r'balance', re.I),
    re.compile(r'not\s+enough', re.I),
    re.compile(r'low\s+funds', re.I),
]
_INVALID_PATTERNS = [
    re.compile(r'invalid\s+(phone|number|msisdn)', re.I),
    re.compile(r'wrong\s+number', re.I),
    re.compile(r'not\s+a\s+safaricom', re.I),
]


def friendly_failure_reason(raw, state=None):
    """
    Turn a raw IntaSend/M-Pesa failure string into professional, user-facing copy.
    Never returns empty; never returns the raw technical string for known cases.
    """
    state = (state or '').upper()

    if state == 'EXPIRED':
        return ('We didn’t get a response from M-Pesa in time. '
                'No money was taken. Please try again.')

    text = str(raw or '').strip()
    if not text:
        return ('The payment was not completed and no money was taken. '
                'Please try again.')

    if any(p.search(text) for p in _CANCEL_PATTERNS):
        return ('You cancelled the M-Pesa request, so no money was taken. '
                'You can try again whenever you’re ready.')

    if any(p.search(text) for p in _INSUFFICIENT_PATTERNS):
        return ('M-Pesa reported insufficient funds, so the payment did not '
                'go through. Please top up and try again.')

    if any(p.search(text) for p in _INVALID_PATTERNS):
        return ('That phone number could not receive the M-Pesa request. '
                'Please check the number and try again.')

    return ('The payment was not completed and no money was taken. '
            'Please try again, or contact support@chametu.co.ke if it keeps failing.')


# ======================================================================
# LEGACY HELPERS - still imported by routes/superadmin.py and routes/chama.py.
# Behaviour unchanged. Tier-subscription payments no longer use these;
# they go through stk_push() above + billing_service.
# ======================================================================
import requests as _requests


def send_stk_push(phone_number, amount, api_ref, name="Chama Member"):
    """Sends an M-Pesa STK Push using the IntaSend REST API (legacy helper)."""
    secret_key = current_app.config.get('INTASEND_SECRET_KEY')
    if not secret_key:
        logger.warning("INTASEND_SECRET_KEY is missing. Skipping STK Push.")
        return {"status": "error", "message": "IntaSend keys not configured"}

    url = "https://api.intasend.com/api/v1/payment/mpesa-stk-push/"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": f"Bearer {secret_key}",
    }
    payload = {
        "phone_number": phone_number,
        "amount": float(amount),
        "api_ref": str(api_ref),
        "name": name,
    }
    try:
        response = _requests.post(url, json=payload, headers=headers)
        data = response.json()
        if response.status_code in (200, 201):
            logger.info(f"IntaSend STK Push sent to {phone_number} for {amount}")
            return {"status": "success", "data": data}
        logger.error(f"IntaSend error: {data}")
        return {"status": "error", "message": data.get('detail', 'Failed to initiate STK Push')}
    except Exception as e:
        logger.exception(f"IntaSend Exception: {str(e)}")
        return {"status": "error", "message": str(e)}


def generate_checkout_link(amount, api_ref, name, email="support@chametu.co.ke"):
    """Generates a Card / M-Pesa checkout link (legacy helper)."""
    public_key = current_app.config.get('INTASEND_PUBLISHABLE_KEY')
    if not public_key:
        logger.warning("INTASEND_PUBLISHABLE_KEY is missing. Skipping checkout link generation.")
        return {"status": "error", "message": "IntaSend keys not configured"}

    url = "https://api.intasend.com/api/v1/checkout/"
    headers = {"accept": "application/json", "content-type": "application/json"}
    payload = {
        "public_key": public_key,
        "currency": "KES",
        "amount": float(amount),
        "email": email,
        "api_ref": str(api_ref),
        "host": current_app.config.get('FRONTEND_URL', 'http://localhost:5173'),
    }
    try:
        response = _requests.post(url, json=payload, headers=headers)
        data = response.json()
        if response.status_code in (200, 201):
            logger.info(f"Checkout link generated for {amount}")
            return {"status": "success", "url": data.get('url')}
        logger.error(f"IntaSend Checkout error: {data}")
        return {"status": "error", "message": data.get('detail', 'Failed to generate checkout link')}
    except Exception as e:
        logger.exception(f"IntaSend Exception: {str(e)}")
        return {"status": "error", "message": str(e)}
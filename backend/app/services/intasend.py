# app/services/intasend.py
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
        logger.error('IntaSend SDK import failed: %r', exc, exc_info=True)
        raise IntaSendError('Payment library could not be loaded.')
    return APIService(
        token=secret,
        publishable_key=public,
        test=bool(cfg.get('INTASEND_TEST_MODE')),
    )


def _friendly(exc):
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
    digits = re.sub(r'\D', '', raw or '')
    if digits.startswith('0') and len(digits) == 10:
        digits = '254' + digits[1:]
    elif len(digits) == 9 and digits[0] in '17':
        digits = '254' + digits
    if re.fullmatch(r'254[17]\d{8}', digits):
        return digits
    return None


def _parse(resp):
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
    
    # Retrieve webhook config
    webhook_url = current_app.config.get('INTASEND_WEBHOOK_URL')
    challenge = current_app.config.get('INTASEND_WEBHOOK_CHALLENGE')

    try:
        kwargs = {
            "phone_number": phone, 
            "email": email, 
            "amount": amt,
            "narrative": narrative, 
            "api_ref": api_ref,
        }
        
        if webhook_url:
            kwargs["webhook"] = webhook_url
        if challenge:
            kwargs["challenge"] = challenge

        try:
            resp = svc.collect.mpesa_stk_push(**kwargs)
        except TypeError:
            # Fallback for older SDK versions that don't accept webhook kwargs
            logger.warning('intasend SDK is outdated, ignoring webhook kwarg')
            kwargs.pop('webhook', None)
            kwargs.pop('challenge', None)
            resp = svc.collect.mpesa_stk_push(**kwargs)
            
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
    if not received:
        return False
    return hmac.compare_digest(str(received), expected)


# ---------------------------------------------------------------------
# Friendly failure messages
# ---------------------------------------------------------------------
_CANCEL_PATTERNS = [
    re.compile(r'cancel', re.I), re.compile(r'user\s+(did\s+)?not\s+(enter|complete)', re.I),
    re.compile(r'request\s+(was\s+)?cancell?ed', re.I), re.compile(r'transaction\s+(was\s+)?cancell?ed', re.I),
    re.compile(r'declined', re.I), re.compile(r'timed?\s*out|timeout', re.I),
    re.compile(r'no\s+response', re.I), re.compile(r'ds-?\d+.*cancel', re.I),
    re.compile(r'\b1037\b'), re.compile(r'\b1032\b'),
]
_INSUFFICIENT_PATTERNS = [
    re.compile(r'insufficient', re.I), re.compile(r'balance', re.I),
    re.compile(r'not\s+enough', re.I), re.compile(r'low\s+funds', re.I),
]
_INVALID_PATTERNS = [
    re.compile(r'invalid\s+(phone|number|msisdn)', re.I), re.compile(r'wrong\s+number', re.I),
    re.compile(r'not\s+a\s+safaricom', re.I),
]


def friendly_failure_reason(raw, state=None):
    state = (state or '').upper()
    if state == 'EXPIRED':
        return ('We didn’t get a response from M-Pesa in time. No money was taken. Please try again.')
    
    text = str(raw or '').strip()
    if not text:
        return ('The payment was not completed and no money was taken. Please try again.')
        
    if any(p.search(text) for p in _CANCEL_PATTERNS):
        return ('You cancelled the M-Pesa request, so no money was taken. You can try again whenever you’re ready.')
    if any(p.search(text) for p in _INSUFFICIENT_PATTERNS):
        return ('M-Pesa reported insufficient funds, so the payment did not go through. Please top up and try again.')
    if any(p.search(text) for p in _INVALID_PATTERNS):
        return ('That phone number could not receive the M-Pesa request. Please check the number and try again.')
        
    return ('The payment was not completed and no money was taken. Please try again, or contact support@chametu.co.ke if it keeps failing.')

def send_stk_push(phone_number, amount, api_ref, name="Chama Member", email="support@chametu.co.ke"):
    """Legacy wrapper for the old function signature."""
    phone = normalize_phone(phone_number)
    if not phone:
        return {"status": "error", "message": "Enter a valid Safaricom number, e.g. 0712345678."}
    try:
        res = stk_push(
            phone=phone,
            amount=amount,
            api_ref=api_ref,
            narrative=name,
            email=email,
        )
        return {"status": "success", "data": res}
    except IntaSendError as exc:
        return {"status": "error", "message": str(exc)}


def generate_checkout_link(amount, api_ref, name="Chama Member", email="support@chametu.co.ke", method=None):
    """Create a hosted IntaSend checkout page (card / M-Pesa till) and return its URL.

    Returns {"status": "success", "url": ...} or {"status": "error", "message": ...}.
    `method` is optional: e.g. "CARD-PAYMENT" or "M-PESA". Leave None to show all options.
    """
    try:
        svc = _client()
        amt = int(amount) if float(amount).is_integer() else float(amount)

        kwargs = {
            "email": email,
            "amount": amt,
            "currency": "KES",
            "comment": name,
            "api_ref": api_ref,
            "first_name": (name or "Chama").split(" ")[0],
        }
        redirect_url = current_app.config.get('INTASEND_REDIRECT_URL')
        if redirect_url:
            kwargs["redirect_url"] = redirect_url
        if method:
            kwargs["method"] = method

        try:
            resp = svc.collect.checkout(**kwargs)
        except TypeError:
            # Older SDK versions may not accept some kwargs
            logger.warning('intasend SDK rejected optional checkout kwargs, retrying with basics')
            for k in ('method', 'redirect_url', 'first_name'):
                kwargs.pop(k, None)
            resp = svc.collect.checkout(**kwargs)
    except IntaSendError as exc:
        return {"status": "error", "message": str(exc)}
    except Exception as exc:
        logger.error('IntaSend checkout failed: %s', _friendly(exc))
        return {"status": "error", "message": _friendly(exc)}

    url = resp.get('url') if isinstance(resp, dict) else None
    if not url:
        logger.error('IntaSend checkout returned no url: %r', resp)
        return {"status": "error", "message": "Payment provider did not return a payment link."}
    return {"status": "success", "url": url}
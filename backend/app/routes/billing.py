# app/routes/billing.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.models.billing import SubscriptionPayment
from app.services import billing_service as svc
from app.services import rewards_service

billing_bp = Blueprint('billing', __name__)
logger = logging.getLogger(__name__)

ADMIN_ROLES = ('Chairman', 'Treasurer')


def _cid():
    return get_jwt().get('chama_id')


def _is_admin():
    return get_jwt().get('role') in ADMIN_ROLES


# ---------------------------------------------------------------------
# PAY-FIRST SIGNUP (public: the chama does not exist yet)
# ---------------------------------------------------------------------
@billing_bp.route('/signup/checkout', methods=['POST'])
def signup_checkout():
    """
    Start a new chama signup. Sends the M-Pesa STK push; the account and chama
    are only created once the payment is confirmed.
    Body: {name, email, password, phone, chama_name, tier}
    """
    data = request.get_json(silent=True) or {}
    try:
        ps = svc.start_signup_payment(
            name=data.get('name'),
            email=data.get('email'),
            password=data.get('password'),
            phone_raw=data.get('phone'),
            chama_name=data.get('chama_name'),
            tier_name=data.get('tier'),
        )
    except ValueError as e:
        logger.warning('billing: signup checkout rejected (tier=%s, email=%s): %s',
                       data.get('tier'), (data.get('email') or '').lower().strip(), e)
        return jsonify({'message': str(e)}), 400

    return jsonify({
        'message': 'Check your phone and enter your M-Pesa PIN to complete payment.',
        'signup': svc.serialize_signup(ps),
        'claim': ps.claim_token,   # shown once; required to poll this signup
    }), 201


@billing_bp.route('/signup/<signup_id>/status', methods=['POST'])
def signup_status(signup_id):
    """
    Poll every ~3s. Reconciles with IntaSend. Once paid, returns `session`
    (token + user + chama) so the browser can log the new chairman straight in.
    Body: {claim}
    """
    data = request.get_json(silent=True) or {}
    ps = svc.get_signup(signup_id, data.get('claim'))
    if not ps:
        return jsonify({'message': 'Signup not found'}), 404

    ps = svc.refresh_signup(ps)
    body = {'signup': svc.serialize_signup(ps)}
    if ps.status == 'complete':
        session = svc.session_for_signup(ps)
        if session:
            body['session'] = session
    return jsonify(body), 200


# ---------------------------------------------------------------------
# UPGRADES FOR EXISTING CHAMAS
# ---------------------------------------------------------------------
@billing_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """Start an M-Pesa STK push for a tier upgrade. Body: {tier, phone}."""
    if not _is_admin():
        return jsonify({'message': 'Only the Chairman or Treasurer can pay for a plan.'}), 403

    data = request.get_json(silent=True) or {}
    try:
        payment = svc.start_payment(
            chama_id=_cid(),
            user_id=get_jwt_identity(),
            tier_name=data.get('tier'),
            phone_raw=data.get('phone'),
        )
    except ValueError as e:
        logger.warning('billing: upgrade checkout rejected (tier=%s): %s', data.get('tier'), e)
        return jsonify({'message': str(e)}), 400

    return jsonify({
        'message': 'Check your phone and enter your M-Pesa PIN to complete payment.',
        'payment': svc.serialize(payment),
    }), 201


@billing_bp.route('/payments/<payment_id>', methods=['GET'])
@jwt_required()
def payment_status(payment_id):
    """Poll this every ~3s after checkout. It also reconciles with IntaSend."""
    payment = SubscriptionPayment.query.filter_by(id=payment_id, chama_id=_cid()).first()
    if not payment:
        return jsonify({'message': 'Payment not found'}), 404

    payment = svc.refresh(payment)
    sub = rewards_service.get_or_create_subscription(_cid())
    return jsonify({
        'payment': svc.serialize(payment),
        'baseTier': sub.base_tier,
    }), 200


@billing_bp.route('/payments', methods=['GET'])
@jwt_required()
def payment_history():
    if not _is_admin():
        return jsonify({'message': 'Unauthorized'}), 403
    rows = (SubscriptionPayment.query
            .filter_by(chama_id=_cid())
            .order_by(SubscriptionPayment.created_at.desc())
            .limit(50).all())
    return jsonify([svc.serialize(r) for r in rows]), 200


@billing_bp.route('/webhook/intasend', methods=['POST'])
def intasend_webhook():
    """Public endpoint called by IntaSend. Authenticated by the shared challenge."""
    payload = request.get_json(silent=True) or {}
    try:
        status, body = svc.handle_webhook(payload)
    except Exception:
        logger.exception('billing: webhook processing error')
        return jsonify({'message': 'Error'}), 500
    return jsonify(body), status
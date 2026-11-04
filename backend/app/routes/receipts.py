# app/routes/receipts.py
"""
Receipt API.

Public:
    GET /api/billing/receipts/signup/<signup_id>?claim=...
        Only works with the claim token that created the signup,
        for up to 30 minutes after completion.

Authenticated:
    GET /api/billing/receipts/<receipt_number>
    GET /api/billing/receipts
    GET /api/billing/receipts/for-payment/<payment_id>
"""
import logging
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.services import receipt_service as receipts
from app.services import billing_service as billing_svc

receipts_bp = Blueprint('receipts', __name__)
logger = logging.getLogger(__name__)

SIGNUP_RECEIPT_WINDOW = timedelta(minutes=30)


def _cid():
    return get_jwt().get('chama_id')


def _role():
    return get_jwt().get('role')


# ---------------------------------------------------------------- public lookup
@receipts_bp.route('/signup/<signup_id>', methods=['GET'])
def get_signup_receipt(signup_id):
    """Called by the Register page right after payment succeeds."""
    claim = request.args.get('claim') or ''
    ps = billing_svc.get_signup(signup_id, claim)
    if not ps:
        return jsonify({'message': 'Signup not found'}), 404
    if ps.status != 'complete':
        return jsonify({'message': 'Payment is not yet complete', 'status': ps.status}), 409

    if ps.completed_at and datetime.utcnow() - ps.completed_at > SIGNUP_RECEIPT_WINDOW:
        return jsonify({
            'message': 'Receipt link has expired — please log in to view it.'
        }), 410

    r = receipts.get_for_signup(ps.id) or receipts.issue_for_signup(ps)
    if not r:
        return jsonify({'message': 'Receipt could not be generated yet'}), 503

    return jsonify({
        'receipt': receipts.serialize_full(r),
        'session': billing_svc.session_for_signup(ps) or None,
    }), 200


# ---------------------------------------------------------------- authenticated
@receipts_bp.route('/<receipt_number>', methods=['GET'])
@jwt_required()
def get_receipt(receipt_number):
    r = receipts.get_by_number(receipt_number)
    if not r:
        return jsonify({'message': 'Receipt not found'}), 404
    if r.chama_id != _cid():
        return jsonify({'message': 'Unauthorized'}), 403
    # Members may only see their own receipts
    if _role() not in ('Chairman', 'Treasurer', 'Secretary'):
        if r.user_id != get_jwt_identity():
            return jsonify({'message': 'Unauthorized'}), 403
    return jsonify({'receipt': receipts.serialize_full(r)}), 200


@receipts_bp.route('/for-payment/<payment_id>', methods=['GET'])
@jwt_required()
def get_for_payment(payment_id):
    r = receipts.get_for_payment(payment_id)
    if not r or r.chama_id != _cid():
        return jsonify({'message': 'Receipt not found'}), 404
    if _role() not in ('Chairman', 'Treasurer', 'Secretary'):
        if r.user_id != get_jwt_identity():
            return jsonify({'message': 'Unauthorized'}), 403
    return jsonify({'receipt': receipts.serialize_full(r)}), 200


@receipts_bp.route('', methods=['GET'])
@jwt_required()
def list_receipts():
    limit = min(int(request.args.get('limit', 50)), 200)
    rows = receipts.list_for_chama(_cid(), limit=limit)
    if _role() not in ('Chairman', 'Treasurer', 'Secretary'):
        uid = get_jwt_identity()
        rows = [r for r in rows if r.user_id == uid]
    return jsonify([receipts.serialize(r) for r in rows]), 200
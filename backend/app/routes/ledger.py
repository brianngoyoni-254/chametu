# app/routes/ledger.py
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app import db
from app.models.chama import Member
from app.models.finance import WelfareClaim
from app.services import ledger_service as ls
from app.logging_utils import log_writes
from app.utils.decorators import require_permission # <-- NEW IMPORT

ledger_bp = Blueprint('ledger', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


@ledger_bp.route('/savings', methods=['GET'])
@jwt_required()
def savings_list():
    cid = _cid()
    member_id = request.args.get('member_id')
    limit = int(request.args.get('limit', 100))
    return jsonify({
        'summary': ls.savings_summary(cid),
        'entries': ls.savings_history(cid, member_id=member_id, limit=limit),
    }), 200


@ledger_bp.route('/savings', methods=['POST'])
@jwt_required()
@require_permission('recordPayments') # NEW: Dynamic permission
@log_writes(logger, 'savings.record')
def savings_add():
    data = request.get_json() or {}

    try:
        entry = ls.record_savings_entry(
            _cid(),
            data.get('member_id'),
            data.get('kind', 'deposit'),
            float(data.get('amount', 0)),
            note=data.get('note', ''),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    return jsonify({
        'id': entry.id, 'kind': entry.kind, 'amount': entry.amount,
        'balanceAfter': entry.balance_after,
    }), 201


@ledger_bp.route('/payments', methods=['GET'])
@jwt_required()
def payments_list():
    return jsonify(ls.list_payments(_cid(), query=request.args.get('q'))), 200


@ledger_bp.route('/payments', methods=['POST'])
@jwt_required()
@require_permission('recordPayments') # NEW: Dynamic permission
@log_writes(logger, 'payment.ingest')
def payments_add():
    data = request.get_json() or {}

    from app.models.ledger import Payment
    row = Payment(
        chama_id=_cid(),
        payer_name=data.get('name', ''),
        phone=data.get('phone'),
        amount=float(data.get('amount', 0)),
        reference=data.get('ref', ''),
        channel=data.get('channel', 'mpesa'),
        status='unmatched',
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({'id': row.id, 'status': row.status}), 201


@ledger_bp.route('/payments/<payment_id>/match', methods=['POST'])
@jwt_required()
@require_permission('recordPayments') # NEW: Dynamic permission
@log_writes(logger, 'payment.match')
def payments_match(payment_id):
    data = request.get_json() or {}
    member_id = data.get('member_id')
    if not member_id:
        return jsonify({'message': 'member_id required'}), 400

    try:
        row = ls.match_payment(_cid(), payment_id, member_id, get_jwt_identity())
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    if not row:
        return jsonify({'message': 'Payment not found'}), 404

    return jsonify({'message': 'Payment matched', 'status': row.status}), 200


@ledger_bp.route('/transactions', methods=['GET'])
@jwt_required()
def transactions_list():
    return jsonify(ls.list_transactions(_cid(), limit=int(request.args.get('limit', 200)))), 200


@ledger_bp.route('/transactions', methods=['POST'])
@jwt_required()
@require_permission('recordPayments') # NEW: Dynamic permission
@log_writes(logger, 'transaction.create')
def transactions_add():
    data = request.get_json() or {}
    try:
        row = ls.add_manual_transaction(
            _cid(),
            data.get('kind', 'credit'),
            data.get('description', ''),
            float(data.get('amount', 0)),
            get_jwt_identity(),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify({'id': row.id, 'amount': row.amount, 'type': row.type}), 201


@ledger_bp.route('/welfare', methods=['GET'])
@jwt_required()
def welfare_list():
    return jsonify({
        'summary': ls.welfare_summary(_cid(), monthly_fee=float(request.args.get('monthly_fee', 500))),
        'claims': ls.list_welfare_claims(_cid()),
    }), 200


@ledger_bp.route('/welfare/<claim_id>/review', methods=['PATCH'])
@jwt_required()
@require_permission('manageMembers') # NEW: Only those who can manage members can approve funds (adjust if needed)
@log_writes(logger, 'welfare.review')
def welfare_review(claim_id):
    data = request.get_json() or {}
    status = data.get('status')
    if status not in ('paid', 'rejected', 'pending'):
        return jsonify({'message': 'Invalid status'}), 400

    claim = WelfareClaim.query.filter_by(id=claim_id, chama_id=_cid()).first()
    if not claim:
        return jsonify({'message': 'Claim not found'}), 404

    claim.status = status
    claim.note = data.get('note', '')
    claim.reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': f'Claim {status}'}), 200


@ledger_bp.route('/audit', methods=['GET'])
@jwt_required()
def audit_list():
    return jsonify(ls.list_audit(_cid())), 200
# app/routes/finance.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app import db
from app.models.finance import Transaction, Loan
from app.models.chama import Member
from app.models.user import User
from app.logging_utils import log_writes
from app.utils.decorators import require_permission # <-- NEW IMPORT

finance_bp = Blueprint('finance', __name__)
logger = logging.getLogger(__name__)


@finance_bp.route('/contribution', methods=['POST'])
@jwt_required()
@require_permission('recordPayments') # NEW: Dynamic permission
@log_writes(logger, 'finance.contribution')
def record_contribution():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    data = request.get_json() or {}

    member_id = data.get('member_id')
    amount = float(data.get('amount', 0))

    if amount <= 0:
        return jsonify({"message": "Amount must be greater than 0"}), 400

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        logger.warning('contribution: member %s not in chama %s', member_id, chama_id)
        return jsonify({"message": "Member not found in this chama"}), 404

    member.savings += amount

    new_tx = Transaction(
        chama_id=chama_id,
        member_id=member_id,
        amount=amount,
        type='contribution',
        status='completed',
        reference=data.get('reference', 'Manual Entry'),
    )
    db.session.add(new_tx)
    db.session.commit()

    logger.info('legacy contribution recorded: member=%s amount=%s', member_id, amount)
    return jsonify({"message": "Contribution recorded", "new_balance": member.savings}), 201


@finance_bp.route('/loans', methods=['GET'])
@jwt_required()
def get_loans():
    chama_id = get_jwt().get('chama_id')
    loans = Loan.query.filter_by(chama_id=chama_id).order_by(Loan.created_at.desc()).all()

    result = []
    for l in loans:
        member = Member.query.get(l.member_id)
        user = User.query.get(member.user_id) if member else None
        result.append({
            "id": l.id,
            "member": user.name if user else "Unknown",
            "member_id": l.member_id,
            "amount": l.amount,
            "balance": l.balance,
            "status": l.status,
            "purpose": l.purpose,
            "created_at": l.created_at.isoformat(),
        })
    return jsonify(result), 200


@finance_bp.route('/loans/apply', methods=['POST'])
@jwt_required()
@require_permission('requestLoans') # NEW: Dynamic permission
@log_writes(logger, 'loan.apply')
def apply_loan():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    user_id = claims.get('sub')
    data = request.get_json() or {}

    amount = float(data.get('amount', 0))
    purpose = data.get('purpose', 'General')

    if amount <= 0:
        return jsonify({"message": "Invalid loan amount"}), 400

    member = Member.query.filter_by(user_id=user_id, chama_id=chama_id).first()
    if not member:
        return jsonify({"message": "Member not found"}), 404

    active_loan = Loan.query.filter_by(member_id=member.id, status='disbursed').first()
    if active_loan:
        logger.warning('loan apply rejected: active loan exists for member %s', member.id)
        return jsonify({"message": "You already have an active loan"}), 400

    new_loan = Loan(
        chama_id=chama_id,
        member_id=member.id,
        amount=amount,
        balance=amount,
        status='pending',
        purpose=purpose,
    )
    db.session.add(new_loan)
    db.session.commit()

    logger.info('loan applied: member=%s amount=%s purpose=%r',
                member.id, amount, purpose)
    return jsonify({"message": "Loan application submitted", "loan_id": new_loan.id}), 201


@finance_bp.route('/loans/<loan_id>/status', methods=['PATCH'])
@jwt_required()
@require_permission('approveLoans') # NEW: Dynamic permission replaces hardcoded check
@log_writes(logger, 'loan.status_change')
def update_loan_status(loan_id):
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    data = request.get_json() or {}

    loan = Loan.query.filter_by(id=loan_id, chama_id=chama_id).first()
    if not loan:
        return jsonify({"message": "Loan not found"}), 404

    new_status = data.get('status')
    if new_status not in ['approved', 'rejected', 'disbursed', 'repaid']:
        return jsonify({"message": "Invalid status"}), 400

    old = loan.status
    loan.status = new_status

    if new_status == 'disbursed':
        db.session.add(Transaction(
            chama_id=chama_id,
            member_id=loan.member_id,
            amount=loan.amount,
            type='loan_disbursement',
            status='completed',
        ))

    db.session.commit()
    logger.info('loan %s status %s -> %s', loan.id, old, new_status)
    return jsonify({"message": f"Loan marked as {new_status}"}), 200


@finance_bp.route('/loans/<loan_id>/repay', methods=['POST'])
@jwt_required()
@require_permission('makePayments') # NEW: Dynamic permission
@log_writes(logger, 'loan.repay')
def repay_loan(loan_id):
    chama_id = get_jwt().get('chama_id')
    data = request.get_json() or {}

    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    loan = Loan.query.filter_by(id=loan_id, chama_id=chama_id).first()
    if not loan or loan.status not in ['disbursed', 'repaid']:
        return jsonify({"message": "Active loan not found"}), 404

    if amount > loan.balance:
        amount = loan.balance

    loan.balance -= amount
    if loan.balance <= 0:
        loan.status = 'repaid'

    db.session.add(Transaction(
        chama_id=chama_id,
        member_id=loan.member_id,
        amount=amount,
        type='loan_repayment',
        status='completed',
    ))
    db.session.commit()

    logger.info('loan %s repaid: amount=%s remaining=%s',
                loan.id, amount, loan.balance)
    return jsonify({"message": "Repayment recorded", "remaining_balance": loan.balance}), 200
# app/routes/finance.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app import db
from app.models.finance import Transaction, Loan
from app.models.chama import Member, Chama
from app.models.user import User
from app.services import notification_service as notif_svc
from app.logging_utils import log_writes
from app.utils.decorators import require_permission

finance_bp = Blueprint('finance', __name__)
logger = logging.getLogger(__name__)


def _fmt_ksh(n):
    return 'KSh ' + f'{int(round(float(n))):,}'


def _loan_availability(member, chama):
    """Returns (limit, used, available) based on savings × multiplier."""
    multiplier = getattr(chama, 'maxLoanMultiple', None) or 3
    savings = float(member.savings or 0)
    limit = savings * multiplier

    active = Loan.query.filter(
        Loan.member_id == member.id,
        Loan.status.in_(('approved', 'disbursed')),
    ).all()
    used = sum(float(l.balance or 0) for l in active)

    return limit, used, max(0.0, limit - used)


@finance_bp.route('/contribution', methods=['POST'])
@jwt_required()
@require_permission('recordPayments')
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

    try:
        notif_svc.notify_member(
            chama_id=chama_id,
            user_id=member.user_id,
            type='success',
            event='paymentConfirmations',
            title='Contribution recorded',
            body=f'{_fmt_ksh(amount)} was added to your savings.',
            link='/member/savings',
        )
    except Exception:
        logger.exception('contribution notification failed')

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
@require_permission('requestLoans')
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

    chama = Chama.query.get(chama_id)

    # Block if a pending application is already in flight
    pending = Loan.query.filter_by(member_id=member.id, status='pending').first()
    if pending:
        return jsonify({
            "message": "You already have a pending loan application awaiting review."
        }), 400

    # Enforce the savings × multiplier cap across ALL active loans
    limit, used, available = _loan_availability(member, chama)
    if available <= 0:
        return jsonify({
            "message": f"You've used your full {_fmt_ksh(limit)} limit. Repay an existing loan first."
        }), 400
    if amount > available:
        return jsonify({
            "message": f"The most you can borrow right now is {_fmt_ksh(available)}."
        }), 400

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

    applicant = User.query.get(user_id)
    applicant_name = applicant.name if applicant else 'A member'
    try:
        notif_svc.notify_chama_admins(
            chama_id=chama_id,
            type='warning',
            event='loanApplications',
            title='New loan application',
            body=f'{applicant_name} requested {_fmt_ksh(amount)} for {purpose}.',
            link='/dashboard/loans',
        )
    except Exception:
        logger.exception('loan-apply notification failed')

    return jsonify({"message": "Loan application submitted", "loan_id": new_loan.id}), 201


@finance_bp.route('/loans/<loan_id>/status', methods=['PATCH'])
@jwt_required()
@require_permission('approveLoans')
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

    member = Member.query.get(loan.member_id)
    if member:
        meta = {
            'approved':  ('success', 'Loan approved',
                          f'Your loan of {_fmt_ksh(loan.amount)} was approved.'),
            'rejected':  ('warning', 'Loan rejected',
                          f'Your loan application for {_fmt_ksh(loan.amount)} was not approved.'),
            'disbursed': ('success', 'Loan disbursed',
                          f'{_fmt_ksh(loan.amount)} has been disbursed to you.'),
            'repaid':    ('success', 'Loan fully repaid',
                          f'Your loan of {_fmt_ksh(loan.amount)} is now fully repaid.'),
        }[new_status]

        try:
            notif_svc.notify_member(
                chama_id=chama_id,
                user_id=member.user_id,
                type=meta[0],
                event='loanApprovals',
                title=meta[1],
                body=meta[2],
                link='/member/loans',
            )
        except Exception:
            logger.exception('loan-status notification failed')

    logger.info('loan %s status %s -> %s', loan.id, old, new_status)
    return jsonify({"message": f"Loan marked as {new_status}"}), 200


@finance_bp.route('/loans/<loan_id>/repay', methods=['POST'])
@jwt_required()
@require_permission('makePayments')
@log_writes(logger, 'loan.repay')
def repay_loan(loan_id):
    chama_id = get_jwt().get('chama_id')
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    loan = Loan.query.filter_by(id=loan_id, chama_id=chama_id).first()
    if not loan:
        return jsonify({"message": "Loan not found"}), 404
    if loan.status not in ('disbursed', 'repaid'):
        return jsonify({"message": "This loan is not active — cannot repay."}), 400

    # Members can only repay their own loans; admins can repay any
    member = Member.query.get(loan.member_id)
    claims = get_jwt()
    is_admin = claims.get('role') in ('Chairman', 'Treasurer', 'Secretary')
    if not is_admin and (not member or member.user_id != user_id):
        return jsonify({"message": "You cannot repay this loan."}), 403

    if amount > loan.balance:
        amount = loan.balance

    loan.balance -= amount
    if loan.balance <= 0:
        loan.balance = 0
        loan.status = 'repaid'

    db.session.add(Transaction(
        chama_id=chama_id,
        member_id=loan.member_id,
        amount=amount,
        type='loan_repayment',
        status='completed',
    ))
    db.session.commit()

    payer = User.query.get(member.user_id) if member else None
    payer_name = payer.name if payer else 'A member'

    try:
        notif_svc.notify_chama_admins(
            chama_id=chama_id,
            type='success',
            event='payments',
            title='Loan repayment received',
            body=f'{payer_name} repaid {_fmt_ksh(amount)}. Remaining: {_fmt_ksh(loan.balance)}.',
            link='/dashboard/loans',
        )
    except Exception:
        logger.exception('repayment admin notification failed')

    if member:
        try:
            notif_svc.notify_member(
                chama_id=chama_id,
                user_id=member.user_id,
                type='success',
                event='paymentConfirmations',
                title='Repayment recorded',
                body=f'{_fmt_ksh(amount)} applied. Remaining balance: {_fmt_ksh(loan.balance)}.',
                link='/member/loans',
            )
        except Exception:
            logger.exception('repayment member notification failed')

    logger.info('loan %s repaid: amount=%s remaining=%s',
                loan.id, amount, loan.balance)
    return jsonify({"message": "Repayment recorded", "remaining_balance": loan.balance}), 200
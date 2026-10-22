from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.finance import Transaction, Loan
from app.models.chama import Member
from app.models.user import User # <-- Added for the GET loans route
from datetime import datetime

finance_bp = Blueprint('finance', __name__)


# 1. RECORD A CONTRIBUTION (Manual / Cash)
@finance_bp.route('/contribution', methods=['POST'])
@jwt_required()
def record_contribution():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    data = request.get_json()
    
    member_id = data.get('member_id')
    amount = float(data.get('amount', 0))
    
    if amount <= 0:
        return jsonify({"message": "Amount must be greater than 0"}), 400

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        return jsonify({"message": "Member not found in this chama"}), 404

    # Update member savings
    member.savings += amount

    # Create transaction record
    new_tx = Transaction(
        chama_id=chama_id,
        member_id=member_id,
        amount=amount,
        type='contribution',
        status='completed',
        reference=data.get('reference', 'Manual Entry')
    )
    
    db.session.add(new_tx)
    db.session.commit()

    return jsonify({"message": "Contribution recorded", "new_balance": member.savings}), 201


# 2. GET ALL LOANS FOR THIS CHAMA
# (This is what the React frontend needs to populate the Loans table)
@finance_bp.route('/loans', methods=['GET'])
@jwt_required()
def get_loans():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    
    # Fetch all loans for this chama, newest first
    loans = Loan.query.filter_by(chama_id=chama_id).order_by(Loan.created_at.desc()).all()
    
    result = []
    for l in loans:
        # Join with Member and User to get the member's name
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
            "created_at": l.created_at.isoformat()
        })
        
    return jsonify(result), 200


# 3. APPLY FOR A LOAN
@finance_bp.route('/loans/apply', methods=['POST'])
@jwt_required()
def apply_loan():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    user_id = claims.get('sub') # User ID from token
    data = request.get_json()
    
    amount = float(data.get('amount', 0))
    purpose = data.get('purpose', 'General') # <-- Grab purpose from React
    
    if amount <= 0:
        return jsonify({"message": "Invalid loan amount"}), 400

    member = Member.query.filter_by(user_id=user_id, chama_id=chama_id).first()
    if not member:
        return jsonify({"message": "Member not found"}), 404

    # Check if they already have an active loan
    active_loan = Loan.query.filter_by(member_id=member.id, status='disbursed').first()
    if active_loan:
        return jsonify({"message": "You already have an active loan"}), 400

    new_loan = Loan(
        chama_id=chama_id,
        member_id=member.id,
        amount=amount,
        balance=amount,
        status='pending',
        purpose=purpose # <-- Save it to the database
    )
    
    db.session.add(new_loan)
    db.session.commit()

    return jsonify({"message": "Loan application submitted", "loan_id": new_loan.id}), 201


# 4. APPROVE / REJECT LOAN (Admin Only)
@finance_bp.route('/loans/<loan_id>/status', methods=['PATCH'])
@jwt_required()
def update_loan_status(loan_id):
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    role = claims.get('role')
    data = request.get_json()
    
    # Ensure only admins can approve/reject
    if role not in ['Chairman', 'Treasurer']:
        return jsonify({"message": "Unauthorized. Admin access required."}), 403

    loan = Loan.query.filter_by(id=loan_id, chama_id=chama_id).first()
    if not loan:
        return jsonify({"message": "Loan not found"}), 404

    new_status = data.get('status') # 'approved', 'rejected', 'disbursed'
    if new_status not in ['approved', 'rejected', 'disbursed', 'repaid']:
        return jsonify({"message": "Invalid status"}), 400

    loan.status = new_status

    # If disbursed, create a transaction
    if new_status == 'disbursed':
        new_tx = Transaction(
            chama_id=chama_id,
            member_id=loan.member_id,
            amount=loan.amount,
            type='loan_disbursement',
            status='completed'
        )
        db.session.add(new_tx)

    db.session.commit()
    return jsonify({"message": f"Loan marked as {new_status}"}), 200


# 5. RECORD A LOAN REPAYMENT
@finance_bp.route('/loans/<loan_id>/repay', methods=['POST'])
@jwt_required()
def repay_loan(loan_id):
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    data = request.get_json()
    
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    loan = Loan.query.filter_by(id=loan_id, chama_id=chama_id).first()
    if not loan or loan.status not in ['disbursed', 'repaid']:
        return jsonify({"message": "Active loan not found"}), 404

    # Prevent overpayment
    if amount > loan.balance:
        amount = loan.balance

    loan.balance -= amount
    if loan.balance <= 0:
        loan.status = 'repaid'

    new_tx = Transaction(
        chama_id=chama_id,
        member_id=loan.member_id,
        amount=amount,
        type='loan_repayment',
        status='completed'
    )
    
    db.session.add(new_tx)
    db.session.commit()

    return jsonify({"message": "Repayment recorded", "remaining_balance": loan.balance}), 200
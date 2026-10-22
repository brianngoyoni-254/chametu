from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.chama import Chama, Member
from app.models.user import User
import uuid

chama_bp = Blueprint('chama', __name__)

# Helper function to check if the current user is an admin
def is_admin(role):
    return role in ['Chairman', 'Treasurer', 'Secretary']

# 1. GET CHAMA DETAILS

@chama_bp.route('/details', methods=['GET'])
@jwt_required()
def get_chama_details():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    
    chama = Chama.query.get(chama_id)
    if not chama:
        return jsonify({"message": "Chama not found"}), 404

    return jsonify({
        "id": chama.id,
        "name": chama.name,
        "code": chama.code,
        "type": chama.type,
        "base_tier": chama.base_tier,
        "monthly_contribution": chama.monthly_contribution,
        "due_day": chama.due_day,
        "late_fee": chama.late_fee
    }), 200


# 2. GET ALL MEMBERS (Joins User data)

@chama_bp.route('/members', methods=['GET'])
@jwt_required()
def get_members():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    
    # We join Member and User to get the name, email, and phone
    members_data = db.session.query(Member, User).join(User, Member.user_id == User.id).filter(Member.chama_id == chama_id).all()
    
    result = []
    for member, user in members_data:
        result.append({
            "id": member.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": member.role,
            "status": member.status,
            "savings": member.savings,
            "joined_at": member.id # You can add created_at to Member model later
        })
        
    return jsonify(result), 200


# 3. INVITE A NEW MEMBER

@chama_bp.route('/members/invite', methods=['POST'])
@jwt_required()
def invite_member():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    admin_role = claims.get('role')
    
    if not is_admin(admin_role):
        return jsonify({"message": "Unauthorized. Admin access required."}), 403

    data = request.get_json()
    email = data.get('email').lower()
    name = data.get('name')
    role = data.get('role', 'Member')
    
    # Check if the user already exists in the system
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # If user doesn't exist, create a placeholder user with 'invited' status
        user = User(
            name=name,
            email=email,
            password_hash="INVITED_USER_MUST_SET_PASSWORD" # We will handle this in the invite link
        )
        db.session.add(user)
        db.session.flush()
        
    # Check if they are already in THIS chama
    existing_member = Member.query.filter_by(user_id=user.id, chama_id=chama_id).first()
    if existing_member:
        return jsonify({"message": "User is already a member of this chama"}), 400

    # Add them to the chama
    new_member = Member(
        user_id=user.id,
        chama_id=chama_id,
        role=role,
        status='invited',
        savings=0.0
    )
    
    db.session.add(new_member)
    db.session.commit()

    # TODO: Trigger email service here to send the invite link
    # invite_link = f"http://localhost:5173/join/{chama.code}/{new_member.id}"
    
    return jsonify({"message": f"Invitation sent to {email}"}), 201


# 4. CHANGE A MEMBER'S ROLE

@chama_bp.route('/members/<member_id>/role', methods=['PATCH'])
@jwt_required()
def change_role(member_id):
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    admin_role = claims.get('role')
    
    if admin_role != 'Chairman': # Only Chairman can change roles
        return jsonify({"message": "Only the Chairman can change roles"}), 403

    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['Chairman', 'Treasurer', 'Secretary', 'Member']:
         return jsonify({"message": "Invalid role"}), 400

    member = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not member:
        return jsonify({"message": "Member not found"}), 404

    member.role = new_role
    db.session.commit()

    return jsonify({"message": "Role updated successfully"}), 200


# 5. UPDATE CHAMA SETTINGS
@chama_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    claims = get_jwt()
    chama_id = claims.get('chama_id')
    admin_role = claims.get('role')
    
    if admin_role not in ['Chairman', 'Treasurer']:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    chama = Chama.query.get(chama_id)
    
    if 'monthly_contribution' in data:
        chama.monthly_contribution = float(data['monthly_contribution'])
    if 'due_day' in data:
        chama.due_day = int(data['due_day'])
    if 'late_fee' in data:
        chama.late_fee = float(data['late_fee'])
        
    db.session.commit()
    return jsonify({"message": "Chama settings updated"}), 200
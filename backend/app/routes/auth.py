from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app import db
from app.models.chama import Chama, Member
import random
import string 

auth_bp = Blueprint('auth', __name__)

def generate_chama_code():
    chars=string.ascii_uppercase + string.digits
    code=''.join(random.choices(chars,k=6))
    return f"CHM-{code}"

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # 1. Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already exists"}), 400

    # 2. Create the User
    new_user = User(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone')
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.flush()

    # 3. Create the Chama
    new_chama = Chama(
        name=data['chama_name'],
        code=generate_chama_code(),
        base_tier=data.get('tier', 'Starter'),
        monthly_contribution=data.get('amount', 1000)
    )
    db.session.add(new_chama)
    db.session.flush()

    # 4. Make the user the Chairman of this chama
    new_member = Member(
        user_id=new_user.id,
        chama_id=new_chama.id,
        role='Chairman',
        status='active'
    )
    db.session.add(new_member)
    db.session.commit()

    # 5. Create JWT Token
    access_token = create_access_token(
        identity=new_user.id,
        additional_claims={"chama_id": new_chama.id, "role": "Chairman"}
    )

    return jsonify({
        "message": "Chama created successfully",
        "token": access_token,
        # ADDED "role": "Chairman" HERE 👇
        "user": {"name": new_user.name, "email": new_user.email, "role": "Chairman"},
        "chama": {"name": new_chama.name, "code": new_chama.code, "tier": new_chama.base_tier}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({"message": "Invalid email or password"}), 401

    member_record = Member.query.filter_by(user_id=user.id).first()
    
    if not member_record:
        return jsonify({"message": "No chama found for this user"}), 404

    chama = Chama.query.get(member_record.chama_id)

    access_token = create_access_token(
        identity=user.id,
        additional_claims={"chama_id": chama.id, "role": member_record.role}
    )

    return jsonify({
        "token": access_token,
        "user": {"name": user.name, "email": user.email, "role": member_record.role},
        "chama": {"name": chama.name, "code": chama.code, "tier": chama.base_tier}
    }), 200
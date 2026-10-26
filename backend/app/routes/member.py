# app/routes/member.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

from app.models.user import User
from app.models.chama import Chama, Member
from app.services.member_service import (
    get_member_finance_data,
    accept_member_invite,
    verify_chama_invite,
)

member_bp = Blueprint('member', __name__)


# ---------- LOGIN ----------
@member_bp.route('/login', methods=['POST'])
def member_login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    member = Member.query.filter_by(user_id=user.id).first()
    if not member:
        return jsonify({"message": "No chama membership found"}), 404

    chama = Chama.query.get(member.chama_id)
    portal = "member" if member.role.lower() == "member" else "admin"

    token = create_access_token(
        identity=user.id,
        additional_claims={
            "chama_id": chama.id,
            "role": member.role,
            "portal": portal,
        },
    )

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": member.role,
            "portal": portal,
        },
        "chama": {
            "id": chama.id,
            "name": chama.name,
            "code": chama.code,
            "tier": chama.base_tier,
            "monthly_contribution": chama.monthly_contribution,
            "due_day": chama.due_day,
        },
    }), 200


# ---------- VERIFY INVITE ----------
@member_bp.route('/invites/<chama_code>/<token>', methods=['GET'])
def verify_invite(chama_code, token):
    try:
        data = verify_chama_invite(chama_code, token)
        return jsonify(data), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


# ---------- ACCEPT INVITE ----------
@member_bp.route('/accept-invite', methods=['POST'])
def accept_invite():
    data = request.get_json() or {}

    try:
        result = accept_member_invite(
            email=(data.get('email') or '').lower().strip(),
            name=(data.get('name') or '').strip(),
            password=data.get('password') or '',
            chama_code=data.get('chama_code') or '',
            role=data.get('role') or 'Member',
            phone=data.get('phone'),
            token=data.get('token'),
        )

        token = create_access_token(
            identity=result['user']['id'],
            additional_claims={
                "chama_id": result['chama']['id'],
                "role": result['user']['role'],
                "portal": result['user']['portal'],
            },
        )

        return jsonify({
            "token": token,
            "user": result['user'],
            "chama": result['chama'],
        }), 201

    except ValueError as e:
        return jsonify({"message": str(e)}), 400


# ---------- PROFILE ----------
@member_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    member = Member.query.filter_by(user_id=user_id).first()
    if not member:
        return jsonify({"message": "Membership not found"}), 404

    chama = Chama.query.get(member.chama_id)
    portal = "member" if member.role.lower() == "member" else "admin"

    return jsonify({
        "user": {
            "id": user.id, "name": user.name, "email": user.email,
            "phone": user.phone, "role": member.role,
            "portal": portal,
        },
        "chama": {
            "id": chama.id, "name": chama.name, "code": chama.code,
            "tier": chama.base_tier,
            "monthly_contribution": chama.monthly_contribution,
            "due_day": chama.due_day,
        },
        "savings": member.savings,
    }), 200


# ---------- FINANCE ----------
@member_bp.route('/finance', methods=['GET'])
@jwt_required()
def finance():
    user_id = get_jwt_identity()
    data = get_member_finance_data(user_id)
    if not data:
        return jsonify({"message": "Membership not found"}), 404
    return jsonify(data), 200
# app/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)
from app import db
from app.models.user import User
from app.models.chama import Chama, Member, ChamaSettings
import random
import string

auth_bp = Blueprint("auth", __name__)

ADMIN_ROLES = ["Chairman", "Treasurer", "Secretary"]


def generate_chama_code():
    chars = string.ascii_uppercase + string.digits
    return "CHM-" + "".join(random.choices(chars, k=6))


def _portal_for(role: str) -> str:
    return "admin" if role in ADMIN_ROLES else "member"


# ---------------------------------------------------------------------
# REGISTER — creates User + Chama + Member(Chairman) in one shot
# ---------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    phone = (data.get("phone") or "").strip() or None
    chama_name = (data.get("chama_name") or "").strip() or f"{name}'s Chama"
    tier = data.get("tier") or "Starter"
    monthly = float(data.get("amount") or 1000)

    if not name or not email or len(password) < 8:
        return jsonify({"message": "Name, email and password (min 8 chars) are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "An account with that email already exists"}), 409

    if phone and User.query.filter_by(phone=phone).first():
        return jsonify({"message": "That phone number is already in use"}), 409

    # 1. User
    user = User(name=name, email=email, phone=phone)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # 2. Chama
    chama = Chama(
        name=chama_name,
        code=generate_chama_code(),
        type="Investment",
        base_tier=tier,
        monthly_contribution=monthly,
    )
    db.session.add(chama)
    db.session.flush()

    # 3. Default settings row
    db.session.add(ChamaSettings(chama_id=chama.id))

    # 4. Membership as Chairman
    member = Member(
        user_id=user.id,
        chama_id=chama.id,
        role="Chairman",
        status="active",
        phone=phone,
        savings=0.0,
    )
    db.session.add(member)
    db.session.commit()

    token = create_access_token(
        identity=user.id,
        additional_claims={
            "chama_id": chama.id,
            "role": member.role,
            "portal": _portal_for(member.role),
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
            "portal": _portal_for(member.role),
        },
        "chama": {
            "id": chama.id,
            "name": chama.name,
            "code": chama.code,
            "tier": chama.base_tier,
            "monthly_contribution": chama.monthly_contribution,
            "due_day": chama.due_day,
        },
    }), 201


# ---------------------------------------------------------------------
# LOGIN — single endpoint that works for admin + member portals
# ---------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    member = Member.query.filter_by(user_id=user.id).first()
    if not member:
        return jsonify({"message": "No chama membership found for this account"}), 404

    chama = Chama.query.get(member.chama_id)
    if not chama:
        return jsonify({"message": "Chama not found"}), 404

    portal = _portal_for(member.role)

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


# ---------------------------------------------------------------------
# PROFILE / PASSWORD (already existed — kept)
# ---------------------------------------------------------------------
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}

    if "phone" in data and data["phone"] != user.phone:
        if data["phone"] and User.query.filter_by(phone=data["phone"]).first():
            return jsonify({"message": "Phone number already in use"}), 400

    if "name" in data and data["name"]:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]

    member = Member.query.filter_by(user_id=user.id).first()
    if member and "phone" in data:
        member.phone = user.phone

    db.session.commit()
    return jsonify({
        "message": "Profile updated",
        "user": {"name": user.name, "phone": user.phone},
    }), 200


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    current_pw = data.get("currentPassword")
    new_pw = data.get("newPassword")

    if not user.check_password(current_pw):
        return jsonify({"message": "Incorrect current password"}), 401

    if not new_pw or len(new_pw) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400

    user.set_password(new_pw)
    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200
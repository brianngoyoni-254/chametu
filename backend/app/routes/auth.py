# app/routes/auth.py
import logging
import random
import string

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)

from app import db
from app.models.user import User
from app.models.chama import Chama, Member, ChamaSettings
from app.logging_utils import log_writes
from app.services import member_service

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)

ADMIN_ROLES = ["Chairman", "Treasurer", "Secretary"]


def generate_chama_code():
    chars = string.ascii_uppercase + string.digits
    return "CHM-" + "".join(random.choices(chars, k=6))


def _portal_for(role: str) -> str:
    return "admin" if role in ADMIN_ROLES else "member"


# ---------------------------------------------------------------------
# INVITE VERIFICATION & ACCEPTANCE
# ---------------------------------------------------------------------
@auth_bp.route("/invites/<chama_code>/<token>", methods=["GET"])
def verify_invite(chama_code, token):
    """Checks if the invite link is valid and returns chama details."""
    try:
        data = member_service.verify_chama_invite(chama_code, token)
        return jsonify(data), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


@auth_bp.route("/accept-invite", methods=["POST"])
@log_writes(logger, 'auth.invite_accept')
def accept_invite():
    """Creates a new user account from an invite and logs them in."""
    data = request.get_json() or {}

    email = (data.get("email") or "").lower().strip()
    name = (data.get("name") or "").strip()
    password = data.get("password") or ""
    chama_code = data.get("chamaCode")
    role = data.get("role", "Member")
    phone = data.get("phone")
    token = data.get("token")

    if not email or not name or len(password) < 6 or not chama_code:
        return jsonify({"message": "Name, email, password and chama code are required"}), 400

    # Blocked chama check
    chama = Chama.query.filter_by(code=chama_code).first()
    if chama and chama.is_blocked:
        return jsonify({"message": "This chama account is suspended. Please contact the chairman or support."}), 403

    try:
        result = member_service.accept_member_invite(
            email=email,
            name=name,
            password=password,
            chama_code=chama_code,
            role=role,
            phone=phone,
            token=token,
        )
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception:
        logger.exception("Failed to accept invite")
        return jsonify({"message": "An error occurred while creating the account"}), 500

    portal = _portal_for(result['user']['role'])
    token = create_access_token(
        identity=result['user']['id'],
        additional_claims={
            "chama_id": result['chama']['id'],
            "role": result['user']['role'],
            "portal": portal,
        }
    )

    return jsonify({
        "token": token,
        "user": {
            **result['user'],
            "portal": portal
        },
        "chama": result['chama']
    }), 201


# ---------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
@log_writes(logger, 'auth.register')
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    phone = (data.get("phone") or "").strip()
    chama_name = (data.get("chama_name") or "").strip() or f"{name}'s Chama"
    tier = data.get("tier") or "Starter"
    monthly = float(data.get("amount") or 1000)

    if not name or not email or not phone or len(password) < 8:
        logger.warning('register validation failed: name=%r email=%r phone=%r', name, email, phone)
        return jsonify({"message": "Name, email, phone, and password (min 8 chars) are required"}), 400

    if User.query.filter_by(email=email).first():
        logger.warning('register duplicate email: %s', email)
        return jsonify({"message": "An account with that email already exists"}), 409

    if User.query.filter_by(phone=phone).first():
        logger.warning('register duplicate phone: %s', phone)
        return jsonify({"message": "That phone number is already in use"}), 409

    user = User(name=name, email=email, phone=phone)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    chama = Chama(
        name=chama_name,
        code=generate_chama_code(),
        type="Investment",
        base_tier=tier,
        monthly_contribution=monthly,
    )
    db.session.add(chama)
    db.session.flush()

    db.session.add(ChamaSettings(chama_id=chama.id))

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

    logger.info(
        'registered user=%s chama=%s code=%s',
        user.email, chama.name, chama.code,
    )

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
# LOGIN
# ---------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
@log_writes(logger, 'auth.login')
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        logger.warning('login failed for email=%s', email)
        return jsonify({"message": "Invalid email or password"}), 401

    member = Member.query.filter_by(user_id=user.id).first()
    if not member:
        logger.warning('login: user %s has no membership', email)
        return jsonify({"message": "No chama membership found for this account"}), 404

    chama = Chama.query.get(member.chama_id)
    if not chama:
        logger.error(
            'login: user %s membership points to missing chama %s',
            email, member.chama_id,
        )
        return jsonify({"message": "Chama not found"}), 404

    # Blocked chama check
    if chama.is_blocked:
        logger.warning('login blocked: chama %s is suspended (user=%s, role=%s)',
                       chama.code, email, member.role)
        return jsonify({
            "message": "Your chama account has been suspended. Please contact support to restore access.",
            "blocked": True,
        }), 403

    portal = _portal_for(member.role)

    token = create_access_token(
        identity=user.id,
        additional_claims={
            "chama_id": chama.id,
            "role": member.role,
            "portal": portal,
        },
    )

    logger.info(
        'login ok: user=%s role=%s chama=%s',
        user.email, member.role, chama.code,
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
# PROFILE
# ---------------------------------------------------------------------
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
@log_writes(logger, 'auth.profile_update')
def update_profile():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}

    if "phone" in data and data["phone"] != user.phone:
        if data["phone"] and User.query.filter_by(phone=data["phone"]).first():
            logger.warning('profile: phone already in use: %s', data["phone"])
            return jsonify({"message": "Phone number already in use"}), 400

    if "name" in data and data["name"]:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]

    member = Member.query.filter_by(user_id=user.id).first()
    if member and "phone" in data:
        member.phone = user.phone

    db.session.commit()
    logger.info('profile updated for %s', user.email)
    return jsonify({
        "message": "Profile updated",
        "user": {"name": user.name, "phone": user.phone},
    }), 200


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
@log_writes(logger, 'auth.password_change')
def change_password():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    current_pw = data.get("currentPassword")
    new_pw = data.get("newPassword")

    if not user.check_password(current_pw):
        logger.warning('password change: wrong current password for %s', user.email)
        return jsonify({"message": "Incorrect current password"}), 401

    if not new_pw or len(new_pw) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400

    user.set_password(new_pw)
    db.session.commit()
    logger.info('password changed for %s', user.email)
    return jsonify({"message": "Password updated successfully"}), 200
# app/routes/auth.py
import logging
import random
import string
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)

from app import db
from app.models.user import User
from app.models.chama import Chama, Member
from app.logging_utils import log_writes
from app.services import member_service, trial_service
from app.services.email_service import send_email

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)

ADMIN_ROLES = ["Chairman", "Treasurer", "Secretary"]


def _portal_for(role: str) -> str:
    return "admin" if role in ADMIN_ROLES else "member"


# ---------------------------------------------------------------------
# INVITE VERIFICATION & ACCEPTANCE
# ---------------------------------------------------------------------
@auth_bp.route("/invites/<chama_code>/<token>", methods=["GET"])
def verify_invite(chama_code, token):
    try:
        data = member_service.verify_chama_invite(chama_code, token)
        return jsonify(data), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


@auth_bp.route("/accept-invite", methods=["POST"])
@log_writes(logger, 'auth.invite_accept')
def accept_invite():
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

    trial_status = trial_service.get_status(chama.id)

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
        "trial": trial_status,
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


# ---------------------------------------------------------------------
# PASSWORD RESET
# ---------------------------------------------------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
@log_writes(logger, 'auth.forgot_password')
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Return 200 even if user not found for security
        return jsonify({"message": "If that email is registered, a reset code has been sent."}), 200

    # Generate a 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()

    subject = "Chametu Password Reset Code"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #0B1F33; padding: 20px;">
        <h2 style="color: #0B7A5A; margin-top: 0;">Reset Your Password</h2>
        <p>Hi {user.name},</p>
        <p>We received a request to reset your Chametu password. Use the code below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0B7A5A; background: #F0FDF4; padding: 10px 20px; border-radius: 8px;">
                {code}
            </span>
        </div>
        <p>This code will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E3E9EF; margin: 20px 0;">
        <p style="font-size: 13px; color: #64748B;">Thank you,<br/>The Chametu Team</p>
    </div>
    """
    
    send_email(user.email, subject, html)

    logger.info('Password reset code sent to %s', user.email)
    return jsonify({"message": "If that email is registered, a reset code has been sent."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@log_writes(logger, 'auth.reset_password')
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()
    code = (data.get("code") or "").strip()
    new_password = data.get("newPassword")

    if not email or not code or not new_password:
        return jsonify({"message": "Email, code, and new password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Invalid request"}), 400

    if user.reset_code != code:
        return jsonify({"message": "Invalid reset code"}), 400

    # FIXED: Handle timezone-aware datetime from Neon DB
    if user.reset_code_expires:
        expires = user.reset_code_expires
        if expires.tzinfo is not None:
            expires = expires.replace(tzinfo=None)
        
        if expires < datetime.utcnow():
            return jsonify({"message": "Reset code has expired. Please request a new one."}), 400

    # Update password and clear the reset code
    user.set_password(new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.session.commit()

    logger.info('Password successfully reset for %s', user.email)
    return jsonify({"message": "Password reset successfully. You can now log in."}), 200
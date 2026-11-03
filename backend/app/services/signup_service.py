# app/services/signup_service.py
"""Single place where a chairman account + chama is actually created."""
import random
import string

from flask_jwt_extended import create_access_token

from app import db
from app.models.chama import Chama, ChamaSettings, Member
from app.models.user import User

ADMIN_ROLES = ("Chairman", "Treasurer", "Secretary")


def portal_for(role: str) -> str:
    return "admin" if role in ADMIN_ROLES else "member"


def generate_chama_code() -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "CHM-" + "".join(random.choices(chars, k=6))
        if not Chama.query.filter_by(code=code).first():
            return code


def hash_password(plain: str) -> str:
    """Hash with whatever scheme User.set_password uses, without touching the DB."""
    tmp = User()
    tmp.set_password(plain)
    return tmp.password_hash


def create_chama_account(*, name, email, phone, chama_name, tier,
                         monthly=1000.0, password=None, password_hash=None,
                         member_phone=None):
    """
    Create User + Chama + ChamaSettings + Member(Chairman). Flushes but does NOT
    commit, so the caller controls the transaction.
    """
    user = User(name=name, email=email, phone=phone)
    if password_hash:
        user.password_hash = password_hash
    else:
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
        phone=member_phone or phone,
        savings=0.0,
    )
    db.session.add(member)
    db.session.flush()
    return user, chama, member


def build_session(user, chama, member):
    """The same payload shape /login returns."""
    portal = portal_for(member.role)
    token = create_access_token(
        identity=user.id,
        additional_claims={
            "chama_id": chama.id,
            "role": member.role,
            "portal": portal,
        },
    )
    return {
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
    }
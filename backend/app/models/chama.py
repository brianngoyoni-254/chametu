# app/models/chama.py
from app import db
from datetime import datetime
import uuid


class Chama(db.Model):
    __tablename__ = 'chamas'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    type = db.Column(db.String(50), default='Investment')
    base_tier = db.Column(db.String(20), default='Starter')

    # ---------- Blocking ----------
    is_blocked = db.Column(db.Boolean, default=False, nullable=False)
    blocked_at = db.Column(db.DateTime, nullable=True)

    # ---------- contribution schedule ----------
    monthly_contribution = db.Column(db.Float, default=0.0)
    contribution_frequency = db.Column(
        db.String(20), nullable=False, default='monthly',
    )  # 'weekly' | 'monthly' | 'quarterly'
    due_day = db.Column(db.Integer, default=30)    # for monthly/quarterly
    due_weekday = db.Column(db.Integer, default=1) # 0=Mon..6=Sun, for weekly
    late_fee = db.Column(db.Float, default=100.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    members = db.relationship('Member', backref='chama', lazy=True)
    roles = db.relationship('Role', backref='chama', lazy=True, cascade="all, delete-orphan")


class Role(db.Model):
    """
    Dynamic roles for each chama. Permissions are stored as JSON.
    System roles (Chairman, Treasurer, etc.) are seeded automatically
    and cannot be deleted.
    """
    __tablename__ = 'roles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), default='')
    icon = db.Column(db.String(50), default='UserCog')
    system = db.Column(db.Boolean, default=False)

    # Stores the exact structure frontend expects: {"manageMembers": true, "approveLoans": false, ...}
    perms = db.Column(db.JSON, nullable=False, default=dict)

    __table_args__ = (
        db.UniqueConstraint('chama_id', 'name', name='_chama_role_name_uc'),
    )


class Member(db.Model):
    __tablename__ = 'members'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False)

    role = db.Column(db.String(50), default='Member')
    status = db.Column(db.String(20), default='active')
    savings = db.Column(db.Float, default=0.0)
    phone = db.Column(db.String(20), nullable=True)

    # NULL → use Chama.monthly_contribution. Non-null → per-member override.
    contribution_override = db.Column(db.Float, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'chama_id', name='_user_chama_uc'),
    )


class ChamaSettings(db.Model):
    __tablename__ = 'chama_settings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chama_id = db.Column(db.String(36), db.ForeignKey('chamas.id'), nullable=False, unique=True)

    platform_name = db.Column(db.String(100), default='Chametu')
    support_email = db.Column(db.String(120), default='support@chametu.co.ke')
    timezone = db.Column(db.String(50), default='Africa/Nairobi')
    paybill = db.Column(db.String(20), default='400200')
    account_ref = db.Column(db.String(50), default='CHAMETU')
    grace_period = db.Column(db.Integer, default=7)
    auto_block_days = db.Column(db.Integer, default=14)

    monthly_profit_target = db.Column(db.Float, nullable=False, default=0.0)
    profit_target_basis = db.Column(db.String(20), nullable=False, default='savings')
    profit_target_period = db.Column(db.String(20), nullable=False, default='month')

    # ---------- M-Pesa contribution method (NEW) ----------
    # Where members send their contribution payments.
    #   'send_money' → personal phone number
    #   'paybill'    → paybill number + account ref
    #   'till'       → buy goods / till number
    contribution_method = db.Column(db.String(20), nullable=False, default='paybill')
    contribution_number = db.Column(db.String(20), nullable=False, default='')
    contribution_account_ref = db.Column(db.String(50), nullable=False, default='')
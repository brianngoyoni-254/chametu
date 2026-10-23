# app/services/member_service.py
import logging
import secrets
from datetime import datetime, timedelta

from app import db
from app.models.user import User
from app.models.chama import Chama, Member
from app.models.invite import Invite
from app.models.contribution import MemberInvite

logger = logging.getLogger(__name__)

ADMIN_ROLES = ['Chairman', 'Treasurer', 'Secretary']
INVITE_TTL_DAYS = 7


# ============================ READ ============================
def list_members(chama_id):
    rows = (
        db.session.query(Member, User)
        .join(User, Member.user_id == User.id)
        .filter(Member.chama_id == chama_id)
        .all()
    )
    return [
        {
            'id': m.id,
            'userId': u.id,
            'name': u.name,
            'email': u.email,
            'phone': u.phone or m.phone or '',
            'role': m.role,
            'status': m.status,
            'savings': float(m.savings or 0),
            'contributionOverride': (
                float(m.contribution_override)
                if m.contribution_override is not None
                else None
            ),
        }
        for m, u in rows
    ]


def get_member(chama_id, member_id):
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        return None
    u = User.query.get(m.user_id)
    return {
        'id': m.id,
        'userId': u.id if u else None,
        'name': u.name if u else '',
        'email': u.email if u else '',
        'phone': u.phone or m.phone or '',
        'role': m.role,
        'status': m.status,
        'savings': float(m.savings or 0),
        'contributionOverride': (
            float(m.contribution_override)
            if m.contribution_override is not None
            else None
        ),
    }


# ============================ UPDATE ============================
def update_member(chama_id, member_id, patch):
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        raise ValueError('Member not found')

    user = User.query.get(m.user_id)
    if not user:
        raise ValueError('Linked user missing')

    if 'name' in patch and patch['name']:
        user.name = str(patch['name']).strip()

    if 'email' in patch and patch['email']:
        new_email = str(patch['email']).strip().lower()
        if new_email != user.email:
            if User.query.filter_by(email=new_email).first():
                raise ValueError('Email already in use')
            user.email = new_email

    if 'phone' in patch:
        raw = patch['phone']
        new_phone = str(raw).strip() if raw else None
        if new_phone and new_phone != user.phone:
            if User.query.filter_by(phone=new_phone).first():
                raise ValueError('Phone number already in use')
            user.phone = new_phone
        elif new_phone is None:
            user.phone = None
        m.phone = user.phone

    if 'role' in patch and patch['role'] in ADMIN_ROLES + ['Member']:
        m.role = patch['role']

    if 'status' in patch and patch['status'] in ('active', 'inactive', 'invited'):
        m.status = patch['status']

    # Allow clearing or setting the per-member contribution override
    # via the same update path (used by the Members page).
    if 'contributionOverride' in patch:
        raw = patch['contributionOverride']
        if raw is None or raw == '':
            m.contribution_override = None
        else:
            try:
                v = float(raw)
            except (TypeError, ValueError):
                raise ValueError('Invalid contribution override')
            if v < 0:
                raise ValueError('Contribution override cannot be negative')
            m.contribution_override = v

    db.session.commit()
    logger.info('member updated: chama=%s member=%s fields=%s',
                chama_id, member_id, list(patch.keys()))
    return get_member(chama_id, member_id)


def change_role(chama_id, member_id, new_role):
    if new_role not in ADMIN_ROLES + ['Member']:
        raise ValueError('Invalid role')
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        raise ValueError('Member not found')
    old = m.role
    m.role = new_role
    db.session.commit()
    logger.info('role change: member=%s %s -> %s', member_id, old, new_role)
    return get_member(chama_id, member_id)


# ============================ DELETE ============================
def remove_member(chama_id, member_id):
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        raise ValueError('Member not found')
    m.status = 'inactive'
    db.session.commit()
    logger.info('member deactivated: chama=%s member=%s', chama_id, member_id)


def hard_delete_member(chama_id, member_id):
    m = Member.query.filter_by(id=member_id, chama_id=chama_id).first()
    if not m:
        raise ValueError('Member not found')
    user = User.query.get(m.user_id)
    db.session.delete(m)
    if user and user.memberships and len(user.memberships) <= 1:
        db.session.delete(user)
    db.session.commit()
    logger.warning('member HARD-DELETED: chama=%s member=%s', chama_id, member_id)


# ============================ INVITES ============================
def list_invites(chama_id):
    rows = (
        MemberInvite.query
        .filter_by(chama_id=chama_id)
        .order_by(MemberInvite.created_at.desc())
        .all()
    )
    return [
        {
            'id': i.id,
            'contact': i.contact,
            'role': i.role,
            'status': i.status,
            'token': i.token,
            'createdAt': i.created_at.isoformat(),
            'expiresAt': i.expires_at.isoformat() if i.expires_at else None,
        }
        for i in rows
    ]


def create_invite(chama_id, contact, role='Member', invited_name=None,
                 actor_user_id=None):
    chama = Chama.query.get(chama_id)
    if not chama:
        raise ValueError('Chama not found')

    tier_caps = {'Starter': 10, 'Growth': 50, 'Business': 150, 'Gold': 250}
    cap = tier_caps.get(chama.base_tier, 10)
    active_count = Member.query.filter_by(chama_id=chama_id, status='active').count()
    if active_count >= cap:
        logger.warning(
            'invite rejected: chama=%s tier=%s at cap (%s/%s)',
            chama_id, chama.base_tier, active_count, cap,
        )
        raise ValueError(f'Your {chama.base_tier} plan allows up to {cap} members')

    existing = MemberInvite.query.filter_by(
        chama_id=chama_id, contact=contact, status='pending',
    ).first()
    if existing:
        logger.debug('reusing pending invite for %s', contact)
        return {
            'id': existing.id,
            'contact': existing.contact,
            'role': existing.role,
            'status': existing.status,
            'token': existing.token,
            'createdAt': existing.created_at.isoformat(),
            'expiresAt': existing.expires_at.isoformat() if existing.expires_at else None,
        }

    token = secrets.token_urlsafe(32)
    invite = MemberInvite(
        chama_id=chama_id,
        contact=contact,
        role=role,
        token=token,
        status='pending',
        invited_by_user_id=actor_user_id,
        invited_name=invited_name,
        expires_at=datetime.utcnow() + timedelta(days=INVITE_TTL_DAYS),
    )
    db.session.add(invite)

    db.session.add(Invite(
        chama_id=chama_id,
        contact=contact,
        role=role,
        token=token,
        status='pending',
        expires_at=invite.expires_at,
    ))
    db.session.commit()

    logger.info(
        'invite created: chama=%s contact=%s role=%s actor=%s',
        chama_id, contact, role, actor_user_id,
    )
    return {
        'id': invite.id,
        'contact': invite.contact,
        'role': invite.role,
        'status': invite.status,
        'token': invite.token,
        'createdAt': invite.created_at.isoformat(),
        'expiresAt': invite.expires_at.isoformat() if invite.expires_at else None,
    }


def cancel_invite(chama_id, invite_id):
    inv = MemberInvite.query.filter_by(id=invite_id, chama_id=chama_id).first()
    if not inv:
        raise ValueError('Invite not found')
    inv.status = 'cancelled'
    legacy = Invite.query.filter_by(token=inv.token).first()
    if legacy:
        db.session.delete(legacy)
    db.session.commit()
    logger.info('invite cancelled: chama=%s invite=%s', chama_id, invite_id)


# ============================ FINANCE HELPERS ============================
def get_member_finance_data(user_id):
    from app.models.finance import Loan, Transaction
    member = Member.query.filter_by(user_id=user_id).first()
    if not member:
        return None

    loans = Loan.query.filter_by(member_id=member.id).order_by(Loan.created_at.desc()).all()
    contributions = Transaction.query.filter_by(
        member_id=member.id, type='contribution',
    ).order_by(Transaction.created_at.desc()).all()

    active_loan = next((l for l in loans if l.status in ('approved', 'disbursed')), None)

    return {
        'savings': member.savings,
        'loans': [
            {
                'id': l.id, 'amount': l.amount, 'balance': l.balance,
                'status': l.status, 'purpose': l.purpose,
                'created_at': l.created_at.isoformat(),
            }
            for l in loans
        ],
        'contributions': [
            {
                'id': t.id, 'amount': t.amount, 'reference': t.reference,
                'created_at': t.created_at.isoformat(),
            }
            for t in contributions
        ],
        'loan_used': float(active_loan.balance if active_loan else 0),
    }


# ============================ INVITE ACCEPTANCE ============================
def accept_member_invite(email, name, password, chama_code, role, phone=None):
    chama = Chama.query.filter_by(code=chama_code).first()
    if not chama:
        raise ValueError('Invalid chama code')

    user = User.query.filter_by(email=email).first()
    if user:
        member = Member.query.filter_by(user_id=user.id, chama_id=chama.id).first()
        if member:
            raise ValueError('You are already a member of this chama')
        if password:
            user.set_password(password)
    else:
        user = User(name=name, email=email, phone=phone)
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

    member = Member(user_id=user.id, chama_id=chama.id, role=role,
                    status='active', savings=0.0)
    db.session.add(member)

    legacy_invite = Invite.query.filter_by(
        chama_id=chama.id, contact=email, status='pending',
    ).first()
    if legacy_invite:
        legacy_invite.status = 'joined'

    mi = MemberInvite.query.filter_by(
        chama_id=chama.id, contact=email, status='pending',
    ).first()
    if mi:
        mi.status = 'joined'
        mi.joined_at = datetime.utcnow()

    db.session.commit()

    logger.info(
        'invite accepted: chama=%s email=%s role=%s',
        chama.code, email, role,
    )

    portal = 'member' if role.lower() == 'member' else 'admin'
    return {
        'user': {
            'id': user.id, 'name': user.name, 'email': user.email,
            'role': member.role, 'portal': portal,
        },
        'chama': {'id': chama.id, 'name': chama.name, 'code': chama.code},
    }


def verify_chama_invite(chama_code, token):
    chama = Chama.query.filter_by(code=chama_code).first()
    if not chama:
        raise ValueError('Invalid chama code')

    invite = Invite.query.filter_by(token=token, chama_id=chama.id).first()
    if not invite:
        raise ValueError('Invite not found or invalid')

    if invite.status == 'joined':
        raise ValueError('This invite has already been used')

    if invite.expires_at and datetime.utcnow() > invite.expires_at:
        raise ValueError('This invite has expired')

    return {
        'invite': {
            'contact': invite.contact,
            'role': invite.role,
            'status': invite.status,
        },
        'chama': {
            'id': chama.id,
            'name': chama.name,
            'code': chama.code,
        },
    }
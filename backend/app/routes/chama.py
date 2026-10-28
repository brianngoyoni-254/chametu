# app/routes/chama.py
import logging
import secrets
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app import db
from app.models.chama import Chama, Member, Role
from app.models.finance import (
    WelfareClaim, Meeting, Proposal, MemberVote, Asset, Payout, PayoutOrder,
)
from app.models.invite import Invite
from app.models.contribution import MemberInvite
from app.models.settings import PlatformSettings
from app.services import member_service, contribution_service, notification_service as notif_svc
from app.services.intasend import send_stk_push
from app.logging_utils import log_writes
from app.utils.decorators import require_permission

chama_bp = Blueprint('chama', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


def _role():
    return get_jwt().get('role')


# ============================ ROLES & PERMISSIONS ============================

@chama_bp.route('/roles', methods=['GET'])
@jwt_required()
def list_roles():
    cid = _cid()
    roles = Role.query.filter_by(chama_id=cid).all()

    # Auto-seed default roles if the chama has none
    if not roles:
        empty_perms = {
            'manageMembers': False, 'manageContrib': False, 'recordPayments': False,
            'approveLoans': False, 'manageInvestments': False, 'manageMeetings': False,
            'viewReports': False, 'editRoles': False, 'requestLoans': False,
            'makePayments': False, 'raiseIssue': False, 'viewOwnData': False,
        }

        defaults = [
            {'name': 'Chairman', 'icon': 'Shield', 'system': True, 'description': 'Chairs meetings, approves loans and oversees the chama.',
             'perms': {**empty_perms, 'manageMembers': True, 'manageContrib': True, 'recordPayments': True, 'approveLoans': True, 'manageInvestments': True, 'manageMeetings': True, 'viewReports': True, 'editRoles': True, 'requestLoans': True, 'makePayments': True, 'raiseIssue': True, 'viewOwnData': True}},

            {'name': 'Treasurer', 'icon': 'Wallet', 'system': True, 'description': 'Handles contributions, disbursements and financial records.',
             'perms': {**empty_perms, 'manageContrib': True, 'recordPayments': True, 'manageInvestments': True, 'viewReports': True, 'requestLoans': True, 'makePayments': True, 'raiseIssue': True, 'viewOwnData': True}},

            {'name': 'Secretary', 'icon': 'FileText', 'system': True, 'description': 'Records minutes, manages members and documentation.',
             'perms': {**empty_perms, 'manageMembers': True, 'manageMeetings': True, 'requestLoans': True, 'makePayments': True, 'raiseIssue': True, 'viewOwnData': True}},

            {'name': 'Member', 'icon': 'User', 'system': True, 'description': 'Can view their own data, pay, request loans and raise issues.',
             'perms': {**empty_perms, 'requestLoans': True, 'makePayments': True, 'raiseIssue': True, 'viewOwnData': True}},
        ]
        for d in defaults:
            r = Role(chama_id=cid, name=d['name'], icon=d['icon'], system=d['system'], description=d['description'], perms=d['perms'])
            db.session.add(r)
        db.session.commit()
        roles = Role.query.filter_by(chama_id=cid).all()

    return jsonify([{
        'id': r.id, 'name': r.name, 'description': r.description,
        'icon': r.icon, 'system': r.system, 'perms': r.perms
    } for r in roles]), 200


@chama_bp.route('/roles', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chama.role_create')
def create_role():
    cid = _cid()
    data = request.get_json() or {}

    if not data.get('name'):
        return jsonify({'message': 'Role name is required'}), 400

    existing = Role.query.filter_by(chama_id=cid, name=data['name']).first()
    if existing:
        return jsonify({'message': 'Role name already exists'}), 400

    role = Role(
        chama_id=cid,
        name=data['name'],
        description=data.get('description', ''),
        icon=data.get('icon', 'UserCog'),
        system=False,
        perms=data.get('perms', {})
    )
    db.session.add(role)
    db.session.commit()

    return jsonify({
        'id': role.id, 'name': role.name, 'description': role.description,
        'icon': role.icon, 'system': role.system, 'perms': role.perms
    }), 201


@chama_bp.route('/roles/<role_id>', methods=['PUT'])
@jwt_required()
@log_writes(logger, 'chama.role_update')
def update_role(role_id):
    cid = _cid()
    role = Role.query.filter_by(id=role_id, chama_id=cid).first()
    if not role:
        return jsonify({'message': 'Role not found'}), 404

    data = request.get_json() or {}

    # System roles cannot have their name changed, but permissions can be updated
    if 'name' in data and not role.system:
        role.name = data['name']
    if 'description' in data:
        role.description = data['description']
    if 'perms' in data:
        role.perms = data['perms']

    db.session.commit()

    return jsonify({
        'id': role.id, 'name': role.name, 'description': role.description,
        'icon': role.icon, 'system': role.system, 'perms': role.perms
    }), 200


@chama_bp.route('/roles/<role_id>', methods=['DELETE'])
@jwt_required()
@log_writes(logger, 'chama.role_delete')
def delete_role(role_id):
    cid = _cid()
    role = Role.query.filter_by(id=role_id, chama_id=cid).first()
    if not role:
        return jsonify({'message': 'Role not found'}), 404

    if role.system:
        return jsonify({'message': 'Cannot delete default system roles'}), 400

    db.session.delete(role)
    db.session.commit()
    return jsonify({'message': 'Role deleted'}), 200


# ============================ CHAMA ============================
@chama_bp.route('/details', methods=['GET'])
@jwt_required()
def get_chama_details():
    chama = Chama.query.get(_cid())
    if not chama:
        return jsonify({'message': 'Chama not found'}), 404
    return jsonify({
        'id': chama.id, 'name': chama.name, 'code': chama.code,
        'type': chama.type, 'base_tier': chama.base_tier,
        'monthly_contribution': chama.monthly_contribution,
        'contribution_frequency': chama.contribution_frequency,
        'due_day': chama.due_day, 'due_weekday': chama.due_weekday,
        'late_fee': chama.late_fee,
    }), 200


@chama_bp.route('/settings', methods=['PUT'])
@jwt_required()
@log_writes(logger, 'chama.settings_update')
def update_settings():
    if _role() not in ['Chairman', 'Treasurer']:
        return jsonify({'message': 'Unauthorized'}), 403
    chama = Chama.query.get(_cid())
    data = request.get_json() or {}

    if 'contribution_frequency' in data:
        if data['contribution_frequency'] not in ('weekly', 'monthly', 'quarterly'):
            return jsonify({'message': 'Invalid frequency'}), 400
        chama.contribution_frequency = data['contribution_frequency']
    if 'monthly_contribution' in data:
        chama.monthly_contribution = float(data['monthly_contribution'])
    if 'due_day' in data:
        chama.due_day = int(data['due_day'])
    if 'due_weekday' in data:
        chama.due_weekday = int(data['due_weekday'])
    if 'late_fee' in data:
        chama.late_fee = float(data['late_fee'])

    db.session.commit()
    return jsonify({'message': 'Settings updated'}), 200


# ============================ MEMBERS ============================
@chama_bp.route('/members', methods=['GET'])
@jwt_required()
def get_members():
    return jsonify(member_service.list_members(_cid())), 200


@chama_bp.route('/members/<member_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'member.update')
def update_member(member_id):
    cid = _cid()
    data = request.get_json() or {}

    # Capture "before" state so we can notify the member about what changed
    before = Member.query.filter_by(id=member_id, chama_id=cid).first()
    if not before:
        return jsonify({'message': 'Member not found'}), 404
    old_role = before.role
    old_status = before.status
    target_user_id = before.user_id

    try:
        result = member_service.update_member(cid, member_id, data)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    # Build a notification summarizing what changed
    changes = []
    if 'role' in data and data['role'] != old_role:
        changes.append(f'role changed to {data["role"]}')
    if 'status' in data and data['status'] != old_status:
        changes.append(f'account {data["status"]}')
    if 'contributionOverride' in data:
        val = data['contributionOverride']
        if val in (None, ''):
            changes.append('contribution override cleared')
        else:
            try:
                changes.append(f'contribution override set to KSh {int(float(val)):,}')
            except (TypeError, ValueError):
                changes.append('contribution override updated')
    if any(k in data for k in ('name', 'email', 'phone')):
        changes.append('profile details updated')

    if changes:
        try:
            notif_svc.notify_member(
                chama_id=cid,
                user_id=target_user_id,
                type='info',
                event='memberChanges',
                title='Your member profile was updated',
                body='; '.join(changes).capitalize() + '.',
                link='/member/profile',
            )
        except Exception:
            logger.exception('failed to send member-update notification')

    return jsonify(result), 200


@chama_bp.route('/members/<member_id>', methods=['DELETE'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'member.deactivate')
def delete_member(member_id):
    try:
        member_service.remove_member(_cid(), member_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'message': 'Member deactivated'}), 200


@chama_bp.route('/members/<member_id>/role', methods=['PATCH'])
@jwt_required()
@require_permission('editRoles')
@log_writes(logger, 'member.role_change')
def change_member_role(member_id):
    cid = _cid()
    data = request.get_json() or {}

    # Capture old role for the notification
    before = Member.query.filter_by(id=member_id, chama_id=cid).first()
    old_role = before.role if before else None
    target_user_id = before.user_id if before else None

    try:
        result = member_service.change_role(cid, member_id, data.get('role'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    if target_user_id and data.get('role') and data['role'] != old_role:
        try:
            notif_svc.notify_member(
                chama_id=cid,
                user_id=target_user_id,
                type='info',
                event='memberChanges',
                title='Your role was updated',
                body=f'You are now a {data["role"]}.',
                link='/member/profile',
            )
        except Exception:
            logger.exception('failed to send role-change notification')

    return jsonify(result), 200


@chama_bp.route('/members/<member_id>/contribution-override', methods=['PATCH'])
@jwt_required()
@require_permission('manageContrib')
@log_writes(logger, 'member.contribution_override')
def set_member_override(member_id):
    cid = _cid()
    data = request.get_json() or {}

    try:
        member = contribution_service.set_member_override(
            cid, member_id, data.get('amount'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    # Notify the member about the new contribution
    override = member.contribution_override
    if override is None:
        body = 'Your custom contribution was cleared — you now pay the chama default.'
    else:
        body = f'Your monthly contribution is now KSh {int(round(float(override))):,}.'

    try:
        notif_svc.notify_member(
            chama_id=cid,
            user_id=member.user_id,
            type='info',
            event='memberChanges',
            title='Your contribution amount was updated',
            body=body,
            link='/member/contributions',
        )
    except Exception:
        logger.exception('failed to send contribution-override notification')

    return jsonify({
        'memberId': member.id,
        'contributionOverride': member.contribution_override,
    }), 200


# ============================ INVITES ============================
@chama_bp.route('/invites', methods=['GET'])
@jwt_required()
def list_invites():
    return jsonify(member_service.list_invites(_cid())), 200


@chama_bp.route('/invites', methods=['POST'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'member.invite_create')
def create_invite():
    data = request.get_json() or {}
    contact = (data.get('contact') or '').strip()
    if not contact:
        return jsonify({'message': 'Contact is required'}), 400
    try:
        result = member_service.create_invite(
            _cid(), contact,
            role=data.get('role', 'Member'),
            invited_name=data.get('name'),
            actor_user_id=get_jwt_identity(),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(result), 201


@chama_bp.route('/invites/<invite_id>', methods=['DELETE'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'member.invite_cancel')
def cancel_invite(invite_id):
    try:
        member_service.cancel_invite(_cid(), invite_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'message': 'Invite cancelled'}), 200


# ---- Bulk clear invites --------------------------------------------
@chama_bp.route('/invites', methods=['DELETE'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'member.invites_clear')
def clear_invites():
    """Bulk-delete invites.

    Body options:
      { "ids": ["id1", "id2", ...] }   -> delete these specific invites
      { "all": true }                  -> delete all invites for this chama
      { "all": true, "statuses": [...] } -> delete only those statuses
    """
    cid = _cid()
    data = request.get_json(silent=True) or {}

    q = MemberInvite.query.filter_by(chama_id=cid)

    if data.get('all'):
        statuses = data.get('statuses')
        if statuses:
            q = q.filter(MemberInvite.status.in_(statuses))
    else:
        ids = data.get('ids') or []
        if not ids:
            return jsonify({'message': 'No invite ids provided'}), 400
        q = q.filter(MemberInvite.id.in_(ids))

    invites = q.all()
    if not invites:
        return jsonify({'deleted': 0}), 200

    tokens = [i.token for i in invites if i.token]

    for inv in invites:
        db.session.delete(inv)

    if tokens:
        Invite.query.filter(Invite.token.in_(tokens)).delete(
            synchronize_session=False
        )

    db.session.commit()
    logger.info('invites cleared: chama=%s count=%s', cid, len(tokens))
    return jsonify({'deleted': len(tokens)}), 200
# -------------------------------------------------------------------------


# ============================ CONTRIBUTIONS ============================
@chama_bp.route('/contributions', methods=['GET'])
@jwt_required()
def list_contributions():
    period = request.args.get('period')
    return jsonify(contribution_service.list_for_month(_cid(), period=period)), 200


@chama_bp.route('/contributions', methods=['POST'])
@jwt_required()
@require_permission('recordPayments')
@log_writes(logger, 'contribution.record')
def record_contribution():
    data = request.get_json() or {}
    try:
        row = contribution_service.record_contribution(
            _cid(),
            data.get('member_id'),
            float(data.get('amount', 0)),
            period=data.get('period'),
            reference=data.get('reference'),
            method=data.get('method', 'cash'),
            actor_user_id=get_jwt_identity(),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    # Notify the member that their contribution was recorded
    try:
        member = Member.query.get(data.get('member_id'))
        if member and member.user_id:
            notif_svc.notify_member(
                chama_id=_cid(),
                user_id=member.user_id,
                type='success',
                event='paymentConfirmations',
                title='Contribution recorded',
                body=f'KSh {int(round(float(row.amount))):,} was added to your savings.',
                link='/member/savings',
            )
    except Exception:
        logger.exception('failed to send contribution notification')

    return jsonify({'id': row.id, 'amount': row.amount, 'period': row.period}), 201


@chama_bp.route('/contributions/schedule', methods=['PUT'])
@jwt_required()
@require_permission('manageContrib')
@log_writes(logger, 'contribution.schedule')
def set_contribution_schedule():
    data = request.get_json() or {}
    try:
        chama = contribution_service.set_schedule(
            _cid(),
            amount=data.get('amount'),
            frequency=data.get('frequency'),
            due_day=data.get('due_day'),
            due_weekday=data.get('due_weekday'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    return jsonify({
        'amount': chama.monthly_contribution,
        'frequency': chama.contribution_frequency,
        'due_day': chama.due_day,
        'due_weekday': chama.due_weekday,
    }), 200


@chama_bp.route('/members/<member_id>/contributions', methods=['GET'])
@jwt_required()
def member_contribution_history(member_id):
    return jsonify(contribution_service.history_for_member(_cid(), member_id)), 200


# ============================ SHARED DATA ============================
@chama_bp.route('/shared_data', methods=['GET'])
@jwt_required()
def get_shared_data():
    cid = _cid()
    w = WelfareClaim.query.filter_by(chama_id=cid).order_by(WelfareClaim.submitted_at.desc()).all()
    welfare = [{
        'id': x.id,
        'member': x.member.user.name if x.member and x.member.user else 'Unknown',
        'amount': x.amount, 'reason': x.reason, 'status': x.status,
        'reviewNote': x.note,
        'reviewedAt': x.reviewed_at.isoformat() if x.reviewed_at else None,
    } for x in w]

    m = Meeting.query.filter_by(chama_id=cid).order_by(Meeting.date.desc()).all()
    meetings = [{'id': x.id, 'title': x.title, 'date': x.date, 'time': x.time,
                 'agenda': x.agenda, 'location': x.location, 'locked': x.locked} for x in m]

    p = Proposal.query.filter_by(chama_id=cid).all()
    proposals = []
    for x in p:
        votes = MemberVote.query.filter_by(proposal_id=x.id).all()
        proposals.append({
            'id': x.id, 'title': x.title, 'amount': x.amount, 'closes': x.closes,
            'yes': sum(1 for v in votes if v.choice == 'yes'),
            'no': sum(1 for v in votes if v.choice == 'no'),
            'abs': sum(1 for v in votes if v.choice == 'abs'),
            'votes': {v.member_id: v.choice for v in votes},
        })

    a = Asset.query.filter_by(chama_id=cid).all()
    assets = [{'id': x.id, 'name': x.name, 'type': x.type, 'price': x.price,
               'value': x.value, 'ownership': x.ownership, 'acquired': x.acquired} for x in a]

    po = PayoutOrder.query.filter_by(chama_id=cid).order_by(PayoutOrder.position.asc()).all()
    ph = Payout.query.filter_by(chama_id=cid).order_by(Payout.created_at.desc()).all()

    order = [x.member.user.name for x in po if x.member]
    if not order:
        order = [m.user.name for m in Member.query.filter_by(chama_id=cid).all() if m.user]

    history = [{'member': x.member.user.name, 'date': x.date, 'amount': x.amount,
                'ts': x.created_at.timestamp() * 1000} for x in ph if x.member]

    chama = Chama.query.get(cid)
    payout_data = {
        'order': order,
        'cursor': len(history) % len(order) if order else 0,
        'contributionPerMember': chama.monthly_contribution,
        'history': history,
    }

    return jsonify({
        'welfare': welfare, 'meetings': meetings, 'proposals': proposals,
        'assets': assets, 'payout': payout_data,
    }), 200


# ============================ ASSETS / MEETINGS / PROPOSALS / WELFARE / PAYOUTS ============================

@chama_bp.route('/assets', methods=['POST'])
@jwt_required()
@require_permission('manageInvestments')
@log_writes(logger, 'asset.create')
def add_asset():
    d = request.get_json() or {}
    a = Asset(chama_id=_cid(), name=d['name'], type=d['type'], price=d['price'],
              value=d['price'], ownership=d.get('ownership', 100),
              acquired=d.get('acquired'))
    db.session.add(a)
    db.session.commit()
    return jsonify({'message': 'Asset added'}), 201


@chama_bp.route('/assets/<id>', methods=['PATCH'])
@jwt_required()
@require_permission('manageInvestments')
@log_writes(logger, 'asset.update')
def update_asset(id):
    a = Asset.query.filter_by(id=id, chama_id=_cid()).first()
    if not a:
        return jsonify({'message': 'Not found'}), 404
    d = request.get_json() or {}
    if 'value' in d:
        a.value = float(d['value'])
    db.session.commit()
    return jsonify({'message': 'Asset updated'}), 200


@chama_bp.route('/meetings', methods=['POST'])
@jwt_required()
@require_permission('manageMeetings')
@log_writes(logger, 'meeting.create')
def add_meeting():
    d = request.get_json() or {}
    m = Meeting(chama_id=_cid(), title=d['title'], date=d['date'], time=d['time'],
                agenda=d.get('agenda'), location=d.get('location'), locked=False)
    db.session.add(m)
    db.session.commit()
    return jsonify({'message': 'Meeting scheduled'}), 201


@chama_bp.route('/meetings/<id>/lock', methods=['PATCH'])
@jwt_required()
@require_permission('manageMeetings')
@log_writes(logger, 'meeting.lock')
def lock_meeting(id):
    m = Meeting.query.filter_by(id=id, chama_id=_cid()).first()
    if not m:
        return jsonify({'message': 'Not found'}), 404
    m.locked = True
    db.session.commit()
    return jsonify({'message': 'Minutes locked'}), 200


@chama_bp.route('/proposals', methods=['POST'])
@jwt_required()
@require_permission('manageMeetings')
@log_writes(logger, 'proposal.create')
def add_proposal():
    d = request.get_json() or {}
    p = Proposal(chama_id=_cid(), title=d['title'], amount=d.get('amount'), closes=d['closes'])
    db.session.add(p)
    db.session.commit()
    return jsonify({'message': 'Proposal created'}), 201


# ---- Cast vote on a proposal -------------------------------------------
@chama_bp.route('/proposals/<proposal_id>/vote', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'proposal.vote')
def vote_on_proposal(proposal_id):
    uid = get_jwt_identity()
    cid = _cid()
    data = request.get_json() or {}
    choice = data.get('choice')

    if choice not in ('yes', 'no', 'abs'):
        return jsonify({'message': 'choice must be yes, no or abs'}), 400

    proposal = Proposal.query.filter_by(id=proposal_id, chama_id=cid).first()
    if not proposal:
        return jsonify({'message': 'Proposal not found'}), 404

    member = Member.query.filter_by(user_id=uid, chama_id=cid).first()
    if not member:
        return jsonify({'message': 'You are not a member of this chama'}), 403

    existing = MemberVote.query.filter_by(
        proposal_id=proposal_id, member_id=member.id
    ).first()
    if existing:
        return jsonify({'message': 'You have already voted on this proposal'}), 400

    db.session.add(MemberVote(
        proposal_id=proposal_id,
        member_id=member.id,
        choice=choice,
    ))
    db.session.commit()

    logger.info('vote cast: proposal=%s member=%s choice=%s',
                proposal_id, member.id, choice)
    return jsonify({'message': 'Vote recorded', 'choice': choice}), 201
# -------------------------------------------------------------------------


@chama_bp.route('/welfare/claim', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'welfare.claim_create')
def add_welfare_claim():
    uid = get_jwt_identity()
    d = request.get_json() or {}
    member = Member.query.filter_by(user_id=uid, chama_id=_cid()).first()
    if not member:
        return jsonify({'message': 'Member not found'}), 404
    w = WelfareClaim(chama_id=_cid(), member_id=member.id, amount=d['amount'],
                     reason=d['reason'], status='pending')
    db.session.add(w)
    db.session.commit()

    # Notify all admins of the new claim
    try:
        notif_svc.notify_chama_admins(
            chama_id=_cid(),
            type='warning',
            event='welfareClaims',
            title='New welfare claim',
            body=f'{member.user.name if member.user else "A member"} requested KSh {int(round(float(w.amount))):,} for {w.reason}.',
            link='/dashboard/welfare',
        )
    except Exception:
        logger.exception('failed to send welfare-claim notification')

    return jsonify({'message': 'Claim submitted'}), 201


@chama_bp.route('/welfare/<id>/review', methods=['PATCH'])
@jwt_required()
@require_permission('manageMembers')
@log_writes(logger, 'welfare.claim_review')
def review_welfare(id):
    cid = _cid()
    w = WelfareClaim.query.filter_by(id=id, chama_id=cid).first()
    if not w:
        return jsonify({'message': 'Not found'}), 404

    d = request.get_json() or {}
    new_status = d.get('status')
    w.status = new_status
    w.note = d.get('note', '')
    w.reviewed_at = datetime.utcnow()

    member = Member.query.get(w.member_id)
    db.session.commit()

    # Notify the member of the review outcome
    if member and member.user_id:
        meta = {
            'paid':     ('success', 'Welfare claim approved',
                         f'Your claim for KSh {int(round(float(w.amount))):,} was approved and paid.'),
            'rejected': ('warning', 'Welfare claim rejected',
                         f'Your claim for KSh {int(round(float(w.amount))):,} was not approved.'),
            'pending':  ('info', 'Welfare claim under review',
                         'Your claim is back under review.'),
        }.get(new_status)

        if meta:
            try:
                body = meta[2] + (f' Note: {w.note}' if w.note else '')
                notif_svc.notify_member(
                    chama_id=cid,
                    user_id=member.user_id,
                    type=meta[0],
                    event='welfareUpdates',
                    title=meta[1],
                    body=body,
                    link='/member/welfare',
                )
            except Exception:
                logger.exception('failed to send welfare-review notification')

    return jsonify({'message': 'Claim reviewed'}), 200


@chama_bp.route('/payouts', methods=['POST'])
@jwt_required()
@require_permission('manageContrib')
@log_writes(logger, 'payout.create')
def record_payout():
    d = request.get_json() or {}
    member = Member.query.filter_by(chama_id=_cid(), user_id=d['member_id']).first()
    if not member:
        return jsonify({'message': 'Member not found'}), 404
    p = Payout(chama_id=_cid(), member_id=member.id, amount=d['amount'], date=d['date'])
    db.session.add(p)
    db.session.commit()

    # Notify the receiving member
    try:
        notif_svc.notify_member(
            chama_id=_cid(),
            user_id=member.user_id,
            type='success',
            event='payments',
            title='Payout received',
            body=f'KSh {int(round(float(p.amount))):,} was paid out to you ({p.date}).',
            link='/member/rotation',
        )
    except Exception:
        logger.exception('failed to send payout notification')

    return jsonify({'message': 'Payout recorded'}), 201


# ============================ BILLING ============================
@chama_bp.route('/billing/upgrade', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chama.billing_upgrade')
def upgrade_subscription():
    if _role() != 'Chairman':
        return jsonify({'message': 'Only the Chairman can upgrade the plan'}), 403
        
    data = request.get_json() or {}
    tier = data.get('tier')
    phone = data.get('phone')
    
    if not tier or not phone:
        return jsonify({'message': 'Tier and phone number are required'}), 400
        
    # Fetch dynamic prices from DB
    settings = PlatformSettings.query.first()
    tier_prices = settings.prices if settings and settings.prices else {'Starter': 500, 'Growth': 1000, 'Business': 2000, 'Gold': 3000}
    
    amount = tier_prices.get(tier)
    
    if not amount:
        return jsonify({'message': 'Invalid tier selected'}), 400

    chama = Chama.query.get(_cid())
    if not chama:
        return jsonify({'message': 'Chama not found'}), 404

    # Trigger IntaSend STK Push
    result = send_stk_push(
        phone_number=phone,
        amount=amount,
        api_ref=f"CHAMETU-SUB-{chama.id[:8]}",
        name=chama.name
    )

    if result['status'] == 'success':
        return jsonify({"message": f"STK Push sent to {phone}. Please enter your M-Pesa PIN."}), 200
    else:
        return jsonify({"message": result.get('message', 'Payment initiation failed')}), 400
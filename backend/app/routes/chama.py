# app/routes/chama.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.chama import Chama, Member
from app.models.user import User
from app.models.finance import (
    WelfareClaim, Meeting, Proposal, MemberVote, Asset, Payout, PayoutOrder,
)
from app.models.invite import Invite
from app.services import member_service, contribution_service
from datetime import datetime
import secrets

chama_bp = Blueprint('chama', __name__)


def _cid():
    return get_jwt().get('chama_id')


def _role():
    return get_jwt().get('role')


def is_admin(role):
    return role in ['Chairman', 'Treasurer', 'Secretary']


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
        'due_day': chama.due_day, 'late_fee': chama.late_fee,
    }), 200


@chama_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    if _role() not in ['Chairman', 'Treasurer']:
        return jsonify({'message': 'Unauthorized'}), 403
    chama = Chama.query.get(_cid())
    data = request.get_json() or {}
    if 'monthly_contribution' in data:
        chama.monthly_contribution = float(data['monthly_contribution'])
    if 'due_day' in data:
        chama.due_day = int(data['due_day'])
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
def update_member(member_id):
    if _role() not in ['Chairman', 'Treasurer']:
        return jsonify({'message': 'Unauthorized'}), 403
    try:
        result = member_service.update_member(_cid(), member_id, request.get_json() or {})
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(result), 200


@chama_bp.route('/members/<member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    if _role() != 'Chairman':
        return jsonify({'message': 'Only Chairman can remove members'}), 403
    try:
        member_service.remove_member(_cid(), member_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'message': 'Member deactivated'}), 200


@chama_bp.route('/members/<member_id>/role', methods=['PATCH'])
@jwt_required()
def change_member_role(member_id):
    if _role() != 'Chairman':
        return jsonify({'message': 'Only Chairman can change roles'}), 403
    data = request.get_json() or {}
    try:
        result = member_service.change_role(_cid(), member_id, data.get('role'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(result), 200


# ============================ INVITES ============================
@chama_bp.route('/invites', methods=['GET'])
@jwt_required()
def list_invites():
    return jsonify(member_service.list_invites(_cid())), 200


@chama_bp.route('/invites', methods=['POST'])
@jwt_required()
def create_invite():
    if _role() not in ['Chairman', 'Treasurer', 'Secretary']:
        return jsonify({'message': 'Unauthorized'}), 403
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
def cancel_invite(invite_id):
    if _role() not in ['Chairman', 'Treasurer', 'Secretary']:
        return jsonify({'message': 'Unauthorized'}), 403
    try:
        member_service.cancel_invite(_cid(), invite_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'message': 'Invite cancelled'}), 200


# ============================ CONTRIBUTIONS ============================
@chama_bp.route('/contributions', methods=['GET'])
@jwt_required()
def list_contributions():
    period = request.args.get('period')
    return jsonify(contribution_service.list_for_month(_cid(), period=period)), 200


@chama_bp.route('/contributions', methods=['POST'])
@jwt_required()
def record_contribution():
    if _role() not in ['Chairman', 'Treasurer']:
        return jsonify({'message': 'Unauthorized'}), 403
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
    return jsonify({'id': row.id, 'amount': row.amount, 'period': row.period}), 201


@chama_bp.route('/members/<member_id>/contributions', methods=['GET'])
@jwt_required()
def member_contribution_history(member_id):
    return jsonify(contribution_service.history_for_member(_cid(), member_id)), 200


# ============================ SHARED DATA (unchanged) ============================
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


# ============================ ASSETS ============================
@chama_bp.route('/assets', methods=['POST'])
@jwt_required()
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
def update_asset(id):
    a = Asset.query.filter_by(id=id, chama_id=_cid()).first()
    if not a:
        return jsonify({'message': 'Not found'}), 404
    d = request.get_json() or {}
    if 'value' in d:
        a.value = float(d['value'])
    db.session.commit()
    return jsonify({'message': 'Asset updated'}), 200


# ============================ MEETINGS ============================
@chama_bp.route('/meetings', methods=['POST'])
@jwt_required()
def add_meeting():
    d = request.get_json() or {}
    m = Meeting(chama_id=_cid(), title=d['title'], date=d['date'], time=d['time'],
                agenda=d.get('agenda'), location=d.get('location'), locked=False)
    db.session.add(m)
    db.session.commit()
    return jsonify({'message': 'Meeting scheduled'}), 201


@chama_bp.route('/meetings/<id>/lock', methods=['PATCH'])
@jwt_required()
def lock_meeting(id):
    m = Meeting.query.filter_by(id=id, chama_id=_cid()).first()
    if not m:
        return jsonify({'message': 'Not found'}), 404
    m.locked = True
    db.session.commit()
    return jsonify({'message': 'Minutes locked'}), 200


# ============================ PROPOSALS ============================
@chama_bp.route('/proposals', methods=['POST'])
@jwt_required()
def add_proposal():
    d = request.get_json() or {}
    p = Proposal(chama_id=_cid(), title=d['title'], amount=d.get('amount'), closes=d['closes'])
    db.session.add(p)
    db.session.commit()
    return jsonify({'message': 'Proposal created'}), 201


# ============================ WELFARE ============================
@chama_bp.route('/welfare/claim', methods=['POST'])
@jwt_required()
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
    return jsonify({'message': 'Claim submitted'}), 201


@chama_bp.route('/welfare/<id>/review', methods=['PATCH'])
@jwt_required()
def review_welfare(id):
    w = WelfareClaim.query.filter_by(id=id, chama_id=_cid()).first()
    if not w:
        return jsonify({'message': 'Not found'}), 404
    d = request.get_json() or {}
    w.status = d['status']
    w.note = d.get('note', '')
    w.reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Claim reviewed'}), 200


# ============================ PAYOUTS ============================
@chama_bp.route('/payouts', methods=['POST'])
@jwt_required()
def record_payout():
    d = request.get_json() or {}
    member = Member.query.filter_by(chama_id=_cid(), user_id=d['member_id']).first()
    if not member:
        return jsonify({'message': 'Member not found'}), 404
    p = Payout(chama_id=_cid(), member_id=member.id, amount=d['amount'], date=d['date'])
    db.session.add(p)
    db.session.commit()
    return jsonify({'message': 'Payout recorded'}), 201
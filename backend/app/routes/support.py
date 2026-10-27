# app/routes/support.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.services import support_service as svc
from app.logging_utils import log_writes
from app.utils.decorators import require_permission

support_bp = Blueprint('support', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


def _uid():
    return get_jwt_identity()


def _is_agent():
    """Agents are Chairman / Treasurer / Secretary."""
    return get_jwt().get('role') in ('Chairman', 'Treasurer', 'Secretary')


# ============================================================
# ADMIN VIEWS — chama-scoped, all tickets
# ============================================================

@support_bp.route('/', methods=['GET'])
@jwt_required()
@require_permission('raiseIssue')
def list_all_tickets():
    """Every ticket in the chama (admin view). Includes internal notes."""
    return jsonify(svc.list_chama_tickets(_cid(), include_internal=_is_agent())), 200


@support_bp.route('/', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'support.ticket_create')
def create_ticket():
    data = request.get_json() or {}
    try:
        ticket = svc.create_ticket(
            chama_id=_cid(),
            user_id=_uid(),
            subject=(data.get('subject') or '').strip(),
            description=(data.get('description') or '').strip(),
            category=data.get('category', 'technical'),
            priority=data.get('priority', 'normal'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(ticket), 201


@support_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
@require_permission('raiseIssue')
def get_ticket(ticket_id):
    ticket = svc.get_ticket(_cid(), ticket_id, include_internal=_is_agent())
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
    return jsonify(ticket), 200


@support_bp.route('/<ticket_id>/status', methods=['PATCH'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'support.status_change')
def update_status(ticket_id):
    data = request.get_json() or {}
    try:
        ticket = svc.update_status(
            _cid(), ticket_id,
            new_status=data.get('status'),
            actor_user_id=_uid(),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(ticket), 200


@support_bp.route('/<ticket_id>/messages', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'support.message_add')
def add_message(ticket_id):
    data = request.get_json() or {}
    is_agent = _is_agent()
    try:
        msg = svc.add_message(
            chama_id=_cid(),
            ticket_id=ticket_id,
            user_id=_uid(),
            body=data.get('body') or '',
            internal=bool(data.get('internal')) if is_agent else False,
            as_agent=is_agent and data.get('role') == 'agent',
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(msg), 201


# ============================================================
# MEMBER VIEWS — only my tickets
# ============================================================

@support_bp.route('/me', methods=['GET'])
@jwt_required()
@require_permission('raiseIssue')
def list_my_tickets():
    """Only the current user's tickets. No internal notes."""
    return jsonify(svc.list_my_tickets(_cid(), _uid())), 200


@support_bp.route('/me', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'support.my_ticket_create')
def create_my_ticket():
    data = request.get_json() or {}
    try:
        ticket = svc.create_ticket(
            chama_id=_cid(),
            user_id=_uid(),
            subject=(data.get('subject') or '').strip(),
            description=(data.get('description') or '').strip(),
            category=data.get('category', 'technical'),
            priority=data.get('priority', 'normal'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(ticket), 201


@support_bp.route('/me/<ticket_id>/messages', methods=['POST'])
@jwt_required()
@require_permission('raiseIssue')
@log_writes(logger, 'support.my_message_add')
def add_my_message(ticket_id):
    data = request.get_json() or {}
    try:
        msg = svc.add_message(
            chama_id=_cid(),
            ticket_id=ticket_id,
            user_id=_uid(),
            body=data.get('body') or '',
            internal=False,
            as_agent=False,
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(msg), 201
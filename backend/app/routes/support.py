# app/routes/support.py
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.models.support import Ticket, TicketMessage
from app.models.chama import Chama
from app.services import notification_service as notif_svc
from app.services import support_service
from app.logging_utils import log_writes

support_bp = Blueprint('support', __name__)
logger = logging.getLogger(__name__)

def _cid():
    return get_jwt().get('chama_id')

def _uid():
    return get_jwt_identity()

def _is_admin():
    return get_jwt().get('role') in ('Chairman', 'Treasurer', 'Secretary')

# ----------------- ADMIN/TREASURER ENDPOINTS (unrestricted) -----------------
@support_bp.route('/', methods=['GET'])
@jwt_required()
def list_all_tickets():
    """Admin sees every ticket from the chama."""
    tickets = support_service.list_chama_tickets(_cid())
    return jsonify(tickets), 200


@support_bp.route('/', methods=['POST'])
@jwt_required()
@log_writes(logger, 'support.create')
def create_ticket():
    data = request.get_json() or {}
    try:
        ticket = support_service.create_ticket(
            chama_id=_cid(),
            user_id=_uid(),
            subject=data.get('subject'),
            description=data.get('description'),
            category=data.get('category', 'other'),
            priority=data.get('priority', 'normal'),
            requester_name=data.get('requesterName'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    # ---------- NOTIFICATION LOGIC ----------
    try:
        # Detect the special "I've Paid" contribution notification
        is_contribution_notice = 'Contribution Payment from' in (ticket.subject or '')
        
        title = 'Payment Confirmation' if is_contribution_notice else 'New support ticket'
        body = (
            f"{ticket.requester_name or 'A member'} has submitted a payment confirmation and needs review."
            if is_contribution_notice
            else f"{ticket.requester_name or 'A member'} raised a ticket: {ticket.subject}"
        )
        notif_type = 'success' if is_contribution_notice else 'warning'
        event = 'payments' if is_contribution_notice else 'system'
        
        # Notify every admin (Chairman, Treasurer, Secretary)
        notif_svc.notify_chama_admins(
            chama_id=_cid(),
            type=notif_type,
            event=event,
            title=title,
            body=body,
            link='/dashboard/support',
        )
        
        # If this is a real support ticket (not a payment), also notify the member
        # that their ticket was received.
        if not is_contribution_notice:
            notif_svc.notify_member(
                chama_id=_cid(),
                user_id=_uid(),
                type='info',
                event='system',
                title='Ticket received',
                body='Your support ticket is now in the chama admin queue. We will reply within 24 hours.',
                link='/member/support',
            )
    except Exception:
        logger.exception('Failed to notify admins about new ticket')

    return jsonify(support_service.serialize_ticket(ticket, full=True)), 201


@support_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    try:
        ticket = support_service.get_ticket(_cid(), ticket_id)
        return jsonify(support_service.serialize_ticket(ticket, full=True)), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 404


@support_bp.route('/<ticket_id>/messages', methods=['POST'])
@jwt_required()
@log_writes(logger, 'support.reply')
def add_reply(ticket_id):
    if not _is_admin():
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json() or {}
    try:
        ticket = support_service.add_message(
            chama_id=_cid(),
            ticket_id=ticket_id,
            user_id=_uid(),
            body=data.get('body'),
            role=data.get('role', 'agent'),
            internal=data.get('internal', False),
        )
        return jsonify(support_service.serialize_ticket(ticket, full=True)), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400


@support_bp.route('/<ticket_id>/status', methods=['PATCH'])
@jwt_required()
@log_writes(logger, 'support.status_change')
def update_status(ticket_id):
    if not _is_admin():
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json() or {}
    try:
        ticket = support_service.set_status(_cid(), ticket_id, data.get('status'))
        return jsonify(support_service.serialize_ticket(ticket, full=True)), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400


# ----------------- MEMBER ENDPOINTS -----------------
@support_bp.route('/me', methods=['GET'])
@jwt_required()
def list_my_tickets():
    tickets = support_service.list_user_tickets(_cid(), _uid())
    return jsonify(tickets), 200


@support_bp.route('/me', methods=['POST'])
@jwt_required()
@log_writes(logger, 'support.member_create')
def create_my_ticket():
    data = request.get_json() or {}
    try:
        ticket = support_service.create_ticket(
            chama_id=_cid(),
            user_id=_uid(),
            subject=data.get('subject'),
            description=data.get('description'),
            category=data.get('category', 'other'),
            priority=data.get('priority', 'normal'),
        )
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    # ---------- NOTIFICATION LOGIC ----------
    try:
        # Same detection: the member portal uses the same "I've Paid" pattern
        is_contribution_notice = 'Contribution Payment from' in (ticket.subject or '')
        
        title = 'Payment Confirmation' if is_contribution_notice else 'New support ticket'
        body = (
            f"{ticket.requester_name or 'A member'} has submitted a payment confirmation and needs review."
            if is_contribution_notice
            else f"{ticket.requester_name or 'A member'} raised a ticket: {ticket.subject}"
        )
        notif_type = 'success' if is_contribution_notice else 'warning'
        event = 'payments' if is_contribution_notice else 'system'
        
        notif_svc.notify_chama_admins(
            chama_id=_cid(),
            type=notif_type,
            event=event,
            title=title,
            body=body,
            link='/dashboard/support',
        )
    except Exception:
        logger.exception('Failed to notify admins about member ticket')

    return jsonify(support_service.serialize_ticket(ticket, full=True)), 201


@support_bp.route('/me/<ticket_id>/messages', methods=['POST'])
@jwt_required()
@log_writes(logger, 'support.member_reply')
def add_my_reply(ticket_id):
    data = request.get_json() or {}
    try:
        ticket = support_service.add_message(
            chama_id=_cid(),
            ticket_id=ticket_id,
            user_id=_uid(),
            body=data.get('body'),
            role='user',
            internal=False,
        )
        return jsonify(support_service.serialize_ticket(ticket, full=True)), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
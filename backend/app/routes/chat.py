# app/routes/chat.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.services import chat_service as svc
from app.services import chat_kb as kb
from app.logging_utils import log_writes

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


def _uid():
    return get_jwt_identity()


def _is_admin():
    return get_jwt().get('role') in ('Chairman', 'Treasurer', 'Secretary')


@chat_bp.route('/session', methods=['GET'])
@jwt_required()
def get_or_create_session():
    """Returns the current open chat session for this user, creating one if needed."""
    session = svc.get_open_session(_cid(), _uid())
    if not session:
        return jsonify({'message': 'Chat requires login'}), 401

    from app.services.chat_service import _serialize_session
    data = _serialize_session(session)
    data['suggestions'] = kb.SUGGESTIONS
    return jsonify(data), 200


@chat_bp.route('/session', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chat.new_session')
def start_new_session():
    """Force-start a new session (used by 'Clear chat')."""
    session = svc.start_session(_cid(), _uid())
    from app.services.chat_service import _serialize_session
    data = _serialize_session(session)
    data['suggestions'] = kb.SUGGESTIONS
    return jsonify(data), 201


@chat_bp.route('/session/<session_id>/message', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chat.message')
def send_message(session_id):
    data = request.get_json() or {}
    try:
        result = svc.send_message(_cid(), session_id, _uid(), data.get('text'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(result), 201


@chat_bp.route('/message/<message_id>/feedback', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chat.feedback')
def set_feedback(message_id):
    data = request.get_json() or {}
    try:
        msg = svc.set_feedback(_cid(), message_id, _uid(), data.get('feedback'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(msg), 200


@chat_bp.route('/session/<session_id>/end', methods=['POST'])
@jwt_required()
@log_writes(logger, 'chat.end')
def end_session(session_id):
    try:
        session = svc.end_session(_cid(), session_id, _uid())
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(session), 200


# ---------- Admin endpoints ----------

@chat_bp.route('/admin/sessions', methods=['GET'])
@jwt_required()
def admin_list_sessions():
    if not _is_admin():
        return jsonify({'message': 'Unauthorized'}), 403
    return jsonify(svc.list_chama_sessions(_cid())), 200


@chat_bp.route('/admin/session/<session_id>/end', methods=['POST'])
@jwt_required()
def admin_end_session(session_id):
    if not _is_admin():
        return jsonify({'message': 'Unauthorized'}), 403
    try:
        session = svc.end_session_as_admin(_cid(), session_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(session), 200
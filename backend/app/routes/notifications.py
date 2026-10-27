# app/routes/notifications.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.services import notification_service as svc
from app.logging_utils import log_writes

notif_bp = Blueprint('notifications', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


def _uid():
    return get_jwt_identity()


@notif_bp.route('/', methods=['GET'])
@jwt_required()
def list_notifications():
    return jsonify(svc.list_for_user(_cid(), _uid())), 200


@notif_bp.route('/<notif_id>/read', methods=['POST'])
@jwt_required()
@log_writes(logger, 'notification.read')
def mark_read(notif_id):
    try:
        svc.mark_read(_cid(), notif_id, _uid())
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'ok': True}), 200


@notif_bp.route('/read-all', methods=['POST'])
@jwt_required()
@log_writes(logger, 'notification.read_all')
def mark_all_read():
    svc.mark_all_read(_cid(), _uid())
    return jsonify({'ok': True}), 200


@notif_bp.route('/<notif_id>', methods=['DELETE'])
@jwt_required()
@log_writes(logger, 'notification.dismiss')
def dismiss(notif_id):
    try:
        svc.dismiss(_cid(), notif_id, _uid())
    except ValueError as e:
        return jsonify({'message': str(e)}), 404
    return jsonify({'ok': True}), 200


@notif_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
@log_writes(logger, 'notification.clear_all')
def clear_all():
    svc.clear_all(_cid(), _uid())
    return jsonify({'ok': True}), 200


@notif_bp.route('/prefs', methods=['GET'])
@jwt_required()
def get_prefs():
    return jsonify(svc.get_prefs(_uid())), 200


@notif_bp.route('/prefs', methods=['PUT'])
@jwt_required()
@log_writes(logger, 'notification.prefs_save')
def save_prefs():
    data = request.get_json() or {}
    try:
        prefs = svc.save_prefs(_uid(), data)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    return jsonify(prefs), 200
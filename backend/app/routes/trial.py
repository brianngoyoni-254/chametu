# app/routes/trial.py
"""Trial endpoints.

GET  /api/billing/trial/status            -> current trial state (authed)
POST /api/billing/signup/start-trial      -> create chama + start 7-day trial (public)
"""
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app.services import trial_service, billing_service
from app.logging_utils import log_writes

trial_bp = Blueprint('trial', __name__)
logger = logging.getLogger(__name__)


def _cid():
    return get_jwt().get('chama_id')


@trial_bp.route('/status', methods=['GET'])
@jwt_required()
def trial_status():
    """Return the current trial state for the logged-in chama."""
    chama_id = _cid()
    if not chama_id:
        return jsonify({'message': 'No chama in session'}), 400

    status = trial_service.get_status(chama_id)
    return jsonify({'trial': status}), 200


@trial_bp.route('/signup/start-trial', methods=['POST'])
@log_writes(logger, 'trial.signup_start')
def signup_start_trial():
    """
    Public endpoint. Creates the chairman account + chama, starts a 7-day
    free trial, and returns a logged-in session — no payment today.

    Body: {name, email, password, phone, chama_name, tier, trial_days}
    """
    data = request.get_json(silent=True) or {}
    try:
        result = billing_service.start_trial_signup(
            name=data.get('name'),
            email=data.get('email'),
            password=data.get('password'),
            phone_raw=data.get('phone'),
            chama_name=data.get('chama_name'),
            tier_name=data.get('tier'),
        )
    except ValueError as e:
        logger.warning(
            'trial signup rejected (email=%s tier=%s): %s',
            (data.get('email') or '').lower().strip(),
            data.get('tier'), e,
        )
        return jsonify({'message': str(e)}), 400

    return jsonify({
        'message': 'Your 7-day free trial has started.',
        'session': result['session'],
        'trial': result['trial'],
        'chama': result['chama'],
    }), 201
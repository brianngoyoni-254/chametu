# app/routes/rewards.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app.services import rewards_service as svc
from app.logging_utils import log_writes

rewards_bp = Blueprint('rewards', __name__)
logger = logging.getLogger(__name__)

ADMIN_ROLES = ['Chairman', 'Treasurer']


def _cid():
    return get_jwt().get('chama_id')


@rewards_bp.route('/public/catalog', methods=['GET'])
def public_catalog():
    return jsonify(svc.list_rewards()), 200


@rewards_bp.route('/public/tiers', methods=['GET'])
def public_tiers():
    return jsonify(svc.list_tiers()), 200


@rewards_bp.route('/catalog', methods=['GET'])
@jwt_required()
def catalog():
    return jsonify(svc.list_rewards()), 200


@rewards_bp.route('/tiers', methods=['GET'])
@jwt_required()
def tiers():
    return jsonify(svc.list_tiers()), 200


@rewards_bp.route('/state', methods=['GET'])
@jwt_required()
def state():
    return jsonify(svc.get_points_state(_cid())), 200


@rewards_bp.route('/redeem', methods=['POST'])
@jwt_required()
@log_writes(logger, 'rewards.redeem')
def redeem():
    data = request.get_json() or {}
    reward_id = data.get('rewardId')
    if not reward_id:
        return jsonify({'message': 'rewardId is required'}), 400

    result = svc.redeem_reward(_cid(), reward_id)
    if not result['ok']:
        logger.warning('redeem failed: reward=%s reason=%s', reward_id, result['reason'])
        return jsonify({'message': result['reason']}), 400

    logger.info('redeem ok: reward=%s code=%s balance_after=%s',
                reward_id, result['code'], result['balance'])
    return jsonify(result), 200


@rewards_bp.route('/tier/base', methods=['PUT'])
@jwt_required()
@log_writes(logger, 'tier.set_base')
def set_base_tier():
    if get_jwt().get('role') not in ADMIN_ROLES:
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json() or {}
    try:
        sub = svc.set_base_tier(_cid(), data.get('tier'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    logger.info('tier set to %s', sub.base_tier)
    return jsonify({
        'baseTier': sub.base_tier,
        'trialExpiresAt': sub.trial_expires_at.isoformat() if sub.trial_expires_at else None,
    }), 200


@rewards_bp.route('/tier/trial', methods=['POST'])
@jwt_required()
@log_writes(logger, 'tier.start_trial')
def start_trial():
    if get_jwt().get('role') not in ADMIN_ROLES:
        return jsonify({'message': 'Unauthorized'}), 403
    sub = svc.start_trial(_cid())
    logger.info('trial started, expires %s', sub.trial_expires_at)
    return jsonify({
        'trialExpiresAt': sub.trial_expires_at.isoformat() if sub.trial_expires_at else None,
    }), 200


@rewards_bp.route('/tier/upgrade', methods=['POST'])
@jwt_required()
@log_writes(logger, 'tier.upgrade')
def upgrade():
    if get_jwt().get('role') not in ADMIN_ROLES:
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json() or {}
    try:
        sub = svc.upgrade_tier(_cid(), data.get('tier'))
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    logger.info('tier upgraded to %s', sub.base_tier)
    return jsonify({'baseTier': sub.base_tier, 'trialExpiresAt': None}), 200


@rewards_bp.route('/seed', methods=['POST'])
def seed():
    svc.seed_tiers_if_empty()
    svc.seed_rewards_if_empty()
    logger.info('rewards seeded (manual trigger)')
    return jsonify({'message': 'Seeded'}), 200
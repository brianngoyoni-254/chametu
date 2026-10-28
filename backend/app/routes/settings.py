# app/routes/settings.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app import db
from app.models.chama import Chama, ChamaSettings
from app.models.settings import PlatformSettings

settings_bp = Blueprint('settings', __name__)
logger = logging.getLogger(__name__)


@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    cid = get_jwt().get('chama_id')
    chama = Chama.query.get(cid)
    settings = ChamaSettings.query.filter_by(chama_id=cid).first()

    if not settings:
        settings = ChamaSettings(chama_id=cid)
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        'chama': {
            'name': chama.name,
            'code': chama.code,
            'location': chama.type,
            'monthly_contribution': chama.monthly_contribution,
        },
        'settings': {
            'platformName': settings.platform_name,
            'supportEmail': settings.support_email,
            'timezone': settings.timezone,
            'gracePeriod': settings.grace_period,
            'autoBlockDays': settings.auto_block_days,
            'paybill': settings.paybill,
            'accountRef': settings.account_ref,
            'monthlyProfitTarget': float(settings.monthly_profit_target or 0),
            'profitTargetBasis': settings.profit_target_basis or 'savings',
            'profitTargetPeriod': settings.profit_target_period or 'month',
        },
    }), 200


@settings_bp.route('/', methods=['PUT'])
@jwt_required()
def update_settings():
    cid = get_jwt().get('chama_id')
    if get_jwt().get('role') not in ['Chairman', 'Treasurer']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json() or {}
    chama = Chama.query.get(cid)
    settings = ChamaSettings.query.filter_by(chama_id=cid).first()
    if not settings:
        settings = ChamaSettings(chama_id=cid)

    if 'name' in data and data['name']:
        chama.name = data['name']
    if 'location' in data:
        chama.type = data['location']
    if 'monthlyContribution' in data:
        try:
            chama.monthly_contribution = float(data['monthlyContribution'])
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid monthly contribution'}), 400

    if 'platformName' in data:
        settings.platform_name = data['platformName']
    if 'supportEmail' in data:
        settings.support_email = data['supportEmail']
    if 'timezone' in data:
        settings.timezone = data['timezone']
    if 'gracePeriod' in data:
        settings.grace_period = int(data['gracePeriod'])
    if 'autoBlockDays' in data:
        settings.auto_block_days = int(data['autoBlockDays'])
    if 'paybill' in data:
        settings.paybill = data['paybill']
    if 'accountRef' in data:
        settings.account_ref = data['accountRef']

    # ---------- target profit ----------
    if 'monthlyProfitTarget' in data:
        try:
            value = float(data['monthlyProfitTarget'] or 0)
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid monthly profit target'}), 400
        if value < 0:
            return jsonify({'message': 'Profit target cannot be negative'}), 400
        settings.monthly_profit_target = value

    if 'profitTargetBasis' in data:
        if data['profitTargetBasis'] not in ('savings', 'contributions'):
            return jsonify({'message': 'Invalid profit target basis'}), 400
        settings.profit_target_basis = data['profitTargetBasis']

    if 'profitTargetPeriod' in data:
        if data['profitTargetPeriod'] not in ('month', 'quarter', 'year'):
            return jsonify({'message': 'Invalid profit target period'}), 400
        settings.profit_target_period = data['profitTargetPeriod']

    db.session.add(settings)
    db.session.commit()

    logger.info('chama settings updated for %s', chama.code)
    return jsonify({'message': 'Settings updated'}), 200


@settings_bp.route('/public-prices', methods=['GET'])
def get_public_prices():
    """Public endpoint for the frontend to fetch dynamic tier prices."""
    settings = PlatformSettings.query.first()
    if not settings or not settings.prices:
        return jsonify({'Starter': 500, 'Growth': 1000, 'Business': 2000, 'Gold': 3000}), 200
    return jsonify(settings.prices), 200
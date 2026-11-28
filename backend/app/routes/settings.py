# app/routes/settings.py
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func

from app import db
from app.models.chama import Chama, ChamaSettings, Member
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
            'due_day': chama.due_day,
            'contribution_frequency': chama.contribution_frequency,
            'max_loan_multiple': chama.max_loan_multiple,
            'interest_rate': chama.interest_rate,
            'interest_type': chama.interest_type,
            'loan_grace_period': chama.loan_grace_period,
            'repayment_frequency': chama.repayment_frequency,
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
            'contribution_method': settings.contribution_method or 'paybill',
            'contribution_number': settings.contribution_number or '',
            'contribution_account_ref': settings.contribution_account_ref or '',
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

    if 'amount' in data or 'monthlyContribution' in data:
        try:
            val = data.get('amount') or data.get('monthlyContribution')
            chama.monthly_contribution = float(val)
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid monthly contribution'}), 400
    if 'dueDay' in data or 'due_day' in data:
        chama.due_day = int(data.get('dueDay') or data.get('due_day') or 30)

    if 'maxMultiple' in data:
        chama.max_loan_multiple = float(data['maxMultiple'])
    if 'interest' in data:
        chama.interest_rate = float(data['interest'])
    if 'interestType' in data:
        chama.interest_type = data['interestType']
    if 'grace' in data:
        chama.loan_grace_period = int(data['grace'])
    if 'repayment' in data:
        chama.repayment_frequency = data['repayment']

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

    if 'contribution_method' in data:
        if data['contribution_method'] not in ('send_money', 'paybill', 'till'):
            return jsonify({'message': 'Invalid contribution method'}), 400
        settings.contribution_method = data['contribution_method']
    if 'contribution_number' in data:
        settings.contribution_number = (data['contribution_number'] or '').strip()
    if 'contribution_account_ref' in data:
        settings.contribution_account_ref = (data['contribution_account_ref'] or '').strip()

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


@settings_bp.route('/public-stats', methods=['GET'])
def get_public_stats():
    """Public endpoint for the landing page to fetch real stats."""
    try:
        settings = PlatformSettings.query.first()
        overrides = settings.public_stats if settings else None

        # If Superadmin has set manual overrides, use those
        if overrides and overrides.get('chamas') is not None:
            return jsonify({
                'chamas': overrides.get('chamas', 0),
                'members': overrides.get('members', 0),
                'managed': overrides.get('managed', 'KSh 0'),
                'uptime': overrides.get('uptime', '99.98%')
            }), 200

        # Fallback: Automatically calculate from the database
        chamas_count = Chama.query.count()
        members_count = Member.query.filter_by(status='active').count()
        total_savings = db.session.query(func.sum(Member.savings)).scalar() or 0.0
        
        if total_savings >= 1_000_000_000:
            managed_str = f"KSh {total_savings / 1_000_000_000:.1f}B"
        elif total_savings >= 1_000_000:
            managed_str = f"KSh {total_savings / 1_000_000:.1f}M"
        elif total_savings >= 1_000:
            managed_str = f"KSh {total_savings / 1_000:.1f}K"
        else:
            managed_str = f"KSh {int(total_savings)}"

        return jsonify({
            'chamas': chamas_count,
            'members': members_count,
            'managed': managed_str,
            'uptime': '99.98%'
        }), 200
    except Exception as e:
        logger.error("Error fetching public stats: %s", e)
        return jsonify({'error': 'Failed to load stats'}), 500


@settings_bp.route('/superadmin/public-stats', methods=['PUT'])
@jwt_required()
def update_public_stats():
    """Superadmin endpoint to override the public stats with custom marketing numbers."""
    if not get_jwt().get('is_superadmin'):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json() or {}
    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings()
        db.session.add(settings)

    # Store the overrides as JSON
    settings.public_stats = {
        'chamas': data.get('chamas', 0),
        'members': data.get('members', 0),
        'managed': data.get('managed', 'KSh 0'),
        'uptime': data.get('uptime', '99.98%')
    }
    
    db.session.commit()
    logger.info("Superadmin updated public stats")
    return jsonify({'message': 'Public stats updated successfully'}), 200
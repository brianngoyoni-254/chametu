from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.chama import Chama, ChamaSettings

settings_bp = Blueprint('settings', __name__)

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
        "chama": {
            "name": chama.name,
            "code": chama.code,
            "location": chama.type
        },
        "settings": {
            "platformName": settings.platform_name,
            "supportEmail": settings.support_email,
            "timezone": settings.timezone,
            "gracePeriod": settings.grace_period,
            "autoBlockDays": settings.auto_block_days,
            "paybill": settings.paybill,
            "accountRef": settings.account_ref
        }
    }), 200

@settings_bp.route('/', methods=['PUT'])
@jwt_required()
def update_settings():
    cid = get_jwt().get('chama_id')
    if get_jwt().get('role') not in ['Chairman', 'Treasurer']:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    chama = Chama.query.get(cid)
    settings = ChamaSettings.query.filter_by(chama_id=cid).first()
    
    if not settings:
        settings = ChamaSettings(chama_id=cid)

    if 'name' in data: chama.name = data['name']
    if 'location' in data: chama.type = data['location']
    
    if 'platformName' in data: settings.platform_name = data['platformName']
    if 'supportEmail' in data: settings.support_email = data['supportEmail']
    if 'timezone' in data: settings.timezone = data['timezone']
    if 'gracePeriod' in data: settings.grace_period = int(data['gracePeriod'])
    if 'autoBlockDays' in data: settings.auto_block_days = int(data['autoBlockDays'])
    if 'paybill' in data: settings.paybill = data['paybill']
    if 'accountRef' in data: settings.account_ref = data['accountRef']

    db.session.add(settings)
    db.session.commit()
    return jsonify({"message": "Settings updated"}), 200
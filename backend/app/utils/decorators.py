# app/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity
from app.models.chama import Member, Role
from app.utils.db_retry import retry_db


def require_permission(permission_key):
    """
    Decorator to enforce dynamic role-based permissions on routes.

    Usage:
        @chama_bp.route('/some-protected-route', methods=['POST'])
        @jwt_required()
        @require_permission('approveLoans')
        def approve_loan():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            chama_id = claims.get('chama_id')
            user_id = get_jwt_identity()

            if not chama_id or not user_id:
                return jsonify({'message': 'Missing authentication data'}), 401

            member = retry_db(
                lambda: Member.query.filter_by(user_id=user_id, chama_id=chama_id).first()
            )
            if not member:
                return jsonify({'message': 'Member not found in this chama'}), 403

            role = Role.query.filter_by(chama_id=chama_id, name=member.role).first()

            if not role:
                if member.role == 'Chairman':
                    return f(*args, **kwargs)
                return jsonify({'message': 'Role configuration not found. Contact admin.'}), 403

            if not role.perms.get(permission_key):
                return jsonify({'message': f'Forbidden: Missing {permission_key} permission'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_active_trial(fn):
    """
    Blocks the endpoint for a chama whose trial has expired.

    Returns HTTP 402 with {message, reason, endsAt, tier}.
    The frontend TrialContext detects 402 and flips `isLocked = true`.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('is_superadmin'):
            return fn(*args, **kwargs)
        chama_id = claims.get('chama_id')
        if not chama_id:
            return fn(*args, **kwargs)

        from app.services import trial_service
        trial = trial_service.get_trial(chama_id)
        if trial and trial.is_locked():
            return jsonify({
                'message': 'Your free trial has ended. Upgrade to continue.',
                'reason': 'trial_expired',
                'endsAt': trial.ends_at.isoformat() if trial.ends_at else None,
                'tier': trial.tier,
            }), 402

        return fn(*args, **kwargs)
    return wrapper
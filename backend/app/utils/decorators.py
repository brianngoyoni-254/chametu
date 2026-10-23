# app/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity
from app.models.chama import Member, Role

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
                
            # Find the member in this chama
            member = Member.query.filter_by(user_id=user_id, chama_id=chama_id).first()
            if not member:
                return jsonify({'message': 'Member not found in this chama'}), 403
                
            # Find the role configuration in the database
            role = Role.query.filter_by(chama_id=chama_id, name=member.role).first()
            
            # Fallback: If no roles exist in DB yet (before seeding), let Chairman bypass
            if not role:
                if member.role == 'Chairman':
                    return f(*args, **kwargs)
                return jsonify({'message': 'Role configuration not found. Contact admin.'}), 403
                
            # Check if the requested permission is True in the JSON column
            if not role.perms.get(permission_key):
                return jsonify({'message': f'Forbidden: Missing {permission_key} permission'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
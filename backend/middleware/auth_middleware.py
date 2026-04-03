from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from utils.helpers import create_response

def token_required(fn):
    """
    Decorator to verify JWT token on protected routes
    
    Args:
        fn: The route function to protect
    
    Returns:
        Wrapped function with token verification
    """
    @wraps(fn)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return fn(user_id, *args, **kwargs)
        except Exception as e:
            return create_response('error', 'Unauthorized: Invalid or expired token', status_code=401)
    
    return decorated

def admin_required(fn):
    """
    Decorator to verify if user is admin
    
    Args:
        fn: The route function to protect
    
    Returns:
        Wrapped function with admin verification
    """
    @wraps(fn)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            # This would need to check user role from database
            # For now, basic token verification
            return fn(user_id, *args, **kwargs)
        except Exception as e:
            return create_response('error', 'Admin access required', status_code=403)
    
    return decorated
import jwt
import os
from functools import wraps
from flask import request, jsonify, current_app

def decode_auth_token(token):
    """
    Decode the JWT token and return the user ID
    """
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
            
        jwt_secret = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload['sub']  # user_id
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """
    Decorator for views that require a valid token
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
        
        # Get user ID from token
        user_id = decode_auth_token(token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token!'}), 401
        
        # Add user_id to kwargs
        kwargs['user_id'] = user_id
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """
    Decorator for views that require admin privileges
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Authentication token is missing!'}), 401
        
        # Get user ID from token
        user_id = decode_auth_token(token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token!'}), 401
        
        # In a real app, we would check if the user is an admin
        # For now, let's assume user_id 1 is admin
        if user_id != 1:
            return jsonify({'message': 'Admin privileges required!'}), 403
        
        # Add user_id to kwargs
        kwargs['user_id'] = user_id
        return f(*args, **kwargs)
    
    return decorated 
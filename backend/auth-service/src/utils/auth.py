from datetime import datetime, timedelta
import jwt
import os
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def generate_token(user_id):
    """Generate a JWT token for the given user ID."""
    try:
        payload = {
            'sub': user_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        
        # Get JWT secret key from environment or app config
        secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
        
        # Generate token with improved error handling
        token = jwt.encode(payload, secret_key, algorithm="HS256")
        logger.info(f"Token generated successfully for user {user_id}")
        return token
        
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        raise Exception("Failed to generate authentication token")

def verify_token(token):
    """Verify a JWT token and return the user ID if valid."""
    try:
        if not token:
            logger.warning("No token provided for verification")
            return None
            
        # Get JWT secret key from environment or app config
        secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
        
        # Verify and decode token
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        logger.info(f"Token verified successfully for user {payload['sub']}")
        return payload['sub']
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return None 
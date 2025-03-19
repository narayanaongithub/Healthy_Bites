from flask import Blueprint, request, jsonify, current_app
from ..models import User, db
from ..utils.auth import generate_token, verify_token
import logging

bp = Blueprint('auth', __name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@bp.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name', ''),
            phone=data.get('phone', '')
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()
        logger.info(f"User registered successfully: {user.username}")

        # Generate token
        token = generate_token(user.id)

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'An error occurred during registration'}), 500

@bp.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        # Validate required fields
        if not data.get('username'):
            return jsonify({'message': 'Username or email is required'}), 400
        if not data.get('password'):
            return jsonify({'message': 'Password is required'}), 400

        # Find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | (User.email == data['username'])
        ).first()

        if not user:
            logger.warning(f"Login attempt failed: user not found - {data['username']}")
            return jsonify({'message': 'Invalid credentials'}), 401

        if not user.check_password(data['password']):
            logger.warning(f"Login attempt failed: invalid password for user {user.username}")
            return jsonify({'message': 'Invalid credentials'}), 401

        # Generate token
        token = generate_token(user.id)
        logger.info(f"User logged in successfully: {user.username}")

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        })

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500

@bp.route('/api/auth/user', methods=['GET'])
def get_user():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'No token provided'}), 401

        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        user_id = verify_token(token)
        if not user_id:
            return jsonify({'message': 'Invalid token'}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        logger.info(f"User profile retrieved: {user.username}")
        return jsonify(user.to_dict())

    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}")
        return jsonify({'message': 'An error occurred while retrieving user profile'}), 500 
from flask import Blueprint, request, jsonify
from ..models import db, UserProfile
from ..utils.auth import token_required, admin_required
import requests
import os

user_bp = Blueprint('users', __name__)

@user_bp.route('/api/users/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Get user profile information"""
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not user_profile:
        # If no profile exists, return empty profile
        return jsonify({
            'user_id': user_id,
            'full_name': '',
            'email': '',
            'phone': '',
            'address': '',
            'city': '',
            'state': '',
            'postal_code': '',
            'country': ''
        })
    
    return jsonify(user_profile.to_dict())

@user_bp.route('/api/users/profile', methods=['PUT'])
@token_required
def update_profile(user_id):
    """Update user profile information"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    # If no profile exists, create a new one
    if not user_profile:
        # Try to get email from auth service
        auth_url = os.environ.get('AUTH_SERVICE_URL', 'http://auth-service:5001')
        try:
            auth_response = requests.get(
                f"{auth_url}/api/auth/user",
                headers={"Authorization": request.headers.get('Authorization')}
            )
            if auth_response.ok:
                auth_data = auth_response.json()
                email = auth_data.get('email', '')
            else:
                email = data.get('email', '')
        except:
            email = data.get('email', '')
            
        user_profile = UserProfile(
            user_id=user_id,
            email=email
        )
        db.session.add(user_profile)
    
    # Update fields
    if 'full_name' in data:
        user_profile.full_name = data['full_name']
    if 'email' in data:
        user_profile.email = data['email']
    if 'phone' in data:
        user_profile.phone = data['phone']
    if 'address' in data:
        user_profile.address = data['address']
    if 'city' in data:
        user_profile.city = data['city']
    if 'state' in data:
        user_profile.state = data['state']
    if 'postal_code' in data:
        user_profile.postal_code = data['postal_code']
    if 'country' in data:
        user_profile.country = data['country']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user_profile.to_dict()
    })

@user_bp.route('/api/users/password', methods=['PUT'])
@token_required
def update_password(user_id):
    """Update user password - forwards request to auth service"""
    data = request.json
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'message': 'Missing password data'}), 400
    
    # Forward request to auth service
    auth_url = os.environ.get('AUTH_SERVICE_URL', 'http://auth-service:5001')
    try:
        response = requests.put(
            f"{auth_url}/api/auth/password",
            headers={"Authorization": request.headers.get('Authorization')},
            json=data
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({'message': f'Error communicating with auth service: {str(e)}'}), 500

@user_bp.route('/api/users', methods=['GET'])
@admin_required
def get_all_users(user_id):
    """Get all users (admin only)"""
    users = UserProfile.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/api/users/<int:target_user_id>', methods=['GET'])
@token_required
def get_user(user_id, target_user_id):
    """Get user by ID (admin or self)"""
    # Check if user is admin or requesting their own profile
    if user_id != target_user_id and user_id != 1:  # Not admin or self
        return jsonify({'message': 'Unauthorized access'}), 403
    
    user_profile = UserProfile.query.filter_by(user_id=target_user_id).first()
    
    if not user_profile:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify(user_profile.to_dict())

@user_bp.route('/api/users/<int:target_user_id>', methods=['PUT'])
@token_required
def update_user(user_id, target_user_id):
    """Update user by ID (admin or self)"""
    # Check if user is admin or updating their own profile
    if user_id != target_user_id and user_id != 1:  # Not admin or self
        return jsonify({'message': 'Unauthorized access'}), 403
    
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    user_profile = UserProfile.query.filter_by(user_id=target_user_id).first()
    
    if not user_profile:
        return jsonify({'message': 'User not found'}), 404
    
    # Update fields
    if 'full_name' in data:
        user_profile.full_name = data['full_name']
    if 'email' in data:
        user_profile.email = data['email']
    if 'phone' in data:
        user_profile.phone = data['phone']
    if 'address' in data:
        user_profile.address = data['address']
    if 'city' in data:
        user_profile.city = data['city']
    if 'state' in data:
        user_profile.state = data['state']
    if 'postal_code' in data:
        user_profile.postal_code = data['postal_code']
    if 'country' in data:
        user_profile.country = data['country']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user_profile.to_dict()
    })

@user_bp.route('/api/users/profile/simple', methods=['POST'])
@token_required
def save_simple_profile(user_id):
    """Save simplified user profile information"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        print(f"Processing profile data for user_id: {user_id}")
        print(f"Request data: {data}")
        
        # Ensure user profile exists
        user_profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not user_profile:
            # Create user profile if it doesn't exist
            try:
                # Get email, full_name and phone from auth service or use data provided
                auth_url = os.environ.get('AUTH_SERVICE_URL', 'http://auth-service:5001')
                email = data.get('email', f"user{user_id}@example.com")
                full_name = data.get('full_name', '')
                phone = data.get('phone', '')
                date_of_birth = data.get('date_of_birth', '')
                
                try:
                    auth_response = requests.get(
                        f"{auth_url}/api/auth/user",
                        headers={"Authorization": request.headers.get('Authorization')}
                    )
                    print(f"Auth service response: {auth_response.status_code}")
                    
                    if auth_response.ok:
                        auth_data = auth_response.json()
                        if not email or email == f"user{user_id}@example.com":
                            email = auth_data.get('email', email)
                        if not full_name:
                            full_name = auth_data.get('full_name', full_name)
                        if not phone:
                            phone = auth_data.get('phone', phone)
                        
                        print(f"Auth data: {auth_data}")
                        print(f"Using email: {email}, full_name: {full_name}, phone: {phone}, dob: {date_of_birth}")
                except Exception as auth_err:
                    # Keep the current values if auth service fails
                    print(f"Auth service error: {str(auth_err)}")
                    
                user_profile = UserProfile(
                    user_id=user_id,
                    email=email,
                    full_name=full_name,
                    phone=phone,
                    date_of_birth=date_of_birth
                )
                db.session.add(user_profile)
                db.session.commit()
                print(f"Created new user profile for user_id: {user_id} with email: {email}")
            except Exception as e:
                db.session.rollback()
                print(f"Error creating user profile: {str(e)}")
                return jsonify({'message': f'Failed to create user profile: {str(e)}'}), 500
        
        # Log received data
        print(f"Received profile data: {data}")
        
        # Update user profile fields
        field_mapping = {
            'full_name': 'full_name',
            'email': 'email',
            'phone': 'phone',
            'date_of_birth': 'date_of_birth',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'postal_code': 'postal_code',
            'country': 'country'
        }
        
        # Update each field if provided
        for front_end_field, db_field in field_mapping.items():
            if front_end_field in data and data[front_end_field] is not None:
                setattr(user_profile, db_field, data[front_end_field])
                print(f"Updated {db_field} to: {data[front_end_field]}")
        
        # Commit all changes
        db.session.commit()
        
        # Get the updated user profile
        updated_user = user_profile.to_dict()
        print(f"Profile updated successfully: {updated_user}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': updated_user
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error in save_simple_profile: {str(e)}")
        return jsonify({'message': f'Error updating profile: {str(e)}'}), 500 
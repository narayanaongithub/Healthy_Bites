from flask import Blueprint, request, jsonify
from ..models import db, UserProfile, DietaryPreference
from ..utils.auth import token_required
from sqlalchemy.exc import IntegrityError
import os
import requests

dietary_bp = Blueprint('dietary', __name__)

@dietary_bp.route('/api/users/dietary-preferences', methods=['GET'])
@token_required
def get_dietary_preferences(user_id):
    """Get all dietary preferences for a user"""
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    preferences = DietaryPreference.query.filter_by(user_id=user_id).all()
    return jsonify([pref.to_dict() for pref in preferences])

@dietary_bp.route('/api/users/dietary-preferences', methods=['POST'])
@token_required
def add_dietary_preference(user_id):
    """Add a new dietary preference"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    # Validate required fields
    required_fields = ['preference_type', 'preference_value']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'{field} is required'}), 400
    
    # Create new dietary preference
    new_preference = DietaryPreference(
        user_id=user_id,
        preference_type=data['preference_type'],
        preference_value=data['preference_value']
    )
    
    try:
        db.session.add(new_preference)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'This dietary preference already exists'}), 400
    
    return jsonify({
        'message': 'Dietary preference added successfully',
        'preference': new_preference.to_dict()
    }), 201

@dietary_bp.route('/api/users/dietary-preferences/<int:preference_id>', methods=['GET'])
@token_required
def get_dietary_preference(user_id, preference_id):
    """Get a specific dietary preference"""
    preference = DietaryPreference.query.filter_by(id=preference_id, user_id=user_id).first()
    
    if not preference:
        return jsonify({'message': 'Dietary preference not found'}), 404
    
    return jsonify(preference.to_dict())

@dietary_bp.route('/api/users/dietary-preferences/<int:preference_id>', methods=['PUT'])
@token_required
def update_dietary_preference(user_id, preference_id):
    """Update a dietary preference"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    preference = DietaryPreference.query.filter_by(id=preference_id, user_id=user_id).first()
    
    if not preference:
        return jsonify({'message': 'Dietary preference not found'}), 404
    
    # Update fields
    if 'preference_type' in data:
        preference.preference_type = data['preference_type']
    if 'preference_value' in data:
        preference.preference_value = data['preference_value']
    
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'This dietary preference already exists'}), 400
    
    return jsonify({
        'message': 'Dietary preference updated successfully',
        'preference': preference.to_dict()
    })

@dietary_bp.route('/api/users/dietary-preferences/<int:preference_id>', methods=['DELETE'])
@token_required
def delete_dietary_preference(user_id, preference_id):
    """Delete a dietary preference"""
    preference = DietaryPreference.query.filter_by(id=preference_id, user_id=user_id).first()
    
    if not preference:
        return jsonify({'message': 'Dietary preference not found'}), 404
    
    db.session.delete(preference)
    db.session.commit()
    
    return jsonify({'message': 'Dietary preference deleted successfully'})

@dietary_bp.route('/api/users/dietary-preferences', methods=['PUT'])
@token_required
def update_bulk_dietary_preferences(user_id):
    """Update all dietary preferences for a user (replaces existing ones)"""
    data = request.json
    
    if not data or 'preferences' not in data or not isinstance(data['preferences'], list):
        return jsonify({'message': 'Invalid data format. Expected a list of preferences'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    # Delete all existing preferences for this user
    DietaryPreference.query.filter_by(user_id=user_id).delete()
    
    # Add new preferences
    new_preferences = []
    errors = []
    
    for idx, pref_data in enumerate(data['preferences']):
        # Validate required fields
        if not all(field in pref_data for field in ['preference_type', 'preference_value']):
            errors.append({
                'index': idx,
                'message': 'Missing required fields (preference_type, preference_value)',
                'data': pref_data
            })
            continue
        
        # Create new dietary preference
        new_preference = DietaryPreference(
            user_id=user_id,
            preference_type=pref_data['preference_type'],
            preference_value=pref_data['preference_value']
        )
        
        try:
            db.session.add(new_preference)
            new_preferences.append(new_preference)
        except Exception as e:
            errors.append({
                'index': idx,
                'message': str(e),
                'data': pref_data
            })
    
    # Commit all changes
    try:
        db.session.commit()
        return jsonify({
            'message': f'Updated dietary preferences: added {len(new_preferences)} preferences with {len(errors)} errors',
            'preferences': [pref.to_dict() for pref in new_preferences],
            'errors': errors
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error saving preferences: {str(e)}'}), 500

@dietary_bp.route('/api/users/dietary-preferences/bulk', methods=['POST'])
@token_required
def add_bulk_dietary_preferences(user_id):
    """Add multiple dietary preferences at once"""
    data = request.json
    
    if not data or not isinstance(data, list):
        return jsonify({'message': 'Invalid data format. Expected a list of preferences'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    added_preferences = []
    errors = []
    
    for idx, pref_data in enumerate(data):
        # Validate required fields
        if not all(field in pref_data for field in ['preference_type', 'preference_value']):
            errors.append({
                'index': idx,
                'message': 'Missing required fields (preference_type, preference_value)',
                'data': pref_data
            })
            continue
        
        # Create new dietary preference
        new_preference = DietaryPreference(
            user_id=user_id,
            preference_type=pref_data['preference_type'],
            preference_value=pref_data['preference_value']
        )
        
        try:
            db.session.add(new_preference)
            db.session.commit()
            added_preferences.append(new_preference.to_dict())
        except IntegrityError:
            db.session.rollback()
            errors.append({
                'index': idx,
                'message': 'This dietary preference already exists',
                'data': pref_data
            })
    
    return jsonify({
        'message': f'Added {len(added_preferences)} dietary preferences with {len(errors)} errors',
        'added_preferences': added_preferences,
        'errors': errors
    })

@dietary_bp.route('/api/users/dietary-preferences/simple', methods=['POST'])
@token_required
def save_simple_dietary_preferences(user_id):
    """Save simplified dietary preferences for a user"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        # Create user profile if it doesn't exist
        try:
            # Get email from auth service or use a placeholder
            auth_url = os.environ.get('AUTH_SERVICE_URL', 'http://auth-service:5001')
            default_email = f"user{user_id}@example.com"  # Fallback email
            
            try:
                auth_response = requests.get(
                    f"{auth_url}/api/auth/user",
                    headers={"Authorization": request.headers.get('Authorization')}
                )
                if auth_response.ok:
                    auth_data = auth_response.json()
                    email = auth_data.get('email', default_email)
                else:
                    email = default_email
            except:
                email = default_email
                
            user_profile = UserProfile(
                user_id=user_id,
                email=email
            )
            db.session.add(user_profile)
            db.session.commit()
            print(f"Created new user profile for user_id: {user_id} with email: {email}")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating user profile: {str(e)}")
            return jsonify({'message': f'Failed to create user profile: {str(e)}'}), 500
    
    # Log received data
    print(f"Received dietary preferences data: {data}")
    
    # Validate data - more lenient validation to handle front-end variations
    expected_fields = ['diet_restrictions', 'meal_preferences', 'allergies']
    for field in expected_fields:
        if field not in data:
            data[field] = ''  # Set default empty value if missing
    
    # Delete all existing preferences for this user to avoid conflicts with unique constraint
    try:
        DietaryPreference.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        print(f"Deleted existing preferences for user {user_id}")
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting existing preferences: {str(e)}")
    
    # Create a preference entry for each category
    new_preferences = []
    
    try:
        # Add diet restrictions if not empty
        if data['diet_restrictions']:
            diet_pref = DietaryPreference(
                user_id=user_id,
                preference_type='dietary_restrictions',
                preference_value=data['diet_restrictions']
            )
            db.session.add(diet_pref)
            new_preferences.append(diet_pref)
            print(f"Added dietary restrictions: {data['diet_restrictions']}")
        
        # Add meal preferences if not empty
        if data['meal_preferences']:
            meal_pref = DietaryPreference(
                user_id=user_id,
                preference_type='meal_preferences',
                preference_value=data['meal_preferences']
            )
            db.session.add(meal_pref)
            new_preferences.append(meal_pref)
            print(f"Added meal preferences: {data['meal_preferences']}")
        
        # Add allergies if not empty
        if data['allergies']:
            allergies_pref = DietaryPreference(
                user_id=user_id,
                preference_type='allergies',
                preference_value=data['allergies']
            )
            db.session.add(allergies_pref)
            new_preferences.append(allergies_pref)
            print(f"Added allergies: {data['allergies']}")
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'message': 'Dietary preferences saved successfully',
            'preferences': [pref.to_dict() for pref in new_preferences]
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error saving preferences: {str(e)}")
        return jsonify({'message': f'Error saving preferences: {str(e)}'}), 500 
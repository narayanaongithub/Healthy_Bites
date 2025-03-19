from flask import Blueprint, request, jsonify
from ..models import db, UserProfile, PaymentMethod
from ..utils.auth import token_required

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/api/users/payment-methods', methods=['GET'])
@token_required
def get_payment_methods(user_id):
    """Get all payment methods for a user"""
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    payment_methods = PaymentMethod.query.filter_by(user_id=user_id).all()
    return jsonify([method.to_dict() for method in payment_methods])

@payment_bp.route('/api/users/payment-methods', methods=['POST'])
@token_required
def add_payment_method(user_id):
    """Add a new payment method"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    # Validate required fields
    required_fields = ['payment_type', 'provider', 'account_number']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'{field} is required'}), 400
    
    # Create new payment method
    new_payment = PaymentMethod(
        user_id=user_id,
        payment_type=data['payment_type'],
        provider=data['provider'],
        account_number=data['account_number'],
        expiry_date=data.get('expiry_date'),
        is_default=data.get('is_default', False)
    )
    
    # If this is the default payment method, update other methods
    if new_payment.is_default:
        # Set is_default=False for all other payment methods
        PaymentMethod.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
    
    # If this is the first payment method, make it default
    elif PaymentMethod.query.filter_by(user_id=user_id).count() == 0:
        new_payment.is_default = True
    
    db.session.add(new_payment)
    db.session.commit()
    
    return jsonify({
        'message': 'Payment method added successfully',
        'payment_method': new_payment.to_dict()
    }), 201

@payment_bp.route('/api/users/payment-methods/<int:payment_id>', methods=['GET'])
@token_required
def get_payment_method(user_id, payment_id):
    """Get a specific payment method"""
    payment = PaymentMethod.query.filter_by(id=payment_id, user_id=user_id).first()
    
    if not payment:
        return jsonify({'message': 'Payment method not found'}), 404
    
    return jsonify(payment.to_dict())

@payment_bp.route('/api/users/payment-methods/<int:payment_id>', methods=['PUT'])
@token_required
def update_payment_method(user_id, payment_id):
    """Update a payment method"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    payment = PaymentMethod.query.filter_by(id=payment_id, user_id=user_id).first()
    
    if not payment:
        return jsonify({'message': 'Payment method not found'}), 404
    
    # Update fields
    if 'payment_type' in data:
        payment.payment_type = data['payment_type']
    if 'provider' in data:
        payment.provider = data['provider']
    if 'account_number' in data:
        payment.account_number = data['account_number']
    if 'expiry_date' in data:
        payment.expiry_date = data['expiry_date']
    
    # Handle default status
    if 'is_default' in data and data['is_default'] and not payment.is_default:
        # Set is_default=False for all other payment methods
        PaymentMethod.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
        payment.is_default = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'Payment method updated successfully',
        'payment_method': payment.to_dict()
    })

@payment_bp.route('/api/users/payment-methods/<int:payment_id>', methods=['DELETE'])
@token_required
def delete_payment_method(user_id, payment_id):
    """Delete a payment method"""
    payment = PaymentMethod.query.filter_by(id=payment_id, user_id=user_id).first()
    
    if not payment:
        return jsonify({'message': 'Payment method not found'}), 404
    
    was_default = payment.is_default
    
    db.session.delete(payment)
    
    # If this was the default payment method, set a new default
    if was_default:
        remaining_payment = PaymentMethod.query.filter_by(user_id=user_id).first()
        if remaining_payment:
            remaining_payment.is_default = True
    
    db.session.commit()
    
    return jsonify({'message': 'Payment method deleted successfully'})

@payment_bp.route('/api/users/payment-methods/<int:payment_id>/default', methods=['PATCH'])
@token_required
def set_default_payment_method(user_id, payment_id):
    """Set a payment method as default"""
    payment = PaymentMethod.query.filter_by(id=payment_id, user_id=user_id).first()
    
    if not payment:
        return jsonify({'message': 'Payment method not found'}), 404
    
    # Set is_default=False for all payment methods
    PaymentMethod.query.filter_by(user_id=user_id).update({'is_default': False})
    
    # Set the specified payment method as default
    payment.is_default = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'Default payment method updated successfully',
        'payment_method': payment.to_dict()
    }) 
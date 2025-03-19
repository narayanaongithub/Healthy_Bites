from flask import Blueprint, request, jsonify
from ..models import db, UserProfile, ShippingAddress
from ..utils.auth import token_required

shipping_bp = Blueprint('shipping', __name__)

@shipping_bp.route('/api/users/shipping-addresses', methods=['GET'])
@token_required
def get_shipping_addresses(user_id):
    """Get all shipping addresses for a user"""
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    addresses = ShippingAddress.query.filter_by(user_id=user_id).all()
    return jsonify([address.to_dict() for address in addresses])

@shipping_bp.route('/api/users/shipping-addresses', methods=['POST'])
@token_required
def add_shipping_address(user_id):
    """Add a new shipping address"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Ensure user profile exists
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not user_profile:
        return jsonify({'message': 'User profile not found'}), 404
    
    # Validate required fields
    if not data.get('address'):
        return jsonify({'message': 'Address is required'}), 400
    
    # Create new shipping address
    new_address = ShippingAddress(
        user_id=user_id,
        address_name=data.get('address_name', 'My Address'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        postal_code=data.get('postal_code'),
        country=data.get('country'),
        is_default=data.get('is_default', False)
    )
    
    # If this is the default address, update other addresses
    if new_address.is_default:
        # Set is_default=False for all other addresses
        ShippingAddress.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
    
    # If this is the first address, make it default
    elif ShippingAddress.query.filter_by(user_id=user_id).count() == 0:
        new_address.is_default = True
    
    db.session.add(new_address)
    db.session.commit()
    
    return jsonify({
        'message': 'Shipping address added successfully',
        'address': new_address.to_dict()
    }), 201

@shipping_bp.route('/api/users/shipping-addresses/<int:address_id>', methods=['GET'])
@token_required
def get_shipping_address(user_id, address_id):
    """Get a specific shipping address"""
    address = ShippingAddress.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'message': 'Shipping address not found'}), 404
    
    return jsonify(address.to_dict())

@shipping_bp.route('/api/users/shipping-addresses/<int:address_id>', methods=['PUT'])
@token_required
def update_shipping_address(user_id, address_id):
    """Update a shipping address"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    address = ShippingAddress.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'message': 'Shipping address not found'}), 404
    
    # Update fields
    if 'address_name' in data:
        address.address_name = data['address_name']
    if 'address' in data:
        address.address = data['address']
    if 'city' in data:
        address.city = data['city']
    if 'state' in data:
        address.state = data['state']
    if 'postal_code' in data:
        address.postal_code = data['postal_code']
    if 'country' in data:
        address.country = data['country']
    
    # Handle default status
    if 'is_default' in data and data['is_default'] and not address.is_default:
        # Set is_default=False for all other addresses
        ShippingAddress.query.filter_by(user_id=user_id, is_default=True).update({'is_default': False})
        address.is_default = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'Shipping address updated successfully',
        'address': address.to_dict()
    })

@shipping_bp.route('/api/users/shipping-addresses/<int:address_id>', methods=['DELETE'])
@token_required
def delete_shipping_address(user_id, address_id):
    """Delete a shipping address"""
    address = ShippingAddress.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'message': 'Shipping address not found'}), 404
    
    was_default = address.is_default
    
    db.session.delete(address)
    
    # If this was the default address, set a new default if any addresses remain
    if was_default:
        remaining_address = ShippingAddress.query.filter_by(user_id=user_id).first()
        if remaining_address:
            remaining_address.is_default = True
    
    db.session.commit()
    
    return jsonify({'message': 'Shipping address deleted successfully'})

@shipping_bp.route('/api/users/shipping-addresses/<int:address_id>/default', methods=['PATCH'])
@token_required
def set_default_shipping_address(user_id, address_id):
    """Set a shipping address as default"""
    address = ShippingAddress.query.filter_by(id=address_id, user_id=user_id).first()
    
    if not address:
        return jsonify({'message': 'Shipping address not found'}), 404
    
    # Set is_default=False for all addresses
    ShippingAddress.query.filter_by(user_id=user_id).update({'is_default': False})
    
    # Set the specified address as default
    address.is_default = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'Default shipping address updated successfully',
        'address': address.to_dict()
    }) 
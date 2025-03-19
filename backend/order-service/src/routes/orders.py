from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Order, OrderItem
from ..utils.product import get_product_details
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create Blueprint
orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    """
    Create a new order
    """
    user_id = get_jwt_identity()
    data = request.json
    
    if not data:
        return jsonify({'message': 'Invalid order data!'}), 400
    
    try:
        # Extract cart items directly from the frontend
        items = data.get('items', [])
        if not items or not isinstance(items, list) or len(items) == 0:
            return jsonify({'message': 'No items provided in order!'}), 400
        
        # Calculate order total and prepare order items
        total_amount = 0
        order_items = []
        
        for item in items:
            product_id = item.get('id') or item.get('product_id')  # Support both formats
            product_name = item.get('name')
            price = item.get('price')
            quantity = item.get('quantity', 1)
            
            if not product_id or not product_name or not price or not quantity:
                continue  # Skip invalid items
                
            # Calculate item total
            item_total = float(price) * int(quantity)
            total_amount += item_total
            
            # Prepare order item
            order_items.append({
                'product_id': product_id,
                'quantity': quantity,
                'price': price,
                'product_name': product_name
            })
        
        # Apply discount if any
        discount_amount = data.get('discount_amount', 0)
        discount_rate = data.get('discount_rate', 0)
        discount_applied = data.get('discount_applied', False)
        original_amount = total_amount
        
        if discount_applied and discount_amount > 0:
            total_amount -= float(discount_amount)
        
        # Add delivery fee and tax
        delivery_fee = data.get('delivery_fee', 3.99)
        tax_rate = data.get('tax_rate', 0.08)
        tax_amount = total_amount * tax_rate
        final_total = total_amount + tax_amount + delivery_fee
        
        if len(order_items) == 0:
            return jsonify({'message': 'No valid items in order!'}), 400
        
        # Create new order with complete information
        new_order = Order(
            user_id=user_id,
            total_amount=round(final_total, 2),
            shipping_address=data.get('shipping_address', ''),
            status=data.get('status', 'pending')
        )
        
        db.session.add(new_order)
        db.session.flush()  # Get the order ID without committing
        
        # Add order items
        for item in order_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item['product_id'],
                quantity=item['quantity'],
                price=item['price'],
                product_name=item['product_name']
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        # Include discount info in the response
        response_data = new_order.to_dict()
        response_data['discount_applied'] = discount_applied
        response_data['discount_amount'] = discount_amount
        response_data['discount_rate'] = discount_rate
        response_data['original_amount'] = original_amount
        response_data['tax_rate'] = tax_rate
        response_data['tax_amount'] = tax_amount
        response_data['delivery_fee'] = delivery_fee
        
        logger.info(f"Order created successfully: {new_order.id}")
        return jsonify({
            'message': 'Order created successfully',
            'order': response_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating order: {str(e)}")
        return jsonify({'message': f'Error creating order: {str(e)}'}), 500

@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_user_orders():
    """
    Get all orders for the current user
    """
    user_id = get_jwt_identity()
    try:
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        logger.info(f"Retrieved {len(orders)} orders for user {user_id}")
        return jsonify([order.to_dict() for order in orders])
    except Exception as e:
        logger.error(f"Error retrieving orders for user {user_id}: {str(e)}")
        return jsonify({'message': f'Error retrieving orders: {str(e)}'}), 500

@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """
    Get a specific order by ID
    """
    user_id = get_jwt_identity()
    try:
        order = Order.query.get(order_id)
        
        if not order:
            logger.warning(f"Order not found: {order_id}")
            return jsonify({'message': 'Order not found!'}), 404
            
        # Check if the order belongs to the user
        if order.user_id != user_id:
            logger.warning(f"Unauthorized access to order {order_id} by user {user_id}")
            return jsonify({'message': 'Unauthorized access!'}), 403
            
        logger.info(f"Retrieved order {order_id} for user {user_id}")
        return jsonify(order.to_dict())
    except Exception as e:
        logger.error(f"Error retrieving order {order_id}: {str(e)}")
        return jsonify({'message': f'Error retrieving order: {str(e)}'}), 500

@orders_bp.route('/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """
    Update an order's status
    """
    user_id = get_jwt_identity()
    try:
        order = Order.query.get(order_id)
        
        if not order:
            logger.warning(f"Order not found: {order_id}")
            return jsonify({'message': 'Order not found!'}), 404
            
        # Check if the order belongs to the user
        if order.user_id != user_id:
            logger.warning(f"Unauthorized access to order {order_id} by user {user_id}")
            return jsonify({'message': 'Unauthorized access!'}), 403
            
        data = request.json
        
        if 'status' in data and data['status'] in ['pending', 'confirmed', 'delivered', 'cancelled']:
            order.status = data['status']
            db.session.commit()
            logger.info(f"Updated order {order_id} status to {data['status']}")
        else:
            logger.warning(f"Invalid status update for order {order_id}: {data.get('status')}")
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating order {order_id}: {str(e)}")
        return jsonify({'message': f'Error updating order: {str(e)}'}), 500

@orders_bp.route('/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_order(order_id):
    """
    Cancel an order
    """
    user_id = get_jwt_identity()
    try:
        order = Order.query.get(order_id)
        
        if not order:
            logger.warning(f"Order not found: {order_id}")
            return jsonify({'message': 'Order not found!'}), 404
            
        # Check if the order belongs to the user
        if order.user_id != user_id:
            logger.warning(f"Unauthorized access to order {order_id} by user {user_id}")
            return jsonify({'message': 'Unauthorized access!'}), 403
            
        # Only allow cancellation of pending orders
        if order.status != 'pending':
            logger.warning(f"Cannot cancel order {order_id} with status {order.status}")
            return jsonify({'message': 'Cannot cancel order that is not in pending status!'}), 400
            
        order.status = 'cancelled'
        db.session.commit()
        logger.info(f"Order {order_id} cancelled successfully")
        
        return jsonify({
            'message': 'Order cancelled successfully'
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error cancelling order {order_id}: {str(e)}")
        return jsonify({'message': f'Error cancelling order: {str(e)}'}), 500 
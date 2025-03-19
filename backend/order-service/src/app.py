from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import os
import requests
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80').split(',')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql://root:password@mysql/order_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Product service URL
PRODUCT_SERVICE_URL = os.environ.get('PRODUCT_SERVICE_URL', 'http://product-service:5002')

# Models
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, delivered, cancelled
    total_amount = db.Column(db.Float, nullable=False)
    shipping_address = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'status': self.status,
            'total_amount': self.total_amount,
            'shipping_address': self.shipping_address,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    product_name = db.Column(db.String(100))
    
    # Relationship with Order
    order = db.relationship('Order', backref=db.backref('items', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'price': self.price,
            'product_name': self.product_name,
            'subtotal': round(self.price * self.quantity, 2)
        }

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# Helper function to get product details
def get_product_details(product_id, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.get(f'{PRODUCT_SERVICE_URL}/api/products/{product_id}', headers=headers)
        if response.status_code == 200:
            return response.json()
    except requests.RequestException:
        pass
    
    return None

# Routes
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.json
    
    if not data or not data.get('items') or not isinstance(data['items'], list) or len(data['items']) == 0:
        return jsonify({'message': 'Invalid order data!'}), 400
    
    # Calculate order total and get product details
    total_amount = 0
    order_items = []
    
    token = request.headers.get('Authorization', '').split(' ')[1] if 'Authorization' in request.headers else None
    
    for item in data['items']:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 1)
        
        if not product_id or quantity <= 0:
            continue
            
        product = get_product_details(product_id, token)
        if not product:
            continue
            
        price = product.get('price', 0)
        total_amount += price * quantity
        
        order_items.append({
            'product_id': product_id,
            'quantity': quantity,
            'price': price,
            'product_name': product.get('name', f'Product {product_id}')
        })
    
    if len(order_items) == 0:
        return jsonify({'message': 'No valid items in order!'}), 400
    
    # Create new order
    new_order = Order(
        user_id=user_id,
        total_amount=round(total_amount, 2),
        shipping_address=data.get('shipping_address', '')
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
    
    return jsonify({
        'message': 'Order created successfully',
        'order': new_order.to_dict()
    }), 201

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    user_id = get_jwt_identity()
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders])

@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    user_id = get_jwt_identity()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found!'}), 404
        
    # Check if the order belongs to the user
    if order.user_id != user_id:
        return jsonify({'message': 'Unauthorized access!'}), 403
        
    return jsonify(order.to_dict())

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    user_id = get_jwt_identity()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found!'}), 404
        
    # Check if the order belongs to the user
    if order.user_id != user_id:
        return jsonify({'message': 'Unauthorized access!'}), 403
        
    data = request.json
    
    if 'status' in data and data['status'] in ['pending', 'confirmed', 'delivered', 'cancelled']:
        order.status = data['status']
        db.session.commit()
        
    return jsonify({
        'message': 'Order updated successfully',
        'order': order.to_dict()
    })

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def cancel_order(order_id):
    user_id = get_jwt_identity()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found!'}), 404
        
    # Check if the order belongs to the user
    if order.user_id != user_id:
        return jsonify({'message': 'Unauthorized access!'}), 403
        
    # Only allow cancellation of pending orders
    if order.status != 'pending':
        return jsonify({'message': 'Cannot cancel order that is not in pending status!'}), 400
        
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'message': 'Order cancelled successfully'
    })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'order-service'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True) 
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import os
import requests
from datetime import datetime, timedelta

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80').split(',')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql://root:password@mysql/subscription_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Product service URL
PRODUCT_SERVICE_URL = os.environ.get('PRODUCT_SERVICE_URL', 'http://product-service:5002')

# Models
class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, cancelled
    auto_renew = db.Column(db.Boolean, default=True)
    price = db.Column(db.Float, default=9.99)
    discount_percent = db.Column(db.Float, default=15.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Payment details
    card_last_four = db.Column(db.String(4))
    card_type = db.Column(db.String(20))  # visa, mastercard, etc.
    expiry_month = db.Column(db.String(2))
    expiry_year = db.Column(db.String(4))
    card_name = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_date': self.start_date.strftime('%Y-%m-%d'),
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'status': self.status,
            'auto_renew': self.auto_renew,
            'price': self.price,
            'discount_percent': self.discount_percent,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'card_last_four': self.card_last_four,
            'card_type': self.card_type,
            'expiry_month': self.expiry_month,
            'expiry_year': self.expiry_year,
            'card_name': self.card_name
        }

# Create tables if they don't exist
with app.app_context():
    db.create_all()
    
    # Add the single monthly subscription plan if the database is empty
    if not Subscription.query.first():
        monthly_plan = Subscription(
            user_id=1,  # Assuming a default user_id
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            price=9.99,
            discount_percent=15.0,
            auto_renew=True,
            card_last_four="1234",
            card_type="visa",
            expiry_month="12",
            expiry_year="2024",
            card_name="John Doe"
        )
        db.session.add(monthly_plan)
        db.session.commit()

# Routes
@app.route('/api/subscriptions', methods=['POST'])
@jwt_required()
def create_subscription():
    user_id = get_jwt_identity()
    data = request.json
    
    try:
        # Check if user already has an active subscription
        existing_sub = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        if existing_sub:
            return jsonify({'message': 'User already has an active subscription!'}), 409
            
        # Calculate end date (30 days from now)
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=30)
        
        # Create new subscription
        new_subscription = Subscription(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            price=9.99,
            discount_percent=15.0,
            auto_renew=data.get('auto_renew', True),
            card_last_four=data.get('card_last_four'),
            card_type=data.get('card_type'),
            expiry_month=data.get('expiry_month'),
            expiry_year=data.get('expiry_year'),
            card_name=data.get('card_name')
        )
        
        db.session.add(new_subscription)
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription': new_subscription.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating subscription: {str(e)}")
        return jsonify({'message': 'Error creating subscription'}), 500

@app.route('/api/subscriptions', methods=['GET'])
@jwt_required()
def get_user_subscriptions():
    user_id = get_jwt_identity()
    subscriptions = Subscription.query.filter_by(user_id=user_id).all()
    return jsonify([sub.to_dict() for sub in subscriptions])

@app.route('/api/subscriptions/active', methods=['GET'])
@jwt_required()
def get_active_subscription():
    user_id = get_jwt_identity()
    
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'message': 'No active subscription found'}), 404
            
        return jsonify(subscription.to_dict())
    except Exception as e:
        print(f"Error fetching active subscription: {str(e)}")
        return jsonify({'message': 'Error fetching subscription'}), 500

@app.route('/api/subscriptions/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    user_id = get_jwt_identity()
    
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'message': 'No active subscription found'}), 404
            
        subscription.status = 'cancelled'
        subscription.auto_renew = False
        db.session.commit()
        
        return jsonify({'message': 'Subscription cancelled successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error cancelling subscription: {str(e)}")
        return jsonify({'message': 'Error cancelling subscription'}), 500

@app.route('/api/subscription/discount', methods=['GET'])
@jwt_required()
def get_user_discount():
    user_id = get_jwt_identity()
    
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        if subscription:
            return jsonify({
                'has_subscription': True,
                'discount_percent': subscription.discount_percent
            })
        
        return jsonify({
            'has_subscription': False,
            'discount_percent': 0
        })
        
    except Exception as e:
        print(f"Error fetching discount: {str(e)}")
        return jsonify({
            'has_subscription': False,
            'discount_percent': 0
        })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'subscription-service'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
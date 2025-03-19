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
class SubscriptionPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, default=30)  # Default to monthly
    meals_per_week = db.Column(db.Integer, default=5)  # Default to weekdays
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'duration_days': self.duration_days,
            'meals_per_week': self.meals_per_week,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plan.id'), nullable=False)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, paused, cancelled
    auto_renew = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with SubscriptionPlan
    plan = db.relationship('SubscriptionPlan', backref=db.backref('subscriptions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'start_date': self.start_date.strftime('%Y-%m-%d'),
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'status': self.status,
            'auto_renew': self.auto_renew,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

# Create tables if they don't exist
with app.app_context():
    db.create_all()
    
    # Add some initial subscription plans if the database is empty
    if not SubscriptionPlan.query.first():
        plans = [
            SubscriptionPlan(name="Basic Monthly", description="5 meals per week, standard options", price=99.99, duration_days=30, meals_per_week=5),
            SubscriptionPlan(name="Premium Monthly", description="7 meals per week, premium options", price=149.99, duration_days=30, meals_per_week=7),
            SubscriptionPlan(name="Family Monthly", description="5 meals per week for a family of 4", price=299.99, duration_days=30, meals_per_week=5),
            SubscriptionPlan(name="Quarterly Basic", description="5 meals per week for 3 months", price=269.99, duration_days=90, meals_per_week=5),
            SubscriptionPlan(name="Annual Basic", description="5 meals per week for a full year", price=999.99, duration_days=365, meals_per_week=5)
        ]
        db.session.add_all(plans)
        db.session.commit()

# Routes
@app.route('/api/subscription-plans', methods=['GET'])
def get_subscription_plans():
    plans = SubscriptionPlan.query.all()
    return jsonify([plan.to_dict() for plan in plans])

@app.route('/api/subscription-plans/<int:plan_id>', methods=['GET'])
def get_subscription_plan(plan_id):
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'message': 'Subscription plan not found!'}), 404
        
    return jsonify(plan.to_dict())

@app.route('/api/subscriptions', methods=['POST'])
@jwt_required()
def create_subscription():
    user_id = get_jwt_identity()
    data = request.json
    
    if not data or not data.get('plan_id'):
        return jsonify({'message': 'Missing plan ID!'}), 400
        
    plan = SubscriptionPlan.query.get(data['plan_id'])
    if not plan:
        return jsonify({'message': 'Subscription plan not found!'}), 404
        
    # Check if user already has an active subscription
    existing_sub = Subscription.query.filter_by(user_id=user_id, status='active').first()
    if existing_sub:
        return jsonify({'message': 'User already has an active subscription!'}), 409
        
    # Calculate end date based on plan duration
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=plan.duration_days)
    
    # Create new subscription
    new_subscription = Subscription(
        user_id=user_id,
        plan_id=plan.id,
        start_date=start_date,
        end_date=end_date,
        auto_renew=data.get('auto_renew', True)
    )
    
    db.session.add(new_subscription)
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription created successfully',
        'subscription': new_subscription.to_dict()
    }), 201

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
    subscription = Subscription.query.filter_by(user_id=user_id, status='active').first()
    
    if not subscription:
        return jsonify({'message': 'No active subscription found!'}), 404
        
    return jsonify(subscription.to_dict())

@app.route('/api/subscriptions/<int:subscription_id>', methods=['PUT'])
@jwt_required()
def update_subscription(subscription_id):
    user_id = get_jwt_identity()
    subscription = Subscription.query.get(subscription_id)
    
    if not subscription:
        return jsonify({'message': 'Subscription not found!'}), 404
        
    # Check if subscription belongs to the user
    if subscription.user_id != user_id:
        return jsonify({'message': 'Unauthorized access!'}), 403
        
    data = request.json
    
    if 'status' in data and data['status'] in ['active', 'paused', 'cancelled']:
        subscription.status = data['status']
    
    if 'auto_renew' in data:
        subscription.auto_renew = data['auto_renew']
        
    if 'plan_id' in data:
        plan = SubscriptionPlan.query.get(data['plan_id'])
        if plan:
            subscription.plan_id = plan.id
            # Recalculate end date
            subscription.end_date = subscription.start_date + timedelta(days=plan.duration_days)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription updated successfully',
        'subscription': subscription.to_dict()
    })

@app.route('/api/subscriptions/<int:subscription_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription(subscription_id):
    user_id = get_jwt_identity()
    subscription = Subscription.query.get(subscription_id)
    
    if not subscription:
        return jsonify({'message': 'Subscription not found!'}), 404
        
    # Check if subscription belongs to the user
    if subscription.user_id != user_id:
        return jsonify({'message': 'Unauthorized access!'}), 403
        
    # Only allow cancellation of active subscriptions
    if subscription.status != 'active':
        return jsonify({'message': 'Cannot cancel subscription that is not active!'}), 400
        
    subscription.status = 'cancelled'
    subscription.auto_renew = False
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription cancelled successfully',
        'subscription': subscription.to_dict()
    })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'subscription-service'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)
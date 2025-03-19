from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import logging
from .models import db
from .routes import product_bp
from .utils.seed_data import seed_initial_data

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Debug route
    @app.route('/')
    def root():
        return {'message': 'Product Service API'}

    # Mock data route for testing
    @app.route('/api/mock/breakfast', methods=['GET'])
    def mock_breakfast():
        return jsonify([
            {
                'id': 1,
                'name': 'Test Breakfast Item 1',
                'description': 'This is a test breakfast item',
                'price': 5.99,
                'inventory_count': 10,
                'image_url': 'breakfast-1.jpg',
                'meal_type': 'breakfast'
            },
            {
                'id': 2,
                'name': 'Test Breakfast Item 2',
                'description': 'This is another test breakfast item',
                'price': 7.99,
                'inventory_count': 5,
                'image_url': 'breakfast-2.jpg',
                'meal_type': 'breakfast'
            }
        ])

    @app.route('/api/mock/lunch', methods=['GET'])
    def mock_lunch():
        return jsonify([
            {
                'id': 1,
                'name': 'Test Lunch Item 1',
                'description': 'This is a test lunch item',
                'price': 8.99,
                'inventory_count': 10,
                'image_url': 'lunch-1.jpg',
                'meal_type': 'lunch'
            },
            {
                'id': 2,
                'name': 'Test Lunch Item 2',
                'description': 'This is another test lunch item',
                'price': 9.99,
                'inventory_count': 5,
                'image_url': 'lunch-2.jpg',
                'meal_type': 'lunch'
            }
        ])

    @app.route('/api/mock/dinner', methods=['GET'])
    def mock_dinner():
        return jsonify([
            {
                'id': 1,
                'name': 'Test Dinner Item 1',
                'description': 'This is a test dinner item',
                'price': 11.99,
                'inventory_count': 10,
                'image_url': 'dinner-1.jpg',
                'meal_type': 'dinner'
            },
            {
                'id': 2,
                'name': 'Test Dinner Item 2',
                'description': 'This is another test dinner item',
                'price': 12.99,
                'inventory_count': 5,
                'image_url': 'dinner-2.jpg',
                'meal_type': 'dinner'
            }
        ])

    # Configure CORS
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80').split(',')
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Database configuration with error handling
    try:
        db_user = os.environ.get('DB_USER', 'root')
        db_password = os.environ.get('DB_PASSWORD', 'password')
        db_host = os.environ.get('DB_HOST', 'mysql')
        db_name = os.environ.get('DB_NAME', 'product_db')
        
        app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{db_user}:{db_password}@{db_host}/{db_name}'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
        
        # Initialize extensions
        db.init_app(app)
        jwt = JWTManager(app)
        
        # Create database tables and seed initial data
        with app.app_context():
            db.create_all()
            seed_initial_data()
            
    except Exception as e:
        logger.error(f"Database configuration error: {str(e)}")
        raise

    # Register blueprints
    app.register_blueprint(product_bp)
    
    # Add route for products by meal type directly to app as a backup
    @app.route('/api/products/meal/<meal_type>', methods=['GET'])
    def get_products_by_meal_backup(meal_type):
        try:
            logger.info(f"Direct endpoint hit: get_products_by_meal_backup for {meal_type}")
            from .models.product import Product
            
            if meal_type not in ['breakfast', 'lunch', 'dinner']:
                return jsonify({'message': 'Invalid meal type!'}), 400
                
            products = Product.query.filter_by(meal_type=meal_type).all()
            result = [product.to_dict() for product in products]
            logger.info(f"Found {len(result)} products for meal type {meal_type}")
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error in get_products_by_meal_backup: {str(e)}")
            return jsonify({'message': 'Error fetching products', 'error': str(e)}), 500
    
    # Print registered routes for debugging
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.rule} {rule.methods}")

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        try:
            # Test database connection
            with app.app_context():
                from sqlalchemy import text
                db.session.execute(text('SELECT 1'))
            return {'status': 'healthy', 'service': 'product-service', 'database': 'connected'}
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {'status': 'unhealthy', 'service': 'product-service', 'error': str(e)}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5003, debug=True) 
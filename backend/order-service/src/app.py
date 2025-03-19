from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models and routes
from .models import db
from .routes import orders_bp

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)

    # Configure CORS
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80').split(',')
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql://root:password@mysql/order_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(orders_bp)
    
    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """
        Health check endpoint
        """
        try:
            # Test database connection
            with app.app_context():
                db.session.execute('SELECT 1')
                
            return {
                'status': 'healthy', 
                'service': 'order-service', 
                'database': 'connected'
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                'status': 'unhealthy', 
                'service': 'order-service', 
                'error': str(e)
            }, 500

    return app

# Run the app if executed directly
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5003, debug=True) 
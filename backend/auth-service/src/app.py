from flask import Flask
from flask_cors import CORS
import os
from .models import db
from .routes import auth_bp
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Configure CORS - Allow all origins in development
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # In production, this should be restricted
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Database configuration with error handling
    try:
        db_user = os.environ.get('DB_USER', 'root')
        db_password = os.environ.get('DB_PASSWORD', 'password')
        db_host = os.environ.get('DB_HOST', 'mysql')
        db_name = os.environ.get('DB_NAME', 'auth_db')
        
        app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{db_user}:{db_password}@{db_host}/{db_name}'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
        
        # Initialize database
        db.init_app(app)
        
        # Create database tables
        with app.app_context():
            db.create_all()
            logger.info("Database tables created successfully")
            
    except Exception as e:
        logger.error(f"Database configuration error: {str(e)}")
        raise

    # Register blueprints
    app.register_blueprint(auth_bp)

    # Health check endpoint with database connection test
    @app.route('/health', methods=['GET'])
    def health_check():
        try:
            # Test database connection
            with app.app_context():
                db.session.execute('SELECT 1')
            return {'status': 'healthy', 'service': 'auth-service', 'database': 'connected'}
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {'status': 'unhealthy', 'service': 'auth-service', 'error': str(e)}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True) 
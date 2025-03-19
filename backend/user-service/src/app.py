from flask import Flask
from flask_cors import CORS
import os
from .models import db
from .routes import user_bp, shipping_bp, payment_bp, dietary_bp
import logging
import pymysql

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Configure CORS
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80').split(',')
    CORS(app, 
         resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

    # Handle OPTIONS requests for CORS preflight
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        return '', 200

    # Database configuration
    db_user = os.environ.get('DB_USER', 'root')
    db_password = os.environ.get('DB_PASSWORD', 'password')
    db_host = os.environ.get('DB_HOST', 'mysql')
    db_name = os.environ.get('DB_NAME', 'user_db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{db_user}:{db_password}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')

    # Initialize database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(shipping_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(dietary_bp)

    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Run database migration for adding date_of_birth column
        try:
            # Connect directly to MySQL to run the migration
            connection = pymysql.connect(
                host=db_host,
                user=db_user,
                password=db_password,
                database=db_name
            )
            
            with connection.cursor() as cursor:
                # Check if the column exists
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'user_profiles' 
                    AND COLUMN_NAME = 'date_of_birth'
                """, (db_name,))
                
                column_exists = cursor.fetchone()[0] > 0
                
                if not column_exists:
                    logger.info("Adding date_of_birth column to user_profiles table...")
                    cursor.execute("""
                        ALTER TABLE user_profiles 
                        ADD COLUMN date_of_birth VARCHAR(20) NULL
                    """)
                    connection.commit()
                    logger.info("date_of_birth column added successfully")
                else:
                    logger.info("date_of_birth column already exists")
            
            connection.close()
            
        except Exception as e:
            logger.error(f"Migration error: {str(e)}")

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        try:
            # Test database connection
            with app.app_context():
                db.session.execute('SELECT 1')
            return {'status': 'healthy', 'service': 'user-service', 'database': 'connected'}
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {'status': 'unhealthy', 'service': 'user-service', 'error': str(e)}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5002, debug=True) 
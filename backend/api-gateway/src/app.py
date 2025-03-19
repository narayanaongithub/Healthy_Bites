from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import requests
import os

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with a more permissive configuration
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost,http://localhost:80,http://127.0.0.1,http://127.0.0.1:80').split(',')
CORS(app, 
     resources={r"/api/*": {"origins": cors_origins}}, 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type"])

# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*' if 'localhost' in request.host else cors_origins
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Service URLs
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'http://auth-service:5001')
USER_SERVICE_URL = os.environ.get('USER_SERVICE_URL', 'http://user-service:5002')
PRODUCT_SERVICE_URL = os.environ.get('PRODUCT_SERVICE_URL', 'http://product-service:5003')
ORDER_SERVICE_URL = os.environ.get('ORDER_SERVICE_URL', 'http://order-service:5004')
SUBSCRIPTION_SERVICE_URL = os.environ.get('SUBSCRIPTION_SERVICE_URL', 'http://subscription-service:5005')

# Handle OPTIONS requests for CORS preflight
@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

# Helper function to forward requests
def forward_request(service_url, path, method='GET', json=None, headers=None):
    url = f"{service_url}{path}"
    headers = headers or {}
    
    app.logger.info(f"Forwarding {method} request to {url}")
    if json:
        app.logger.debug(f"Request payload: {json}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=request.args)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=json)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=json)
        elif method == 'PATCH':
            response = requests.patch(url, headers=headers, json=json)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            return jsonify({'message': 'Unsupported method'}), 405
            
        app.logger.info(f"Response status: {response.status_code}")
        app.logger.debug(f"Response content: {response.text[:500]}")  # Log first 500 chars of response
        
        try:
            # For products-related endpoints, directly return the raw JSON response
            if '/products/' in path:
                app.logger.info(f"Product endpoint: {path}. Returning raw JSON.")
                # Get raw text from response
                raw_text = response.text
                
                # Create a Flask response with the exact same content
                flask_response = make_response(raw_text)
                
                # Set the content type to application/json
                flask_response.headers['Content-Type'] = 'application/json'
                
                # Return the Flask response with the original status code
                return flask_response, response.status_code
            
            # For other endpoints, use the standard JSON handling
            if response.text.strip():  # Check if response has content
                response_json = response.json()
                return response_json, response.status_code
            else:
                # Handle empty response
                return jsonify({'message': 'Empty response from service'}), response.status_code
        except ValueError as json_err:
            app.logger.error(f"JSON decode error: {str(json_err)}")
            app.logger.error(f"Raw response: {response.text[:1000]}")  # Log more of the response for debugging
            
            # If status is 200-299 but invalid JSON, return a 500
            if 200 <= response.status_code < 300:
                return jsonify({'message': 'Invalid JSON response from service', 'raw_response': response.text[:100]}), 500
            else:
                # For error status codes, just return the raw text and status
                return jsonify({'message': response.text}), response.status_code
    except requests.RequestException as e:
        app.logger.error(f"Request error to {url}: {str(e)}")
        return jsonify({'message': 'Service unavailable', 'error': str(e)}), 503

# Routes for Auth Service
@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    app.logger.info("Received registration request")
    try:
        json_data = request.get_json()
        app.logger.info(f"Registration payload: {json_data}")
        
        if not json_data:
            app.logger.error("No JSON data in registration request")
            return jsonify({'message': 'Missing request data'}), 400
            
        if not all(k in json_data for k in ['username', 'email', 'password']):
            app.logger.error("Missing required fields in registration request")
            return jsonify({'message': 'Missing required fields: username, email, password'}), 400
            
        return forward_request(AUTH_SERVICE_URL, '/api/auth/register', 'POST', json_data)
    except Exception as e:
        app.logger.error(f"Error processing registration: {str(e)}")
        return jsonify({'message': 'Error processing registration', 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    return forward_request(AUTH_SERVICE_URL, '/api/auth/login', 'POST', request.json)

@app.route('/api/auth/user', methods=['GET'])
def auth_user():
    return forward_request(AUTH_SERVICE_URL, '/api/auth/user', 'GET', headers=request.headers)

# Routes for User Service
@app.route('/api/users', methods=['GET'])
def get_users():
    return forward_request(USER_SERVICE_URL, '/api/users', 'GET', headers=request.headers)

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/{user_id}', 'GET', headers=request.headers)

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/{user_id}', 'PUT', request.json, request.headers)

@app.route('/api/users/profile', methods=['GET'])
def get_user_profile():
    return forward_request(USER_SERVICE_URL, '/api/users/profile', 'GET', headers=request.headers)

@app.route('/api/users/profile', methods=['PUT'])
def update_user_profile():
    return forward_request(USER_SERVICE_URL, '/api/users/profile', 'PUT', request.json, request.headers)

@app.route('/api/users/profile/simple', methods=['POST'])
def simple_user_profile():
    return forward_request(USER_SERVICE_URL, '/api/users/profile/simple', 'POST', request.json, request.headers)

@app.route('/api/users/password', methods=['PUT'])
def update_user_password():
    return forward_request(USER_SERVICE_URL, '/api/users/password', 'PUT', request.json, request.headers)

# Shipping address routes
@app.route('/api/users/shipping-addresses', methods=['GET'])
def get_shipping_addresses():
    return forward_request(USER_SERVICE_URL, '/api/users/shipping-addresses', 'GET', headers=request.headers)

@app.route('/api/users/shipping-addresses', methods=['POST'])
def add_shipping_address():
    return forward_request(USER_SERVICE_URL, '/api/users/shipping-addresses', 'POST', request.json, request.headers)

@app.route('/api/users/shipping-addresses/<int:address_id>', methods=['GET'])
def get_shipping_address(address_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/shipping-addresses/{address_id}', 'GET', headers=request.headers)

@app.route('/api/users/shipping-addresses/<int:address_id>', methods=['PUT'])
def update_shipping_address(address_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/shipping-addresses/{address_id}', 'PUT', request.json, request.headers)

@app.route('/api/users/shipping-addresses/<int:address_id>', methods=['DELETE'])
def delete_shipping_address(address_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/shipping-addresses/{address_id}', 'DELETE', headers=request.headers)

@app.route('/api/users/shipping-addresses/<int:address_id>/default', methods=['PATCH'])
def set_default_shipping_address(address_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/shipping-addresses/{address_id}/default', 'PATCH', headers=request.headers)

# Payment method routes
@app.route('/api/users/payment-methods', methods=['GET'])
def get_payment_methods():
    return forward_request(USER_SERVICE_URL, '/api/users/payment-methods', 'GET', headers=request.headers)

@app.route('/api/users/payment-methods', methods=['POST'])
def add_payment_method():
    return forward_request(USER_SERVICE_URL, '/api/users/payment-methods', 'POST', request.json, request.headers)

@app.route('/api/users/payment-methods/<int:payment_id>', methods=['GET'])
def get_payment_method(payment_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/payment-methods/{payment_id}', 'GET', headers=request.headers)

@app.route('/api/users/payment-methods/<int:payment_id>', methods=['PUT'])
def update_payment_method(payment_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/payment-methods/{payment_id}', 'PUT', request.json, request.headers)

@app.route('/api/users/payment-methods/<int:payment_id>', methods=['DELETE'])
def delete_payment_method(payment_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/payment-methods/{payment_id}', 'DELETE', headers=request.headers)

@app.route('/api/users/payment-methods/<int:payment_id>/default', methods=['PATCH'])
def set_default_payment_method(payment_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/payment-methods/{payment_id}/default', 'PATCH', headers=request.headers)

# Dietary preference routes
@app.route('/api/users/dietary-preferences', methods=['GET'])
def get_dietary_preferences():
    return forward_request(USER_SERVICE_URL, '/api/users/dietary-preferences', 'GET', headers=request.headers)

@app.route('/api/users/dietary-preferences', methods=['POST'])
def add_dietary_preference():
    return forward_request(USER_SERVICE_URL, '/api/users/dietary-preferences', 'POST', request.json, request.headers)

@app.route('/api/users/dietary-preferences/<int:preference_id>', methods=['GET'])
def get_dietary_preference(preference_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/dietary-preferences/{preference_id}', 'GET', headers=request.headers)

@app.route('/api/users/dietary-preferences/<int:preference_id>', methods=['PUT'])
def update_dietary_preference(preference_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/dietary-preferences/{preference_id}', 'PUT', request.json, request.headers)

@app.route('/api/users/dietary-preferences/<int:preference_id>', methods=['DELETE'])
def delete_dietary_preference(preference_id):
    return forward_request(USER_SERVICE_URL, f'/api/users/dietary-preferences/{preference_id}', 'DELETE', headers=request.headers)

@app.route('/api/users/dietary-preferences/bulk', methods=['POST'])
def add_bulk_dietary_preferences():
    return forward_request(USER_SERVICE_URL, '/api/users/dietary-preferences/bulk', 'POST', request.json, request.headers)

@app.route('/api/users/dietary-preferences/simple', methods=['POST'])
def simple_dietary_preferences():
    return forward_request(USER_SERVICE_URL, '/api/users/dietary-preferences/simple', 'POST', request.json, request.headers)

@app.route('/api/users/preferences', methods=['GET'])
def get_user_preferences():
    return forward_request(USER_SERVICE_URL, '/api/users/preferences', 'GET', headers=request.headers)

@app.route('/api/users/preferences', methods=['POST', 'PUT'])
def update_user_preferences():
    return forward_request(USER_SERVICE_URL, '/api/users/preferences', request.method, request.json, request.headers)

# Routes for Product Service
@app.route('/api/products', methods=['GET'])
def get_products():
    return forward_request(PRODUCT_SERVICE_URL, '/api/products', 'GET')

# Mock endpoint for testing
@app.route('/api/mock/breakfast', methods=['GET'])
def get_mock_breakfast():
    return forward_request(PRODUCT_SERVICE_URL, '/api/mock/breakfast', 'GET')

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    return forward_request(PRODUCT_SERVICE_URL, f'/api/products/{product_id}', 'GET')

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return forward_request(PRODUCT_SERVICE_URL, '/api/categories', 'GET')

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    return forward_request(PRODUCT_SERVICE_URL, f'/api/categories/{category_id}', 'GET')

@app.route('/api/products/meal/<meal_type>', methods=['GET'])
def get_products_by_meal(meal_type):
    return forward_request(PRODUCT_SERVICE_URL, f'/api/products/meal/{meal_type}', 'GET')

@app.route('/api/admin/products', methods=['POST'])
def add_product():
    return forward_request(PRODUCT_SERVICE_URL, '/api/admin/products', 'POST', request.json, request.headers)

@app.route('/api/admin/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    return forward_request(PRODUCT_SERVICE_URL, f'/api/admin/products/{product_id}', 'PUT', request.json, request.headers)

# Routes for Order Service
@app.route('/api/orders', methods=['POST'])
def create_order():
    return forward_request(ORDER_SERVICE_URL, '/api/orders', 'POST', request.json, request.headers)

@app.route('/api/orders', methods=['GET'])
def get_user_orders():
    return forward_request(ORDER_SERVICE_URL, '/api/orders', 'GET', headers=request.headers)

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    return forward_request(ORDER_SERVICE_URL, f'/api/orders/{order_id}', 'GET', headers=request.headers)

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    return forward_request(ORDER_SERVICE_URL, f'/api/orders/{order_id}', 'PUT', request.json, request.headers)

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def cancel_order(order_id):
    return forward_request(ORDER_SERVICE_URL, f'/api/orders/{order_id}', 'DELETE', headers=request.headers)

# Routes for Subscription Service
@app.route('/api/subscription-plans', methods=['GET'])
def get_subscription_plans():
    return forward_request(SUBSCRIPTION_SERVICE_URL, '/api/subscription-plans', 'GET')

@app.route('/api/subscription-plans/<int:plan_id>', methods=['GET'])
def get_subscription_plan(plan_id):
    return forward_request(SUBSCRIPTION_SERVICE_URL, f'/api/subscription-plans/{plan_id}', 'GET')

@app.route('/api/subscriptions', methods=['POST'])
def create_subscription():
    return forward_request(SUBSCRIPTION_SERVICE_URL, '/api/subscriptions', 'POST', request.json, request.headers)

@app.route('/api/subscriptions', methods=['GET'])
def get_user_subscriptions():
    return forward_request(SUBSCRIPTION_SERVICE_URL, '/api/subscriptions', 'GET', headers=request.headers)

@app.route('/api/subscriptions/active', methods=['GET'])
def get_active_subscription():
    return forward_request(SUBSCRIPTION_SERVICE_URL, '/api/subscriptions/active', 'GET', headers=request.headers)

@app.route('/api/subscriptions/<int:subscription_id>', methods=['PUT'])
def update_subscription(subscription_id):
    return forward_request(SUBSCRIPTION_SERVICE_URL, f'/api/subscriptions/{subscription_id}', 'PUT', request.json, request.headers)

@app.route('/api/subscriptions/<int:subscription_id>/cancel', methods=['POST'])
def cancel_subscription(subscription_id):
    return forward_request(SUBSCRIPTION_SERVICE_URL, f'/api/subscriptions/{subscription_id}/cancel', 'POST', headers=request.headers)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    services_status = {}
    
    try:
        auth_response = requests.get(f"{AUTH_SERVICE_URL}/health")
        services_status['auth-service'] = 'healthy' if auth_response.status_code == 200 else 'unhealthy'
    except:
        services_status['auth-service'] = 'unavailable'
        
    try:
        user_response = requests.get(f"{USER_SERVICE_URL}/health")
        services_status['user-service'] = 'healthy' if user_response.status_code == 200 else 'unhealthy'
    except:
        services_status['user-service'] = 'unavailable'
        
    try:
        product_response = requests.get(f"{PRODUCT_SERVICE_URL}/health")
        services_status['product-service'] = 'healthy' if product_response.status_code == 200 else 'unhealthy'
    except:
        services_status['product-service'] = 'unavailable'
        
    try:
        order_response = requests.get(f"{ORDER_SERVICE_URL}/health")
        services_status['order-service'] = 'healthy' if order_response.status_code == 200 else 'unhealthy'
    except:
        services_status['order-service'] = 'unavailable'
        
    try:
        subscription_response = requests.get(f"{SUBSCRIPTION_SERVICE_URL}/health")
        services_status['subscription-service'] = 'healthy' if subscription_response.status_code == 200 else 'unhealthy'
    except:
        services_status['subscription-service'] = 'unavailable'
    
    return jsonify({
        'status': 'healthy',
        'service': 'api-gateway',
        'services': services_status
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 
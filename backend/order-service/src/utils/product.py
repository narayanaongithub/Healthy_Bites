import requests
import os
import logging

# Product service URL
PRODUCT_SERVICE_URL = os.environ.get('PRODUCT_SERVICE_URL', 'http://product-service:5002')

# Set up logging
logger = logging.getLogger(__name__)

def get_product_details(product_id, token=None):
    """
    Fetch product details from the product service
    
    Args:
        product_id: ID of the product to fetch
        token: Optional authentication token
        
    Returns:
        Product details as dict or None if not found
    """
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.get(f'{PRODUCT_SERVICE_URL}/api/products/{product_id}', headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Failed to fetch product {product_id}: Status {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Error fetching product {product_id}: {str(e)}")
    
    return None 
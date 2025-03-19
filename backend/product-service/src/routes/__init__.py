from flask import Blueprint

# Product Blueprint
product_bp = Blueprint('product', __name__, url_prefix='/api') 
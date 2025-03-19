from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import product_bp
from ..models import db
from ..models.product import Product, Category
from ..utils.seed_data import seed_initial_data

# Test route
@product_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({"message": "Product service test route is working"}), 200

# Get all products with filtering options
@product_bp.route('/products', methods=['GET'])
def get_products():
    # Filter parameters
    category_id = request.args.get('category_id', type=int)
    meal_type = request.args.get('meal_type')
    dietary = request.args.get('dietary')
    max_price = request.args.get('max_price', type=float)
    search = request.args.get('search')
    sort = request.args.get('sort', 'popularity')  # Default sort by popularity
    
    query = Product.query
    
    # Apply filters
    if category_id:
        query = query.filter_by(category_id=category_id)
    if meal_type:
        query = query.filter_by(meal_type=meal_type)
    if dietary:
        query = query.filter(Product.dietary_tags.like(f'%{dietary}%'))
    if max_price:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(Product.name.like(f'%{search}%') | Product.description.like(f'%{search}%'))
    
    # Apply sorting
    if sort == 'price-low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price-high':
        query = query.order_by(Product.price.desc())
    elif sort == 'name-asc':
        query = query.order_by(Product.name.asc())
    elif sort == 'name-desc':
        query = query.order_by(Product.name.desc())
    else:  # Default: popularity
        query = query.order_by(Product.popularity.desc())
        
    products = query.all()
    return jsonify([product.to_dict() for product in products])

# Get a specific product by ID
@product_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
        
    return jsonify(product.to_dict())

# Get all categories
@product_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([category.to_dict() for category in categories])

# Get a specific category by ID
@product_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'message': 'Category not found!'}), 404
        
    return jsonify(category.to_dict())

# Get products by meal type
@product_bp.route('/products/meal/<meal_type>', methods=['GET'])
def get_products_by_meal(meal_type):
    if meal_type not in ['breakfast', 'lunch', 'dinner']:
        return jsonify({'message': 'Invalid meal type!'}), 400
        
    products = Product.query.filter_by(meal_type=meal_type).all()
    return jsonify([product.to_dict() for product in products])

# Get popular products
@product_bp.route('/products/popular', methods=['GET'])
def get_popular_products():
    limit = request.args.get('limit', 5, type=int)
    products = Product.query.order_by(Product.popularity.desc()).limit(limit).all()
    return jsonify([product.to_dict() for product in products])

# Get products by dietary preference
@product_bp.route('/products/dietary/<tag>', methods=['GET'])
def get_products_by_dietary(tag):
    products = Product.query.filter(Product.dietary_tags.like(f'%{tag}%')).all()
    return jsonify([product.to_dict() for product in products])

# Admin routes (protected)
@product_bp.route('/admin/products', methods=['POST'])
@jwt_required()
def add_product():
    # In a real app, check if user is admin
    data = request.json
    
    if not data or not data.get('name') or not data.get('price'):
        return jsonify({'message': 'Missing required fields!'}), 400
        
    new_product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        inventory_count=data.get('inventory_count', 0),
        image_url=data.get('image_url', ''),
        category_id=data.get('category_id'),
        meal_type=data.get('meal_type'),
        dietary_tags=','.join(data.get('dietary_tags', [])) if isinstance(data.get('dietary_tags'), list) else data.get('dietary_tags', ''),
        calories=data.get('calories'),
        protein=data.get('protein'),
        fiber=data.get('fiber'),
        popularity=data.get('popularity', 0)
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({
        'message': 'Product added successfully',
        'product': new_product.to_dict()
    }), 201

# Update an existing product
@product_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    # In a real app, check if user is admin
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
        
    data = request.json
    
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        product.price = data['price']
    if 'inventory_count' in data:
        product.inventory_count = data['inventory_count']
    if 'image_url' in data:
        product.image_url = data['image_url']
    if 'category_id' in data:
        product.category_id = data['category_id']
    if 'meal_type' in data:
        product.meal_type = data['meal_type']
    if 'dietary_tags' in data:
        product.dietary_tags = ','.join(data['dietary_tags']) if isinstance(data['dietary_tags'], list) else data['dietary_tags']
    if 'calories' in data:
        product.calories = data['calories']
    if 'protein' in data:
        product.protein = data['protein']
    if 'fiber' in data:
        product.fiber = data['fiber']
    if 'popularity' in data:
        product.popularity = data['popularity']
        
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    })

# Delete a product
@product_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    # In a real app, check if user is admin
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'})

# Update product inventory
@product_bp.route('/admin/products/<int:product_id>/inventory', methods=['PATCH'])
@jwt_required()
def update_inventory(product_id):
    # In a real app, check if user is admin
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
    
    data = request.json
    if 'inventory_count' not in data:
        return jsonify({'message': 'Missing inventory_count field!'}), 400
    
    product.inventory_count = data['inventory_count']
    db.session.commit()
    
    return jsonify({
        'message': 'Inventory updated successfully',
        'product': product.to_dict()
    })

# Add a new category
@product_bp.route('/admin/categories', methods=['POST'])
@jwt_required()
def add_category():
    # In a real app, check if user is admin
    data = request.json
    
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing required fields!'}), 400
    
    new_category = Category(
        name=data['name'],
        description=data.get('description', '')
    )
    
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category added successfully',
        'category': new_category.to_dict()
    }), 201 
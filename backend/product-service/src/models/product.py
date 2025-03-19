from datetime import datetime
from . import db

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    inventory_count = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    meal_type = db.Column(db.String(20))  # breakfast, lunch, dinner
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    dietary_tags = db.Column(db.String(255))  # comma-separated list: vegetarian,vegan,gluten-free
    calories = db.Column(db.Integer)
    protein = db.Column(db.Integer)
    fiber = db.Column(db.Integer)
    popularity = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price is not None else 0.0,  # Ensure price is a float
            'inventory_count': self.inventory_count if self.inventory_count is not None else 0,
            'image_url': self.image_url if self.image_url else f'{self.meal_type}-1.jpg',  # Default image based on meal type
            'category_id': self.category_id,
            'meal_type': self.meal_type,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
        }
        
        # Handle optional fields that might not be in the database schema
        for field in ['dietary_tags', 'calories', 'protein', 'fiber', 'popularity']:
            if hasattr(self, field):
                if field == 'dietary_tags' and getattr(self, field):
                    data[field] = getattr(self, field).split(',')
                else:
                    data[field] = getattr(self, field) if getattr(self, field) is not None else None
                    
        return data
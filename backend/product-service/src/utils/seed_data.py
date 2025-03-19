from ..models import db
from ..models.product import Category, Product

def seed_initial_data():
    """
    Seed the database with initial product data if not already present
    """
    from ..models.product import Product

    # Check if products already exist
    if Product.query.count() > 0:
        print("Products already exist, skipping seed")
        return

    # Add categories if none exist
    if not Category.query.first():
        categories = [
            Category(name="Vegan", description="Plant-based meals"),
            Category(name="Vegetarian", description="Vegetarian-friendly options"),
            Category(name="Protein-Rich", description="High protein meals for fitness enthusiasts"),
            Category(name="Low-Carb", description="Low carbohydrate options"),
            Category(name="Gluten-Free", description="Meals without gluten")
        ]
        db.session.add_all(categories)
        db.session.commit()
        
        # Add products based on the HTML pages
        products = [
            # Breakfast items
            Product(
                name="Vegan Avocado Toast",
                description="Whole grain toast with fresh avocado",
                price=8.99,
                inventory_count=20,
                image_url="breakfast-1.jpg",
                category_id=1,
                meal_type="breakfast",
                dietary_tags="vegan,vegetarian",
                calories=350,
                protein=20,
                fiber=5,
                popularity=80
            ),
            Product(
                name="Protein Breakfast Bowl",
                description="Eggs, quinoa, and vegetables",
                price=10.99,
                inventory_count=15,
                image_url="breakfast-2.jpeg",  # Updated to jpeg
                category_id=3,
                meal_type="breakfast",
                dietary_tags="vegetarian,protein-rich",
                calories=350,
                protein=20,
                fiber=5,
                popularity=80
            ),
            Product(
                name="Breakfast Burrito",
                description="Fill a nutritious wholemeal wrap with lots of healthy breakfast ingredients to make this veggie burrito. We've included protein-rich eggs and avocado to add good fats.",
                price=5.49,
                inventory_count=18,
                image_url="breakfast-3.webp",
                category_id=2,
                meal_type="breakfast",
                dietary_tags="vegetarian",
                calories=0,  # Not provided in HTML
                protein=0,   # Not provided in HTML
                fiber=0,     # Not provided in HTML
                popularity=98  # Converted from rating 4.9/5
            ),
            Product(
                name="Berry Banana Smoothie Bowl",
                description="This vibrant breakfast bowl is packed with nutrients to fuel you through the morning. The mix of fruit, nuts and seeds is designed to power your body.",
                price=6.99,
                inventory_count=25,
                image_url="breakfast-4.webp",
                category_id=1,
                meal_type="breakfast",
                dietary_tags="vegan,vegetarian",
                calories=0,  # Not provided in HTML
                protein=0,   # Not provided in HTML
                fiber=0,     # Not provided in HTML
                popularity=94  # Converted from rating 4.7/5
            ),
            Product(
                name="Protein Pancakes",
                description="These easy healthy pancakes get their fluffy texture from whipped egg whites. They're topped with fresh berries and bananas for a light, sweet breakfast.",
                price=7.49,
                inventory_count=22,
                image_url="breakfast-5.webp",
                category_id=3,
                meal_type="breakfast",
                dietary_tags="vegetarian,protein-rich",
                calories=0,  # Not provided in HTML
                protein=0,   # Not provided in HTML
                fiber=0,     # Not provided in HTML
                popularity=96  # Converted from rating 4.8/5
            ),
            Product(
                name="Chia Pudding",
                description="This easy overnight chia pudding is a healthy breakfast or snack that's loaded with protein, fiber, and healthy fats. It's naturally sweetened, vegan, and gluten-free.",
                price=6.49,
                inventory_count=20,
                image_url="breakfast-6.webp",
                category_id=1,
                meal_type="breakfast",
                dietary_tags="vegan,gluten-free",
                calories=0,  # Not provided in HTML
                protein=0,   # Not provided in HTML
                fiber=0,     # Not provided in HTML
                popularity=92  # Converted from rating 4.6/5
            ),
            
            # Lunch items - using latest images with correct paths
            Product(
                name="Vegetarian Buddha Bowl",
                description="Rice, roasted vegetables, and tahini sauce",
                price=12.99,
                inventory_count=25,
                image_url="lunch-1.jpg",
                category_id=2,
                meal_type="lunch",
                dietary_tags="vegetarian",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=80
            ),
            Product(
                name="Grilled Chicken Salad",
                description="Fresh greens with grilled chicken breast",
                price=11.99,
                inventory_count=18,
                image_url="lunch-2.jpg",
                category_id=4,
                meal_type="lunch",
                dietary_tags="protein-rich,low-carb",
                calories=320,
                protein=28,
                fiber=6,
                popularity=80
            ),
            Product(
                name="Mediterranean Bowl",
                description="Brown rice with falafel, hummus, cucumber, tomato, olives, and tzatziki sauce.",
                price=12.99,
                inventory_count=20,
                image_url="lunch-3.jpg",
                category_id=2,
                meal_type="lunch",
                dietary_tags="vegetarian",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=98  # Converted from rating 4.9/5
            ),
            Product(
                name="Quinoa Power Bowl",
                description="Quinoa, roasted sweet potatoes, black beans, avocado, and cilantro-lime dressing.",
                price=13.49,
                inventory_count=22,
                image_url="lunch-4.jpg",
                category_id=1,
                meal_type="lunch",
                dietary_tags="vegan,gluten-free",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=96  # Converted from rating 4.8/5
            ),
            Product(
                name="Sushi Bowl",
                description="Brown rice, fresh salmon, avocado, cucumber, edamame, and ponzu sauce.",
                price=14.99,
                inventory_count=12,
                image_url="lunch-5.jpg",
                category_id=4,
                meal_type="lunch",
                dietary_tags="protein-rich,low-carb",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=98  # Converted from rating 4.9/5
            ),
            Product(
                name="Vegetable Soup",
                description="Hearty vegetable soup with carrots, celery, tomatoes, and quinoa.",
                price=9.99,
                inventory_count=25,
                image_url="lunch-6.webp",
                category_id=1,
                meal_type="lunch",
                dietary_tags="vegan,gluten-free",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=94  # Converted from rating 4.7/5
            ),
            
            # Dinner Items directly from dinner.html
            Product(
                name="Grilled Salmon",
                description="Wild-caught salmon with roasted asparagus and quinoa pilaf.",
                price=16.99,
                inventory_count=12,
                image_url="dinner-1.jpg",
                category_id=4,
                meal_type="dinner",
                dietary_tags="protein-rich,low-carb",
                calories=480,
                protein=38,
                fiber=7,
                popularity=98  # Converted from rating 4.9/5
            ),
            Product(
                name="Herb Roasted Chicken",
                description="Herb-marinated chicken breast with sweet potato mash and steamed broccoli.",
                price=8.99,
                inventory_count=15,
                image_url="dinner-2.jpg",
                category_id=3,
                meal_type="dinner",
                dietary_tags="protein-rich",
                calories=520,
                protein=42,
                fiber=8,
                popularity=96  # Converted from rating 4.8/5
            ),
            Product(
                name="Vegetable Stir Fry",
                description="Mixed vegetables and tofu stir-fried in ginger-garlic sauce with brown rice.",
                price=7.99,
                inventory_count=20,
                image_url="dinner-3.jpg",
                category_id=1,
                meal_type="dinner",
                dietary_tags="vegan,vegetarian",
                calories=410,
                protein=18,
                fiber=0,     # Not fully visible in the screenshot
                popularity=94  # Converted from rating 4.7/5
            ),
            Product(
                name="Eggplant Parmesan",
                description="Baked eggplant with marinara sauce, mozzarella, and side salad.",
                price=10.99,
                inventory_count=18,
                image_url="dinner-4.webp",
                category_id=2,
                meal_type="dinner",
                dietary_tags="vegetarian",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=96  # Converted from rating 4.8/5
            ),
            Product(
                name="Cauliflower Steak",
                description="Roasted cauliflower steak with chimichurri sauce and quinoa pilaf.",
                price=11.99,
                inventory_count=22,
                image_url="dinner-5.jpg",
                category_id=1,
                meal_type="dinner",
                dietary_tags="vegan,gluten-free",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=94  # Converted from rating 4.7/5
            ),
            Product(
                name="Stuffed Bell Peppers",
                description="Bell peppers stuffed with quinoa, black beans, corn, and tomato sauce.",
                price=9.99,
                inventory_count=20,
                image_url="dinner-6.jpg",
                category_id=1,
                meal_type="dinner",
                dietary_tags="vegan,gluten-free",
                calories=0,  # Not fully visible in the screenshot
                protein=0,   # Not fully visible in the screenshot
                fiber=0,     # Not fully visible in the screenshot
                popularity=96  # Converted from rating 4.8/5
            ),
            # More lunch items with correct image paths
            Product(
                name="Mediterranean Quinoa Salad",
                description="Refreshing salad with quinoa, cucumber, cherry tomatoes, red onion, and feta cheese with lemon-herb dressing.",
                price=8.99,
                inventory_count=12,
                meal_type="lunch",
                image_url="lunch-3.jpg",
                popularity=80
            ),
            Product(
                name="Teriyaki Tofu Stir-fry",
                description="Crispy tofu cubes stir-fried with colorful vegetables in a homemade teriyaki sauce served over brown rice.",
                price=9.49,
                inventory_count=10,
                meal_type="lunch",
                image_url="lunch-4.jpg",
                popularity=80
            ),
            Product(
                name="Southwest Chicken Wrap",
                description="Grilled chicken, black beans, corn, and avocado wrapped in a whole wheat tortilla with chipotle sauce.",
                price=7.99,
                inventory_count=14,
                meal_type="lunch",
                image_url="lunch-5.jpg",
                popularity=80
            ),
            Product(
                name="Superfood Grain Bowl",
                description="Nutrient-dense bowl with mixed grains, roasted sweet potatoes, kale, chickpeas, and tahini dressing.",
                price=10.49,
                inventory_count=8,
                meal_type="lunch",
                image_url="lunch-6.jpg",
                popularity=80
            )
        ]
        db.session.add_all(products)
        db.session.commit()
        print("Initial data seeded successfully!")
    else:
        print("Database already has data, skipping seed.") 
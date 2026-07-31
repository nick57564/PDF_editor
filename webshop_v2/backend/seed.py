"""Seed the database with sample products and categories."""
from database import engine, SessionLocal, Base
import models

CATEGORIES = [
    {"name": "Women's", "slug": "womens", "description": "Elegant clothing for women"},
    {"name": "Men's", "slug": "mens", "description": "Classic clothing for men"},
    {"name": "Footwear", "slug": "footwear", "description": "Premium shoes and boots"},
    {"name": "Accessories", "slug": "accessories", "description": "Bags, belts and more"},
    {"name": "Home & Living", "slug": "home", "description": "Luxury home décor"},
]

PRODUCTS = [
    {"name": "Silk Midi Dress", "slug": "silk-midi-dress", "description": "Effortlessly elegant silk midi dress, perfect for any occasion. Crafted from 100% mulberry silk.", "price": 195.00, "compare_at_price": 240.00, "sku": "WD-001", "stock": 24, "category_slug": "womens", "tags": ["dress", "silk", "new"], "is_featured": True, "is_new": True, "rating": 4.9, "review_count": 87},
    {"name": "Linen Blazer", "slug": "linen-blazer", "description": "Tailored linen blazer with a relaxed fit. Ideal for smart-casual occasions.", "price": 285.00, "compare_at_price": 340.00, "sku": "WB-001", "stock": 15, "category_slug": "womens", "tags": ["blazer", "linen", "sale"], "is_featured": True, "is_new": False, "rating": 4.8, "review_count": 203},
    {"name": "Cashmere Turtleneck", "slug": "cashmere-turtleneck", "description": "Ultra-soft Grade A cashmere turtleneck. Timeless warmth and luxury.", "price": 165.00, "compare_at_price": None, "sku": "WK-001", "stock": 30, "category_slug": "womens", "tags": ["cashmere", "knitwear"], "is_featured": False, "is_new": False, "rating": 5.0, "review_count": 312},
    {"name": "Tailored Wool Suit", "slug": "tailored-wool-suit", "description": "Italian wool two-piece suit. Sharp, modern cut with a natural shoulder.", "price": 545.00, "compare_at_price": 650.00, "sku": "MS-001", "stock": 10, "category_slug": "mens", "tags": ["suit", "wool", "sale"], "is_featured": True, "is_new": False, "rating": 4.9, "review_count": 64},
    {"name": "Oxford Button-Down", "slug": "oxford-button-down", "description": "Classic Oxford cotton shirt. A wardrobe staple in a refined finish.", "price": 95.00, "compare_at_price": None, "sku": "MS-002", "stock": 45, "category_slug": "mens", "tags": ["shirt", "cotton"], "is_featured": False, "is_new": True, "rating": 4.7, "review_count": 156},
    {"name": "Merino Crewneck", "slug": "merino-crewneck", "description": "Fine merino wool crewneck sweater. Naturally breathable and temperature-regulating.", "price": 135.00, "compare_at_price": None, "sku": "MK-001", "stock": 28, "category_slug": "mens", "tags": ["merino", "knitwear"], "is_featured": False, "is_new": False, "rating": 4.8, "review_count": 98},
    {"name": "Leather Chelsea Boots", "slug": "leather-chelsea-boots", "description": "Handcrafted full-grain leather Chelsea boots on a Goodyear-welted sole.", "price": 345.00, "compare_at_price": 420.00, "sku": "FW-001", "stock": 18, "category_slug": "footwear", "tags": ["boots", "leather", "sale"], "is_featured": True, "is_new": False, "rating": 4.9, "review_count": 129},
    {"name": "Suede Loafers", "slug": "suede-loafers", "description": "Premium suede penny loafers with leather lining and rubber sole.", "price": 245.00, "compare_at_price": None, "sku": "FW-002", "stock": 22, "category_slug": "footwear", "tags": ["loafers", "suede"], "is_featured": False, "is_new": True, "rating": 4.7, "review_count": 44},
    {"name": "Structured Leather Tote", "slug": "structured-leather-tote", "description": "Vegetable-tanned leather tote with solid brass hardware and suede lining.", "price": 320.00, "compare_at_price": None, "sku": "AC-001", "stock": 12, "category_slug": "accessories", "tags": ["bag", "leather", "new"], "is_featured": True, "is_new": True, "rating": 4.8, "review_count": 71},
    {"name": "Silk Scarf", "slug": "silk-scarf", "description": "Hand-rolled silk twill scarf in an exclusive Maison print. 90×90 cm.", "price": 125.00, "compare_at_price": 155.00, "sku": "AC-002", "stock": 35, "category_slug": "accessories", "tags": ["scarf", "silk", "sale"], "is_featured": False, "is_new": False, "rating": 4.9, "review_count": 55},
    {"name": "Linen Throw Blanket", "slug": "linen-throw-blanket", "description": "Stonewashed linen throw in a palette of muted earth tones. 140×180 cm.", "price": 89.00, "compare_at_price": None, "sku": "HM-001", "stock": 40, "category_slug": "home", "tags": ["linen", "home", "new"], "is_featured": False, "is_new": True, "rating": 4.6, "review_count": 33},
    {"name": "Ceramic Candle Set", "slug": "ceramic-candle-set", "description": "Set of 3 hand-thrown ceramic candles in our signature Maison fragrance.", "price": 65.00, "compare_at_price": None, "sku": "HM-002", "stock": 50, "category_slug": "home", "tags": ["candle", "ceramic", "home"], "is_featured": False, "is_new": False, "rating": 4.7, "review_count": 28},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing
    db.query(models.Product).delete()
    db.query(models.Category).delete()
    db.commit()

    # Categories
    cat_map = {}
    for c in CATEGORIES:
        cat = models.Category(**c)
        db.add(cat)
        db.flush()
        cat_map[c["slug"]] = cat.id

    # Products
    for p in PRODUCTS:
        data = {k: v for k, v in p.items() if k != "category_slug"}
        data["category_id"] = cat_map[p["category_slug"]]
        data["images"] = []
        prod = models.Product(**data)
        db.add(prod)

    db.commit()
    db.close()
    print(f"✅ Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.")


if __name__ == "__main__":
    seed()

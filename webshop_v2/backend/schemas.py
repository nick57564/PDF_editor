from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Category ──────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ── Product ───────────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    slug: str
    description: str
    price: float
    compare_at_price: Optional[float] = None
    sku: str
    stock: int = 0
    category_id: int
    images: List[str] = []
    tags: List[str] = []
    is_featured: bool = False
    is_new: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    rating: float
    review_count: int
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class ProductListOut(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    pages: int


# ── Cart ──────────────────────────────────────────────────
class CartItem(BaseModel):
    product_id: int
    quantity: int
    price: float
    name: str
    image: Optional[str] = None


class Cart(BaseModel):
    items: List[CartItem]
    subtotal: float
    item_count: int


# ── Order ─────────────────────────────────────────────────
class Address(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: str
    country: str


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: str
    email: str
    name: str
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    shipping_address: Any
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


# ── Stripe / Checkout ─────────────────────────────────────
class CheckoutItem(BaseModel):
    product_id: int
    quantity: int


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    email: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutSessionOut(BaseModel):
    session_id: str
    url: str
    publishable_key: str


class WebhookEvent(BaseModel):
    type: str
    data: Any

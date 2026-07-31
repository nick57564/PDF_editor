from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import math

from database import get_db
import models
import schemas

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=schemas.ProductListOut)
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "created_at_desc",
    db: Session = Depends(get_db),
):
    q = db.query(models.Product).filter(models.Product.is_active == True)

    if category:
        q = q.join(models.Category).filter(models.Category.slug == category)
    if search:
        q = q.filter(or_(
            models.Product.name.ilike(f"%{search}%"),
            models.Product.description.ilike(f"%{search}%"),
        ))
    if featured is not None:
        q = q.filter(models.Product.is_featured == featured)
    if is_new is not None:
        q = q.filter(models.Product.is_new == is_new)
    if min_price is not None:
        q = q.filter(models.Product.price >= min_price)
    if max_price is not None:
        q = q.filter(models.Product.price <= max_price)

    sort_map = {
        "price_asc": models.Product.price.asc(),
        "price_desc": models.Product.price.desc(),
        "rating_desc": models.Product.rating.desc(),
        "created_at_desc": models.Product.created_at.desc(),
        "name_asc": models.Product.name.asc(),
    }
    q = q.order_by(sort_map.get(sort, models.Product.created_at.desc()))

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit),
    }


@router.get("/featured", response_model=list[schemas.ProductOut])
def get_featured(db: Session = Depends(get_db)):
    return db.query(models.Product).filter(
        models.Product.is_featured == True,
        models.Product.is_active == True,
    ).limit(8).all()


@router.get("/{slug}", response_model=schemas.ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.slug == slug,
        models.Product.is_active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

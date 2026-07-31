import stripe
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from config import settings
import models
import schemas

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/payments", tags=["payments"])


def generate_order_number() -> str:
    return f"MSN-{uuid.uuid4().hex[:8].upper()}"


@router.post("/checkout", response_model=schemas.CheckoutSessionOut)
def create_checkout_session(
    body: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payment not configured. Add STRIPE_SECRET_KEY to .env")

    line_items = []
    subtotal = 0.0

    for item in body.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.is_active == True,
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        subtotal += product.price * item.quantity
        line_items.append({
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": product.name,
                    "description": product.description[:100],
                },
                "unit_amount": int(product.price * 100),
            },
            "quantity": item.quantity,
        })

    success_url = body.success_url or f"{settings.frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = body.cancel_url or f"{settings.frontend_url}/cart"

    session = stripe.checkout.Session.create(
        payment_method_types=["card", "ideal", "bancontact"],
        line_items=line_items,
        mode="payment",
        customer_email=body.email,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_items": str([{"id": i.product_id, "qty": i.quantity} for i in body.items])},
        shipping_address_collection={"allowed_countries": ["NL", "BE", "DE", "FR", "GB", "US"]},
        shipping_options=[
            {"shipping_rate_data": {"type": "fixed_amount", "fixed_amount": {"amount": 0, "currency": "eur"}, "display_name": "Free shipping", "delivery_estimate": {"minimum": {"unit": "business_day", "value": 3}, "maximum": {"unit": "business_day", "value": 5}}}},
            {"shipping_rate_data": {"type": "fixed_amount", "fixed_amount": {"amount": 995, "currency": "eur"}, "display_name": "Express (1-2 days)", "delivery_estimate": {"minimum": {"unit": "business_day", "value": 1}, "maximum": {"unit": "business_day", "value": 2}}}},
        ],
    )

    return {
        "session_id": session.id,
        "url": session.url,
        "publishable_key": settings.stripe_publishable_key,
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_successful_payment(session, db)

    return {"status": "ok"}


async def handle_successful_payment(session: dict, db: Session):
    existing = db.query(models.Order).filter(
        models.Order.stripe_session_id == session["id"]
    ).first()
    if existing:
        return

    import ast
    items_meta = ast.literal_eval(session.get("metadata", {}).get("order_items", "[]"))

    shipping = session.get("shipping_details") or {}
    address = shipping.get("address", {})

    order = models.Order(
        order_number=generate_order_number(),
        stripe_session_id=session["id"],
        stripe_payment_intent=session.get("payment_intent"),
        status="paid",
        email=session.get("customer_email", ""),
        name=shipping.get("name", ""),
        subtotal=session["amount_subtotal"] / 100,
        shipping_cost=(session.get("total_details", {}).get("amount_shipping", 0)) / 100,
        tax=(session.get("total_details", {}).get("amount_tax", 0)) / 100,
        total=session["amount_total"] / 100,
        shipping_address={
            "line1": address.get("line1", ""),
            "line2": address.get("line2", ""),
            "city": address.get("city", ""),
            "state": address.get("state", ""),
            "postal_code": address.get("postal_code", ""),
            "country": address.get("country", ""),
        },
    )
    db.add(order)
    db.flush()

    for item in items_meta:
        product = db.query(models.Product).filter(models.Product.id == item["id"]).first()
        if product:
            order_item = models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item["qty"],
                price=product.price,
            )
            db.add(order_item)
            product.stock = max(0, product.stock - item["qty"])

    db.commit()


@router.get("/orders/{order_number}", response_model=schemas.OrderOut)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/session/{session_id}", response_model=schemas.OrderOut)
def get_order_by_session(session_id: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.stripe_session_id == session_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

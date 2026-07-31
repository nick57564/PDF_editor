# Maison — Full-Stack Webshop

A production-ready webshop built with Next.js, FastAPI, and Stripe.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Python FastAPI + SQLAlchemy |
| Database | SQLite (swap for PostgreSQL in production) |
| Payments | Stripe Checkout + Webhooks |
| State | Zustand (cart persistence) |
| Deploy | Docker Compose |

## Quick Start

### 1. Clone & configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edit both `.env` files and add your Stripe keys from https://dashboard.stripe.com/apikeys

### 2. Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Run manually

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

## Stripe Setup

1. Go to https://dashboard.stripe.com
2. Get your **Publishable key** and **Secret key**
3. For webhooks: `stripe listen --forward-to localhost:8000/api/payments/webhook`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## API Endpoints

```
GET  /api/products          List products (filter, sort, paginate)
GET  /api/products/featured Featured products
GET  /api/products/{slug}   Single product
GET  /api/categories        All categories
POST /api/payments/checkout Create Stripe checkout session
POST /api/payments/webhook  Stripe webhook handler
GET  /api/payments/orders/{order_number}
GET  /api/payments/session/{session_id}
```

## Project Structure

```
├── backend/
│   ├── main.py          FastAPI app entry point
│   ├── models.py        SQLAlchemy ORM models
│   ├── schemas.py       Pydantic request/response schemas
│   ├── database.py      DB session setup
│   ├── config.py        Environment settings
│   ├── seed.py          Sample data seeder
│   └── routes/
│       ├── products.py  Product endpoints
│       ├── categories.py Category endpoints
│       └── payments.py  Stripe checkout & webhooks
├── frontend/
│   └── src/
│       ├── app/         Next.js App Router pages
│       ├── components/  Reusable UI components
│       ├── store/       Zustand cart store
│       ├── lib/         API client
│       └── types/       TypeScript interfaces
└── docker-compose.yml
```

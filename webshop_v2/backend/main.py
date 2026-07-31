from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import engine
import models
from routes import products, categories, payments


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables & seed on startup
    models.Base.metadata.create_all(bind=engine)
    from seed import seed
    seed()
    yield


app = FastAPI(
    title="Maison API",
    description="Premium webshop API with Stripe payments",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(payments.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Maison API running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

import axios from "axios";
import type { Category, Product, ProductListResponse, ProductFilters, CheckoutSessionResponse, Order } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Products
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
  const { data } = await api.get("/api/products", { params });
  return data;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await api.get("/api/products/featured");
  return data;
}

export async function getProduct(slug: string): Promise<Product> {
  const { data } = await api.get(`/api/products/${slug}`);
  return data;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get("/api/categories");
  return data;
}

// Checkout
export async function createCheckoutSession(items: { product_id: number; quantity: number }[], email: string): Promise<CheckoutSessionResponse> {
  const { data } = await api.post("/api/payments/checkout", { items, email });
  return data;
}

// Orders
export async function getOrderBySession(sessionId: string): Promise<Order> {
  const { data } = await api.get(`/api/payments/session/${sessionId}`);
  return data;
}

export default api;

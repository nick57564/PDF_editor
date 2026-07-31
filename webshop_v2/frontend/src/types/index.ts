export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  sku: string;
  stock: number;
  category_id: number;
  category?: Category;
  images: string[];
  tags: string[];
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  email: string;
  name: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: Address;
  created_at: string;
  items: OrderItem[];
}

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
  publishable_key: string;
}

export type SortOption = "created_at_desc" | "price_asc" | "price_desc" | "rating_desc" | "name_asc";

export interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  is_new?: boolean;
  min_price?: number;
  max_price?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

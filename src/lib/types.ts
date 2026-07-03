export type StockStatus = "in_stock" | "out_of_stock" | "preorder";
/** Product visibility is a boolean column: true = visible, false = hidden. */
export type Visibility = boolean;
export type OrderStatus = "pending" | "pending_payment" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "paystack_deposit" | "meetup";
export type PaymentStatus = "deposit_paid" | "pending_meetup_payment";
export type MeetupStatus = "awaiting_meetup" | "arranged" | "completed" | "cancelled";
export type UserRole = "customer" | "admin";

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: ProductColor[] | null;
  stock_status: StockStatus;
  featured: boolean;
  new_arrival: boolean;
  sku: string | null;
  category_id: string | null;
  visibility: Visibility;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  image?: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  items: OrderItem[];
  total?: number;
  total_amount: number;
  deposit_amount: number;
  remaining_balance: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  meetup_status: MeetupStatus;
  created_at: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
}

/** Single user source of truth: public.users */
export interface AppUser {
  id: string;
  display_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id?: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  approved?: boolean;
  reviewer_name?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  active: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  message: string;
  image: string | null;
}

export interface HomeText {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  logo_url?: string | null;
  paystack_enabled?: boolean;
}

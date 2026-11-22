export type UserRole = "admin" | "staff";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "resigned";
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_available: boolean;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  order_type: string;
  table_number: string | null;
  total_amount: number;
  payment_method: string;
  status: string;
  payment_status: string;
  order_status: string;
  cashier: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  price?: number;
  subtotal: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalProducts: number;
  totalStaff: number;
  recentOrders: Order[];
}

export interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T;
}
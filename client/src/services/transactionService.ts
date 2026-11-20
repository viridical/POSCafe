import { apiRequest } from "./api";
import type { Order } from "../types";

interface OrderResponse {
  message: string;
  order?: Order;
  order_number?: string;
  snap_token?: string;
  redirect_url?: string;
  qr_string?: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
  total?: number;
}

interface OrdersResponse {
  data?: Order[];
  orders?: Order[];
}

export async function getOrders(): Promise<Order[]> {
  const result = await apiRequest<Order[] | OrdersResponse>("/orders");

  if (Array.isArray(result)) return result;

  return result.data || result.orders || [];
}

export async function createOrder(data: {
  items: { product_id: number; quantity: number }[];
  payment_method: "cash" | "snap" | "qris";
  customer_name?: string;
  order_type: string;
  table_number?: string;
}): Promise<OrderResponse> {
  return apiRequest<OrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrderDetail(orderNumber: string) {
  return apiRequest(`/orders/${encodeURIComponent(orderNumber)}`);
}
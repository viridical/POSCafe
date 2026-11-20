
import { apiRequest } from "./api";
import type { Product } from "../types";

type ListResponse<T> =
  | T[]
  | {
      status?: string;
      data?: T[];
      products?: T[];
    };

function normalizeList<T>(result: ListResponse<T>): T[] {
  if (Array.isArray(result)) return result;
  return result.data ?? result.products ?? [];
}

export async function getProducts(): Promise<Product[]> {
  const result = await apiRequest<ListResponse<Product>>("/products");
  return normalizeList(result);
}

export async function getAdminProducts(): Promise<Product[]> {
  const result = await apiRequest<ListResponse<Product>>("/admin/products");
  return normalizeList(result);
}

export async function createProduct(data: FormData): Promise<void> {
  const token = localStorage.getItem("poscafe_token");

  const response = await fetch("http://localhost:5000/api/admin/products", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Gagal menambahkan produk");
  }
}

export async function updateProduct(
  id: number,
  data: FormData
): Promise<void> {
  const token = localStorage.getItem("poscafe_token");

  const response = await fetch(
    `http://localhost:5000/api/admin/products/${id}`,
    {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Gagal mengubah produk");
  }
}

export async function deleteProduct(id: number): Promise<void> {
  await apiRequest(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

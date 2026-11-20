import { apiRequest } from "./api";
import type { Category } from "../types";

interface CategoryResponse {
  status: string;
  data: Category[];
}


export async function getCategories(): Promise<Category[]> {
  const result = await apiRequest<
    Category[] | { status?: string; data?: Category[]; categories?: Category[] }
  >("/categories");

  if (Array.isArray(result)) return result;

  return result.data ?? result.categories ?? [];
}


export async function createCategory(name: string): Promise<void> {
  await apiRequest("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(
  id: number,
  name: string
): Promise<void> {
  await apiRequest(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await apiRequest(`/categories/${id}`, {
    method: "DELETE",
  });
}
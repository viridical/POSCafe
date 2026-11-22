import { apiRequest } from "./api";
import type { User } from "../types";

interface EmployeeResponse {
  data?: User[];
  staff?: User[];
}

export async function getEmployees(): Promise<User[]> {
  const result = await apiRequest<EmployeeResponse | User[]>("/admin/staff");

  if (Array.isArray(result)) return result;

  return result.data || result.staff || [];
}

export async function createEmployee(data: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff";
}) {
  return apiRequest("/admin/staff", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(
  id: number,
  data: { name?: string; password?: string; status?: "active" | "resigned"; }
) {
  return apiRequest(`/admin/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
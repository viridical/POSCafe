import { apiRequest } from "./api";

export async function getDashboard() {
  return apiRequest("/admin/dashboard");
}

export async function getReports() {
  return apiRequest("/admin/reports");
}
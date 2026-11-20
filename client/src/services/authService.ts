import { apiRequest, setToken, removeToken } from "./api";
import type { User } from "../types";

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<User> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(result.token);
  localStorage.setItem("poscafe_user", JSON.stringify(result.user));

  return result.user;
}

export function getCurrentUser(): User | null {
  const user = localStorage.getItem("poscafe_user");

  if (!user) return null;

  try {
    return JSON.parse(user) as User;
  } catch {
    return null;
  }
}

export function logout(): void {
  removeToken();
  localStorage.removeItem("poscafe_user");
}
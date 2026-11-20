
const API_URL = "http://localhost:5000/api";

export function getToken(): string | null {
  return localStorage.getItem("poscafe_token");
}

export function setToken(token: string): void {
  localStorage.setItem("poscafe_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("poscafe_token");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Request gagal: ${response.status}`);
  }

  return result as T;
}

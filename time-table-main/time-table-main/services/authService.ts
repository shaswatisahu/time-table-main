import { API_BASE_URL } from "./apiBase";

const request = async <T>(path: string, body?: unknown, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Request failed");
  }

  return response.json() as Promise<T>;
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  data: {
    tasks: any[];
    stats: any;
    profileImage?: string | null;
    reminderEnabled?: boolean;
    reminderTone?: string | null;
  };
}

export const login = (email: string, password: string) =>
  request<AuthResponse>("/api/auth/login", { email, password });

export const register = (name: string, email: string, password: string) =>
  request<AuthResponse>("/api/auth/register", { name, email, password });

export const me = (token: string) =>
  request<{ user: AuthUser }>("/api/auth/me", undefined, token);

import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // admin session is an httpOnly cookie
});

// Belt-and-suspenders: also send the token via Authorization if we have it
// (covers cases where third-party cookies are blocked).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || "";
    if (status === 401 && !url.includes("/admin/login")) {
      localStorage.removeItem("admin_token");
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function apiError(error: unknown, fallback = "Something went wrong"): string {
  const e = error as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
  const data = e?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).join(" ");
  return fallback;
}

// ---------- types ----------
export interface Admin {
  id: number;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

export type ProjectStatus = "active" | "inactive" | "pending";

export interface Owner {
  id: number;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  pollus_user_id?: string;
  id_verified?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  client_id: string;
  client_secret?: string;
  web_origins: string[];
  redirect_uris: string[];
  allowed_scopes: string[];
  mcp_webhook_url?: string | null;
  status: ProjectStatus;
  created_at: string;
  user_id: number;
  pollus_user_id?: string | null;
  owner?: Owner | null;
}

export interface Developer {
  id: number;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  pollus_user_id?: string;
  anon_id?: string;
  id_verified?: boolean;
  dob?: string | null;
  created_at?: string;
  project_count?: number;
  projects?: Project[];
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface Stats {
  total_users: number;
  verified_users: number;
  total_projects: number;
  projects_by_status: Record<ProjectStatus, number>;
  pending_projects: number;
  recent_projects_14d: number;
  trend: { date: string; count: number }[];
  scope_usage: Record<string, number>;
  latest_projects: Project[];
}

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
  // Verify usage (from the merged console)
  verify_linked?: boolean;
  balance?: number;
  total_spent?: number;
  verify?: VerifyUsage;
}

export interface VerifyUsage {
  linked: boolean;
  console_user_id?: number;
  balance: number;
  total_spent: number;
  sessions: number;
  projects: { id: number; name: string; api_key_prefix?: string }[];
  features_used: Record<string, number>;
}

// ---------- IdP identities (end-users) ----------
export interface IdpUser {
  id: number;
  full_name?: string | null;
  email?: string | null;
  username?: string | null;
  valyd_id?: string | null;
  id_verified?: boolean;
  country?: string | null;
  is_18_plus?: boolean;
  is_21_plus?: boolean;
  is_65_plus?: boolean;
  is_active?: boolean;
  kyc_status?: string | null;
  created_at?: string;
}

export interface KycProcess {
  id: number; status: string; current_stage?: string; progress?: number;
  ocr_doc_type?: string; face_status?: string; gov_status?: string; zkp_status?: string;
  submitted_at?: string | null; completed_at?: string | null; created_at?: string;
}
export interface HumanVerification { id: number; status: string; method?: string; created_at?: string; }
export interface LicenseVerification {
  id: number; license_type?: string; status: string; external_ref?: string;
  checked_at?: string | null; expire_at?: string | null; created_at?: string;
}
export interface IdpUserDetail extends IdpUser {
  phone?: string | null;
  anon_id?: string | null;
  age_proofs?: Record<string, boolean>;
  pseudonyms?: { name?: string | null; username?: string | null; email?: string | null };
  reverify_required?: boolean;
  kyc_processes?: KycProcess[];
  human_verifications?: HumanVerification[];
  license_verifications?: LicenseVerification[];
}

export interface IdpOverview {
  total_users: number;
  verified_users: number;
  total_developers: number;
  total_projects: number;
  kyc_by_status: Record<string, number>;
  signup_trend: { date: string; count: number }[];
  verify_revenue: number;
  balance_outstanding: number;
  verify_sessions: number;
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

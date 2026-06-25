import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setUnauthorizedHandler, type Admin } from "@/lib/api";

interface AuthState {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/me");
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/admin/login", { email, password });
    if (data.token) localStorage.setItem("admin_token", data.token);
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/admin/logout");
    } catch {
      /* ignore */
    }
    localStorage.removeItem("admin_token");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

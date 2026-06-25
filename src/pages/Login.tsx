import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/40">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Valyd Admin</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
              Developer Portal,
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                under control.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-slate-400">
              Review and approve projects, oversee every developer, and keep the whole
              OAuth ecosystem healthy from one place.
            </p>
          </motion.div>

          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Valyd · Internal use only</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">Valyd Admin</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to the admin console.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@valyd.id"
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

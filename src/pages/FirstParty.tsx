import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShieldCheck, Plus, Loader2, Server, Copy, Check } from "lucide-react";
import { api, apiError, type Project } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { StatusBadge } from "@/components/StatusBadge";
import { ScopeBadges } from "@/components/ScopeBadges";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { CopyField } from "@/components/CopyField";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4";

const toList = (v: string) => v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

/**
 * First-party OIDC clients (dev-web, verify-console, vc-web, …). These are platform-owned:
 * no developer signs up for them, so the admin creates and manages them here rather than
 * having them show up under a synthetic "SSO System" developer.
 */
export default function FirstParty() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", web_origins: "", redirect_uris: "", scopes: "openid, profile" });

  const { data, isLoading } = useQuery({
    queryKey: ["first-party"],
    queryFn: async () => (await api.get("/admin/first-party-projects")).data.projects as Project[],
  });

  const createMut = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/first-party-projects", {
        name: form.name.trim(),
        description: form.description.trim() || null,
        web_origins: toList(form.web_origins),
        redirect_uris: toList(form.redirect_uris),
        allowed_scopes: toList(form.scopes),
      })).data.project as Project,
    onSuccess: (p) => {
      toast.success("First-party project created");
      setOpen(false);
      setForm({ name: "", description: "", web_origins: "", redirect_uris: "", scopes: "openid, profile" });
      setCreated(p); // surface the secret exactly once
      qc.invalidateQueries({ queryKey: ["first-party"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <Loader />;
  const projects = data ?? [];

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">First-party projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Platform-owned OIDC clients. No developer owns these — create and manage them here.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40"
        >
          <Plus className="h-4 w-4" /> New first-party project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No first-party projects" description="Create one to register a platform OIDC client." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <motion.div key={p.id} variants={staggerItem}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400">
                      <Server className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{p.client_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-auto pt-3">
                  <ScopeBadges scopes={p.allowed_scopes} />
                  <p className="mt-2 text-xs text-muted-foreground">Created {formatDate(p.created_at)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create */}
      <Dialog open={open} onOpenChange={(o) => !o && !createMut.isPending && setOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New first-party project</DialogTitle>
            <DialogDescription>
              Registers a platform-owned OIDC client. It is created active — no approval step.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input autoFocus className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. admin-console" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Web origins</label>
              <textarea rows={2} className={inputCls} value={form.web_origins} onChange={(e) => setForm({ ...form, web_origins: e.target.value })} placeholder="https://app.example.com (one per line)" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Redirect URIs</label>
              <textarea rows={2} className={inputCls} value={form.redirect_uris} onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })} placeholder="https://app.example.com/callback (one per line)" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Scopes</label>
              <input className={inputCls} value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} placeholder="openid, profile" />
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setOpen(false)} disabled={createMut.isPending} className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60">
              Cancel
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition disabled:opacity-60"
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create project
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret — shown exactly once */}
      <Dialog open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" /> {created?.name} created
            </DialogTitle>
            <DialogDescription>
              Copy the client secret now — it is shown only once and cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <CopyField label="Client ID" value={created?.client_id ?? ""} />
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Client secret</label>
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{created?.client_secret}</code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(created?.client_secret ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="shrink-0 text-muted-foreground transition hover:text-foreground"
                  aria-label="Copy client secret"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreated(null)} className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90">
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

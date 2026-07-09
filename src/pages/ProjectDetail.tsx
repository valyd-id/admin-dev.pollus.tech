import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Globe,
  Link2,
  Webhook,
  User as UserIcon,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError, type Project, type ProjectStatus } from "@/lib/api";
import { PageTransition } from "@/components/PageTransition";
import { StatusBadge } from "@/components/StatusBadge";
import { ScopeBadges } from "@/components/ScopeBadges";
import { CopyField } from "@/components/CopyField";
import { Loader } from "@/components/Loader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ownerName, formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL_SCOPES = ["profile", "verifications", "doctor_license", "zkp", "mcp"];
const STATUSES: ProjectStatus[] = ["pending", "active", "inactive"];

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Globe; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {children}
    </div>
  );
}

function UriList({ items, empty }: { items: string[]; empty: string }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((u) => (
        <li key={u} className="truncate rounded-lg bg-muted/50 px-3 py-1.5 font-mono text-xs">{u}</li>
      ))}
    </ul>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await api.get(`/admin/projects/${id}`)).data.project as Project,
  });

  const statusMut = useMutation({
    mutationFn: async (next: ProjectStatus) => (await api.patch(`/admin/projects/${id}/status`, { status: next })).data,
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async () => (await api.delete(`/admin/projects/${id}`)).data,
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      navigate("/projects");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !data) return <Loader />;
  const p = data;

  return (
    <PageTransition>
      <Link to="/projects" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-xl font-semibold text-white shadow-lg shadow-sky-500/25">
            {p.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{p.description || "No description provided."}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Status control */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Project status</p>
            <p className="text-xs text-muted-foreground">Approve, deactivate, or send back to pending. Affects whether the client can authenticate.</p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (p.status === s) return;
                  // Deactivating cuts off the client's ability to authenticate — confirm first.
                  if (s === "inactive") setPendingStatus(s);
                  else statusMut.mutate(s);
                }}
                disabled={statusMut.isPending}
                className={cn(
                  "relative rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  p.status === s ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.status === s && (
                  <motion.span
                    layoutId="status-pill"
                    className={cn(
                      "absolute inset-0 rounded-lg",
                      s === "active" ? "bg-emerald-500" : s === "pending" ? "bg-amber-500" : "bg-slate-500"
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {statusMut.isPending && statusMut.variables === s && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Credentials" icon={Link2}>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyField label="Client ID" value={p.client_id} />
              <CopyField label="Client Secret" value={p.client_secret} secret />
            </div>
          </Section>

          <Section title="Allowed scopes" icon={UserIcon}>
            <ScopeBadges scopes={p.allowed_scopes} />
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Web origins" icon={Globe}>
              <UriList items={p.web_origins} empty="No origins registered" />
            </Section>
            <Section title="Redirect URIs" icon={Link2}>
              <UriList items={p.redirect_uris} empty="No redirect URIs" />
            </Section>
          </div>

          {p.allowed_scopes?.includes("mcp") && (
            <Section title="MCP webhook" icon={Webhook}>
              <CopyField label="Webhook URL" value={p.mcp_webhook_url || ""} mono />
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Owner" icon={UserIcon}>
            {p.owner ? (
              <Link to={`/developers/${p.owner.id}`} className="group flex items-center gap-3 rounded-xl p-1 transition hover:bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-semibold text-white">
                  {initials(ownerName(p.owner))}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-sky-600 dark:group-hover:text-sky-400">{ownerName(p.owner)}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.owner.email || "—"}</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Unknown owner</p>
            )}
          </Section>

          <Section title="Metadata" icon={CalendarDays}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Project ID</dt>
                <dd className="font-medium">#{p.id}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-right font-medium">{formatDateTime(p.created_at)}</dd>
              </div>
              {p.pollus_user_id && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Pollus user</dt>
                  <dd className="truncate font-mono text-xs">{p.pollus_user_id}</dd>
                </div>
              )}
            </dl>
          </Section>
        </div>
      </div>

      <EditDialog project={p} open={editOpen} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete project?"
        description={<>This permanently deletes <span className="font-semibold text-foreground">{p.name}</span> and revokes its credentials. This cannot be undone.</>}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={pendingStatus === "inactive"}
        title="Deactivate this project?"
        description={<>Deactivating <span className="font-semibold text-foreground">{p.name}</span> immediately blocks it from authenticating users. You can re-activate it later.</>}
        confirmLabel="Deactivate"
        loading={statusMut.isPending}
        onConfirm={() => statusMut.mutate("inactive", { onSuccess: () => setPendingStatus(null) })}
        onCancel={() => setPendingStatus(null)}
      />
    </PageTransition>
  );
}

// ---------- Edit dialog ----------

function EditDialog({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    web_origins: (project.web_origins || []).join("\n"),
    redirect_uris: (project.redirect_uris || []).join("\n"),
    mcp_webhook_url: project.mcp_webhook_url || "",
    scopes: project.allowed_scopes || [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: project.name,
        description: project.description || "",
        web_origins: (project.web_origins || []).join("\n"),
        redirect_uris: (project.redirect_uris || []).join("\n"),
        mcp_webhook_url: project.mcp_webhook_url || "",
        scopes: project.allowed_scopes || [],
      });
    }
  }, [open, project]);

  const save = useMutation({
    mutationFn: async () => {
      const toList = (v: string) => v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        web_origins: toList(form.web_origins),
        redirect_uris: toList(form.redirect_uris),
        allowed_scopes: form.scopes,
        mcp_webhook_url: form.mcp_webhook_url.trim() || null,
        status: project.status,
      };
      return (await api.put(`/admin/projects/${project.id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("Project updated");
      qc.invalidateQueries({ queryKey: ["project", String(project.id)] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const toggleScope = (s: string) =>
    setForm((f) => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] }));

  const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update the project's configuration. Changes apply immediately.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Scopes</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
                    form.scopes.includes(s)
                      ? "bg-sky-500 text-white ring-sky-500"
                      : "bg-muted text-muted-foreground ring-border hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Web origins <span className="text-muted-foreground">(one per line)</span></label>
            <textarea rows={2} className={cn(inputCls, "font-mono text-xs")} value={form.web_origins} onChange={(e) => setForm({ ...form, web_origins: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Redirect URIs <span className="text-muted-foreground">(one per line)</span></label>
            <textarea rows={2} className={cn(inputCls, "font-mono text-xs")} value={form.redirect_uris} onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })} />
          </div>
          {form.scopes.includes("mcp") && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">MCP webhook URL</label>
              <input className={cn(inputCls, "font-mono text-xs")} value={form.mcp_webhook_url} onChange={(e) => setForm({ ...form, mcp_webhook_url: e.target.value })} />
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Cancel</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


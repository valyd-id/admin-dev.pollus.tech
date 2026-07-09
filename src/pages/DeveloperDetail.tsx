import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Mail, Phone, Fingerprint, CalendarDays, FolderKanban, ShieldCheck, Ban, RotateCcw } from "lucide-react";
import { api, apiError, type Developer } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { StatusBadge } from "@/components/StatusBadge";
import { ScopeBadges } from "@/components/ScopeBadges";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ownerName, initials, formatDate, formatDateTime } from "@/lib/format";

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DeveloperDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["developer", id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data.user as Developer,
  });

  const statusMut = useMutation({
    mutationFn: async (active: boolean) => (await api.patch(`/admin/users/${id}/status`, { active })).data,
    onSuccess: (_res, active) => {
      toast.success(active ? "Developer reactivated" : "Developer deactivated");
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["developer", id] });
      qc.invalidateQueries({ queryKey: ["developers"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !data) return <Loader />;
  const u = data;
  const name = ownerName(u);
  const projects = u.projects || [];
  const active = u.is_active !== false;

  return (
    <PageTransition>
      <Link to="/developers" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to developers
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-2xl font-semibold text-white shadow-lg shadow-sky-500/25">
                {initials(name)}
                {u.id_verified && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-card">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-lg font-semibold">{name}</h1>
              <p className="text-sm text-muted-foreground">{u.email || "No email"}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {u.id_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <BadgeCheck className="h-3 w-3" /> Identity verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Not verified
                  </span>
                )}
                {!active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/20">
                    <Ban className="h-3 w-3" /> Deactivated
                  </span>
                )}
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {active ? <><Ban className="h-4 w-4" /> Deactivate developer</> : <><RotateCcw className="h-4 w-4" /> Reactivate developer</>}
              </button>
            </div>

            <div className="mt-5 divide-y divide-border border-t border-border">
              <InfoRow icon={Mail} label="Email" value={u.email} />
              <InfoRow icon={Phone} label="Phone" value={u.phone_number} />
              <InfoRow icon={Fingerprint} label="Pollus user ID" value={u.pollus_user_id} />
              <InfoRow icon={Fingerprint} label="Anon ID" value={u.anon_id} />
              <InfoRow icon={CalendarDays} label="Joined" value={formatDateTime(u.created_at)} />
            </div>
          </div>

          {/* Verify usage */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Verify usage</div>
            {u.verify?.linked ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Balance</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">${(u.verify.balance ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Total spent</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">${(u.verify.total_spent ?? 0).toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Verify projects</span><span className="font-medium">{u.verify.projects.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Sessions run</span><span className="font-medium">{u.verify.sessions}</span></div>
                </div>
                {Object.keys(u.verify.features_used ?? {}).length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 text-xs text-muted-foreground">Checks used</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(u.verify.features_used).map(([f, c]) => (
                        <span key={f} className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-400">{f} ×{c as number}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not using Verify yet.</p>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Projects <span className="text-muted-foreground">({projects.length})</span>
            </h2>
          </div>

          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects" description="This developer hasn't created any projects yet." />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
              {projects.map((p) => (
                <motion.div key={p.id} variants={staggerItem}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:hover:border-sky-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sm font-semibold text-sky-600 dark:text-sky-400">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{p.client_id}</p>
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <ScopeBadges scopes={p.allowed_scopes} />
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone={active ? "destructive" : "default"}
        title={active ? "Deactivate this developer?" : "Reactivate this developer?"}
        description={
          active ? (
            <>This disables <span className="font-semibold text-foreground">{name}</span>'s portal access and revokes their session. Their account, projects and history are kept and can be reactivated at any time.</>
          ) : (
            <>This restores portal access for <span className="font-semibold text-foreground">{name}</span>.</>
          )
        }
        confirmLabel={active ? "Deactivate" : "Reactivate"}
        loading={statusMut.isPending}
        onConfirm={() => statusMut.mutate(active ? false : true)}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageTransition>
  );
}

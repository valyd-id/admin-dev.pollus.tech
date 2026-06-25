import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Mail, Phone, Fingerprint, CalendarDays, FolderKanban } from "lucide-react";
import { api, type Developer } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { StatusBadge } from "@/components/StatusBadge";
import { ScopeBadges } from "@/components/ScopeBadges";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
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
  const { data, isLoading } = useQuery({
    queryKey: ["developer", id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data.user as Developer,
  });

  if (isLoading || !data) return <Loader />;
  const u = data;
  const name = ownerName(u);
  const projects = u.projects || [];

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
              {u.id_verified ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" /> Identity verified
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Not verified
                </span>
              )}
            </div>

            <div className="mt-5 divide-y divide-border border-t border-border">
              <InfoRow icon={Mail} label="Email" value={u.email} />
              <InfoRow icon={Phone} label="Phone" value={u.phone_number} />
              <InfoRow icon={Fingerprint} label="Pollus user ID" value={u.pollus_user_id} />
              <InfoRow icon={Fingerprint} label="Anon ID" value={u.anon_id} />
              <InfoRow icon={CalendarDays} label="Joined" value={formatDateTime(u.created_at)} />
            </div>
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
    </PageTransition>
  );
}

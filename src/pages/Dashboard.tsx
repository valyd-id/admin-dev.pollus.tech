import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, FolderKanban, Clock, BadgeCheck, ArrowRight, FolderKanban as FK, UserRound, ShieldCheck, DollarSign, Wallet } from "lucide-react";
import { api, type Stats, type IdpOverview } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader } from "@/components/Loader";
import { EmptyState } from "@/components/EmptyState";
import { ownerName, timeAgo } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await api.get("/admin/stats")).data.data as Stats,
  });
}

const STATUS_BARS = [
  { key: "active", label: "Active", color: "bg-emerald-500" },
  { key: "pending", label: "Pending", color: "bg-amber-500" },
  { key: "inactive", label: "Inactive", color: "bg-slate-400" },
] as const;

export default function Dashboard() {
  const { admin } = useAuth();
  const { data, isLoading } = useStats();
  const { data: idp } = useQuery({
    queryKey: ["idp-overview"],
    queryFn: async () => (await api.get("/admin/idp/overview")).data.data as IdpOverview,
  });

  if (isLoading || !data) return <Loader />;

  const totalByStatus =
    data.projects_by_status.active + data.projects_by_status.pending + data.projects_by_status.inactive || 1;
  const scopes = Object.entries(data.scope_usage).sort((a, b) => b[1] - a[1]);
  const maxScope = Math.max(1, ...scopes.map(([, v]) => v));

  return (
    <PageTransition>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{admin?.name ? `, ${admin.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Identity &amp; developer activity across the Valyd platform.</p>
      </div>

      {idp && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Identities" value={idp.total_users} icon={UserRound} accent="sky" hint={`${idp.verified_users} ID-verified`} />
          <StatCard label="Verify sessions" value={idp.verify_sessions} icon={ShieldCheck} accent="violet" hint={`${idp.total_developers} developers`} />
          <StatCard label="Verify revenue" value={`$${idp.verify_revenue.toLocaleString()}`} icon={DollarSign} accent="emerald" hint="total metered spend" />
          <StatCard label="Balance held" value={`$${idp.balance_outstanding.toLocaleString()}`} icon={Wallet} accent="amber" hint="developer wallets" />
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label="Developers" value={data.total_users} icon={Users} accent="sky" hint={`${data.verified_users} verified`} />
        <StatCard label="Projects" value={data.total_projects} icon={FolderKanban} accent="violet" hint={`${data.recent_projects_14d} new in 14d`} />
        <StatCard label="Pending approval" value={data.pending_projects} icon={Clock} accent="amber" hint="awaiting review" />
        <StatCard label="Active projects" value={data.projects_by_status.active} icon={BadgeCheck} accent="emerald" hint="live & usable" />
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">New projects</h2>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                <RTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                />
                <Area type="monotone" dataKey="count" name="Projects" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status breakdown + scopes */}
        <motion.div variants={staggerItem} initial="hidden" animate="show" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Projects by status</h2>
            <div className="space-y-3">
              {STATUS_BARS.map((s) => {
                const v = data.projects_by_status[s.key] || 0;
                const pct = Math.round((v / totalByStatus) * 100);
                return (
                  <div key={s.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={`h-full rounded-full ${s.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {scopes.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold">Scope usage</h2>
              <div className="space-y-2.5">
                {scopes.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground">{name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxScope) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Latest projects */}
      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Latest projects</h2>
          <Link to="/projects" className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {data.latest_projects.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={FK} title="No projects yet" />
          </div>
        ) : (
          <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="divide-y divide-border">
            {data.latest_projects.map((p) => (
              <motion.li key={p.id} variants={staggerItem}>
                <Link to={`/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sm font-semibold text-sky-600 dark:text-sky-400">
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{ownerName(p.owner)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                  <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{timeAgo(p.created_at)}</span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, UserRound, BadgeCheck, ChevronLeft, ChevronRight, Fingerprint } from "lucide-react";
import { api, type IdpUser, type Pagination } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { initials, formatDate } from "@/lib/format";

interface UsersResponse {
  users: IdpUser[];
  pagination: Pagination;
}

const displayName = (u: IdpUser) => u.full_name || u.username || (u.email ? u.email.split("@")[0] : "") || "Anonymous";

const kycTone: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  in_progress: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  declined: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function Users() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  // Search as you type (debounced) — no need to press Enter.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["idp-users", search, page],
    queryFn: async () =>
      (await api.get("/admin/idp/users", { params: { q: search || undefined, page, per_page: 12 } })).data as UsersResponse,
  });

  const submit = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(q); };
  const pag = data?.pagination;

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every Valyd identity — verification & KYC status at a glance.</p>
        </div>
        <form onSubmit={submit} className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, valyd id…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
          />
        </form>
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.users.length === 0 ? (
        <EmptyState icon={UserRound} title="No users found" description="Try a different search term." />
      ) : (
        <motion.div key={`${search}-${page}`} variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.users.map((u) => {
            const name = displayName(u);
            const tone = u.kyc_status ? (kycTone[u.kyc_status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30") : null;
            return (
              <motion.div key={u.id} variants={staggerItem} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Link to={`/users/${u.id}`} className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:hover:border-sky-700">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white">
                      {initials(name)}
                      {u.id_verified && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                          <BadgeCheck className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email || "No email"}</p>
                      {u.username && (
                        <p className="truncate text-xs text-muted-foreground/80">@{u.username}</p>
                      )}
                    </div>
                    {tone && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${tone}`}>{u.kyc_status}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {u.id_verified && <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">ID verified</span>}
                    {u.is_18_plus && <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">18+</span>}
                    {u.is_21_plus && <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">21+</span>}
                    {u.country && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">{u.country}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-mono truncate">
                      <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{u.valyd_id || "—"}</span>
                    </span>
                    <span className="shrink-0">Joined {formatDate(u.created_at)}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {pag && pag.pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {pag.page} of {pag.pages} · {pag.total} users</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isFetching} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.min(pag.pages, p + 1))} disabled={page >= pag.pages || isFetching} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

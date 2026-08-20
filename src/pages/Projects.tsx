import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, FolderKanban, Check, ChevronLeft, ChevronRight, Loader2, User, KeyRound, Clock } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, type Pagination, type Project, type ProjectStatus } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { StatusBadge } from "@/components/StatusBadge";
import { ScopeBadges } from "@/components/ScopeBadges";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { ownerName, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

interface ProjectsResponse {
  projects: Project[];
  pagination: Pagination;
}

export default function Projects() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Search as you type — debounce the input into the query so results update without pressing Enter.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["projects", status, search, page],
    queryFn: async () => {
      const { data } = await api.get("/admin/projects", {
        params: { status: status || undefined, q: search || undefined, page, per_page: 12 },
      });
      return data as ProjectsResponse;
    },
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ id, next }: { id: number; next: ProjectStatus }) =>
      (await api.patch(`/admin/projects/${id}/status`, { status: next })).data,
    onSuccess: (_d, v) => {
      toast.success(`Project ${v.next === "active" ? "approved" : "updated"}`);
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  };

  const pag = data?.pagination;

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Every OAuth project across all developers. Approve, edit, or remove.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setStatus(f.key);
                setPage(1);
              }}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                status === f.key ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status === f.key && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-slate-900 dark:bg-sky-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submitSearch} className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, client_id, owner…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
          />
        </form>
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found" description="Try a different filter or search term." />
      ) : (
        <motion.div
          key={`${status}-${search}-${page}`}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence>
            {data.projects.map((p) => (
              <motion.div
                key={p.id}
                variants={staggerItem}
                layout
                exit={{ opacity: 0, scale: 0.97 }}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-sky-500/40"
              >
                {/* Header: identity + status */}
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/projects/${p.id}`} className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-cyan-500/15 text-sm font-semibold text-sky-600 dark:text-sky-400">
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400">{p.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{p.client_id}</p>
                    </div>
                  </Link>
                  <StatusBadge status={p.status} />
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{ownerName(p.owner)}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.owner?.email || "—"}</p>
                  </div>
                </div>

                {/* Scopes */}
                <div className="flex items-start gap-2">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <ScopeBadges scopes={p.allowed_scopes} />
                </div>

                {/* Footer: created + actions */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {timeAgo(p.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.status === "pending" && (
                      <button
                        onClick={() => setStatusMut.mutate({ id: p.id, next: "active" })}
                        disabled={setStatusMut.isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {setStatusMut.isPending && setStatusMut.variables?.id === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    )}
                    <Link
                      to={`/projects/${p.id}`}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {pag && pag.pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pag.page} of {pag.pages} · {pag.total} projects
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pag.pages, p + 1))}
              disabled={page >= pag.pages || isFetching}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, FolderKanban, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-12 gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <div className="col-span-4">Project</div>
            <div className="col-span-3">Owner</div>
            <div className="col-span-2">Scopes</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <motion.div
            key={`${status}-${search}-${page}`}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-border"
          >
            <AnimatePresence>
              {data.projects.map((p) => (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-12 md:gap-4"
                >
                  <div className="md:col-span-4">
                    <Link to={`/projects/${p.id}`} className="group flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sm font-semibold text-sky-600 dark:text-sky-400">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-sky-600 dark:group-hover:text-sky-400">{p.name}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{p.client_id}</p>
                      </div>
                    </Link>
                  </div>

                  <div className="min-w-0 md:col-span-3">
                    <p className="truncate text-sm">{ownerName(p.owner)}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.owner?.email || "—"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <ScopeBadges scopes={p.allowed_scopes} />
                  </div>

                  <div className="md:col-span-1">
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="flex items-center justify-end gap-2 md:col-span-2">
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

                  <p className="text-xs text-muted-foreground md:hidden">Created {timeAgo(p.created_at)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
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

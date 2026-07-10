import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users, BadgeCheck, ChevronLeft, ChevronRight, FolderKanban } from "lucide-react";
import { api, type Developer, type Pagination } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { ownerName, initials, formatDate } from "@/lib/format";

interface UsersResponse {
  users: Developer[];
  pagination: Pagination;
}

export default function Developers() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["developers", search, page],
    queryFn: async () =>
      (await api.get("/admin/users", { params: { q: search || undefined, page, per_page: 12 } })).data as UsersResponse,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  };

  const pag = data?.pagination;

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Developers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everyone who has signed in to the developer portal.</p>
        </div>
        <form onSubmit={submit} className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, pollus id…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
          />
        </form>
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.users.length === 0 ? (
        <EmptyState icon={Users} title="No developers found" description="Try a different search term." />
      ) : (
        <motion.div
          key={`${search}-${page}`}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {data.users.map((u) => {
            const name = ownerName(u);
            return (
              <motion.div key={u.id} variants={staggerItem} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Link
                  to={`/developers/${u.id}`}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:hover:border-sky-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-semibold text-white">
                      {initials(name)}
                      {u.id_verified && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                          <BadgeCheck className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        {u.is_system && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                            System
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {u.project_count ?? 0} {u.project_count === 1 ? "project" : "projects"}
                    </span>
                    <span>Joined {formatDate(u.created_at)}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {pag && pag.pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pag.page} of {pag.pages} · {pag.total} developers
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

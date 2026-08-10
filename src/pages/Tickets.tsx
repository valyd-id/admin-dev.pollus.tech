import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, LifeBuoy, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Clock, Flag, Tag, UserRound } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  category: string | null;
  priority: string;
  status: "open" | "resolved";
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  user_uuid: string | null;
}

interface TicketsResponse {
  tickets: Ticket[];
  open_count: number;
  pagination: { page: number; per_page: number; total: number; pages: number };
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
] as const;

const priorityTone: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  normal: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function Tickets() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-tickets", search, status, page],
    queryFn: async () =>
      (
        await api.get("/admin/tickets", {
          params: { q: search || undefined, status: status || undefined, page, per_page: 12 },
        })
      ).data as TicketsResponse,
  });

  const resolve = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) =>
      (await api.post(`/admin/tickets/${id}/resolve`, { resolution })).data,
    onSuccess: () => {
      toast.success("Ticket resolved — the user was notified.");
      setResolvingId(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets-summary"] });
    },
    onError: (e) => toast.error(apiError(e, "Could not resolve the ticket")),
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
          <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issues raised by users. Resolve one to notify the reporter.
            {typeof data?.open_count === "number" && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                {data.open_count} open
              </span>
            )}
          </p>
        </div>
        <form onSubmit={submit} className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject, body, reporter…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
          />
        </form>
      </div>

      {/* Status tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setStatus(t.key);
              setPage(1);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              status === t.key ? "bg-sky-500 text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="Nothing to resolve right now." />
      ) : (
        <motion.div
          key={`${search}-${status}-${page}`}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3"
        >
          {data.tickets.map((t) => {
            const isOpen = t.status === "open";
            const reporter = t.user_name || t.user_email || "Unknown user";
            return (
              <motion.div
                key={t.id}
                variants={staggerItem}
                className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${
                  isOpen ? "border-amber-500/25" : "border-border"
                }`}
              >
                {/* Accent strip by status */}
                <div className={`h-1 w-full ${isOpen ? "bg-amber-500/70" : "bg-emerald-500/70"}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Reporter avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-sky-500/15 text-xs font-semibold text-sky-500">
                      {(reporter.slice(0, 2) || "U").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{t.subject}</p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            isOpen
                              ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                              : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {isOpen ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          {isOpen ? "Open" : "Resolved"}
                        </span>
                      </div>
                      {/* Meta chips */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                            priorityTone[t.priority] ?? priorityTone.normal
                          }`}
                        >
                          <Flag className="h-2.5 w-2.5" /> {t.priority}
                        </span>
                        {t.category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" /> {t.category}
                          </span>
                        )}
                      </div>
                      {/* Reporter line */}
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                        <UserRound className="h-3 w-3" />
                        <span className="truncate">{reporter}</span>
                        {t.user_email && t.user_name && <span className="truncate">· {t.user_email}</span>}
                        <span>· Raised {formatDate(t.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm text-foreground/90">{t.body}</p>

                {!isOpen && t.resolution && (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                      Resolution {t.resolved_at ? `· ${formatDate(t.resolved_at)}` : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{t.resolution}</p>
                  </div>
                )}

                {isOpen && (
                  <div className="mt-4 border-t border-border pt-3">
                    {resolvingId === t.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          maxLength={5000}
                          autoFocus
                          placeholder="Resolution note — this is shown to the user in their notification."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setResolvingId(null);
                              setNote("");
                            }}
                            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => resolve.mutate({ id: t.id, resolution: note.trim() })}
                            disabled={!note.trim() || resolve.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {resolve.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Resolve &amp; notify
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingId(t.id);
                          setNote("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Resolve
                      </button>
                    )}
                  </div>
                )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {pag && pag.pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pag.page} of {pag.pages} · {pag.total} tickets
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

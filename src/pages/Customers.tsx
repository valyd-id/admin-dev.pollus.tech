import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Building2, Plus, Loader2, ExternalLink, Wallet, Users as UsersIcon } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTransition, staggerContainer, staggerItem } from "@/components/PageTransition";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/Loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

/** Where the dev console lives (admin "open console as tenant" opens it there). */
// Env-driven per deployment (VITE_DEV_PORTAL_URL); the fallback is the PRODUCTION console so a
// missing var can never route a prod admin to a dev environment.
const DEV_PORTAL_URL = (import.meta.env.VITE_DEV_PORTAL_URL as string) || "https://dev.valyd.id";

type Tenant = {
  id: number;
  name: string;
  domain: string | null;
  seats: number;
  balance: number | null;
  subscription_status: string;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-4";

/**
 * Platform-owned customer tenants (e.g. Cisive). We provision + run these ourselves; they're owned by
 * the durable system account (no personal dev), so deleting a dev never affects them. "Open console"
 * mints a short-lived, org-locked dev token and drops us into the existing dev panel as that tenant.
 */
export default function Customers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [opening, setOpening] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => (await api.get("/admin/tenants")).data.tenants as Tenant[],
  });

  const createMut = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/tenants", {
        name: form.name.trim(),
        ...(form.domain.trim() ? { domain: form.domain.trim() } : {}),
      })).data.tenant,
    onSuccess: () => {
      toast.success("Customer tenant created");
      setOpen(false);
      setForm({ name: "", domain: "" });
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const openConsole = async (t: Tenant) => {
    setOpening(t.id);
    try {
      const { data } = await api.post(`/admin/tenants/${t.id}/console-token`);
      // Hand the short-lived, org-locked token to the dev panel via the hash (kept out of Referer/logs).
      const url = `${DEV_PORTAL_URL.replace(/\/+$/, "")}/enter#t=${encodeURIComponent(data.access_token)}`;
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setOpening(null);
    }
  };

  if (isLoading) return <Loader />;
  const tenants = data ?? [];

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Platform-owned tenants we run (e.g. Cisive). Owned by the system account — safe from dev deletion.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40"
        >
          <Plus className="h-4 w-4" /> New customer
        </button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon={Building2} title="No customers yet" description="Create a platform-owned tenant to provision and run a customer's setup." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tenants.map((t) => (
            <motion.div key={t.id} variants={staggerItem}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      {t.domain && <p className="truncate text-xs text-muted-foreground">{t.domain}</p>}
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                    {t.subscription_status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><UsersIcon className="h-3.5 w-3.5" /> {t.seats} seat{t.seats === 1 ? "" : "s"}</div>
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> {t.balance == null ? "—" : `$${t.balance.toFixed(2)}`}</div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Created {formatDate(t.created_at)}</p>
                    <button
                      onClick={() => openConsole(t)}
                      disabled={opening === t.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                    >
                      {opening === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                      Open console
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && !createMut.isPending && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New customer tenant</DialogTitle>
            <DialogDescription>
              Creates a platform-owned organization + billing account. Add apps afterwards via "Open console".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Customer name</label>
              <input autoFocus className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cisive" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Domain (optional)</label>
              <input className={inputCls} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. cisive.com" />
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
              Create customer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

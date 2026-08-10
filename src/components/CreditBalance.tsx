import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";

/**
 * Admin-only balance credit — the ONLY way funds are added (developer self-serve top-up is
 * disabled by policy). Targets either a developer's personal wallet or an organization's.
 */
export function CreditBalance({
  target,
  onDone,
}: {
  target: { developer_id?: number; organization_id?: number };
  onDone?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const mut = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/billing/credit", { ...target, amount: Number(amount) })).data,
    onSuccess: (d) => {
      toast.success(`Credited $${Number(d.credited).toFixed(2)} — balance now $${Number(d.balance).toFixed(2)}`);
      setAmount("");
      onDone?.();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const valid = Number(amount) > 0;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" /> Credit balance (admin only)
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (USD)"
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-sky-500/50"
        />
        <button
          onClick={() => valid && mut.mutate()}
          disabled={!valid || mut.isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Credit
        </button>
      </div>
    </div>
  );
}

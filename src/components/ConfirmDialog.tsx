import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type ConfirmTone = "destructive" | "default";

/**
 * Reusable confirmation dialog for critical actions. Every destructive or
 * hard-to-reverse admin action (delete, deactivate, revoke, status change)
 * must route through this so the admin explicitly confirms intent.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "destructive",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmCls =
    tone === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : "bg-sky-600 text-white hover:bg-sky-500";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tone === "destructive" && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmCls}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

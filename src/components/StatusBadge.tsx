import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/api";

const MAP: Record<ProjectStatus, { label: string; cls: string; dot: string }> = {
  active: {
    label: "Active",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  inactive: {
    label: "Inactive",
    cls: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const m = MAP[status] ?? MAP.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        m.cls,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot, status === "pending" && "animate-pulse")} />
      {m.label}
    </span>
  );
}

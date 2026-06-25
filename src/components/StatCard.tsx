import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerItem } from "@/components/PageTransition";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "sky",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  accent?: "sky" | "emerald" | "amber" | "violet";
}) {
  const accents: Record<string, string> = {
    sky: "from-sky-500 to-cyan-500 shadow-sky-500/25",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/25",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/25",
    violet: "from-violet-500 to-fuchsia-500 shadow-violet-500/25",
  };
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

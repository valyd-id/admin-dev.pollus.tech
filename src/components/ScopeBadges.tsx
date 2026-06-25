import { cn } from "@/lib/utils";

const SCOPE_STYLE: Record<string, string> = {
  profile: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300",
  verifications: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300",
  doctor_license: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300",
  zkp: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  mcp: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300",
};

export function ScopeBadges({ scopes, className }: { scopes?: string[]; className?: string }) {
  if (!scopes || scopes.length === 0) {
    return <span className="text-xs text-muted-foreground">No scopes</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {scopes.map((s) => (
        <span
          key={s}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            SCOPE_STYLE[s] ?? "bg-muted text-muted-foreground ring-border"
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

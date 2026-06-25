import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CopyField({
  label,
  value,
  secret = false,
  mono = true,
}: {
  label: string;
  value?: string | null;
  secret?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  const display = value ? (revealed ? value : "•".repeat(Math.min(value.length, 32))) : "—";

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <code className={cn("flex-1 truncate text-sm", mono && "font-mono")}>{display}</code>
        {secret && value && (
          <button
            onClick={() => setRevealed((r) => !r)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={copy}
          disabled={!value}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-40"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

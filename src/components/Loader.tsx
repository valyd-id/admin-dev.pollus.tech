import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ full, className }: { full?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-muted-foreground",
        full ? "min-h-screen" : "py-16",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
    </div>
  );
}

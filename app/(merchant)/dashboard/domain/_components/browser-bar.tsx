import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Safari-style window chrome showing how the store's address reads —
 * the hero of the domain page (placeholder until the merchant types).
 */
export function BrowserBar({ host, placeholder, secure, className }: { host?: string; placeholder?: string; secure?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("w-full max-w-md overflow-hidden rounded-[14px] bg-(--fill-3) p-2.5 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.06)]", className)}>
      <div className="flex items-center gap-3" dir="ltr">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-card px-3 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <Lock className={cn("size-3 shrink-0", secure ? "text-foreground/70" : "text-(--label-3)")} strokeWidth={2.5} />
          <span className={cn("truncate font-medium", !host && "text-(--label-3)")}>{host || placeholder}</span>
        </span>
        <span className="w-[42px] shrink-0" />
      </div>
    </div>
  );
}

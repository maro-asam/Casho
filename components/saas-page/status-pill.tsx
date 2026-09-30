import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const TONES: Record<PillTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  info: { pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  success: { pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  warning: { pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  danger: { pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  accent: { pill: "bg-violet-500/10 text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
};

/** The only status/badge style on SaaS pages. Always text + color, never color alone. */
export function StatusPill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        TONES[tone].pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", TONES[tone].dot)} />
      {children}
    </span>
  );
}

export function toneDot(tone: PillTone) {
  return TONES[tone].dot;
}

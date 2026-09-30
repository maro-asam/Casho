import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DeltaBadge from "../../_components/overview/DeltaBadge";
import { percentChange } from "../../_components/overview/format";
import type { Delta } from "../_lib/types";

/** Card with a titled header — the one surface every report block uses. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 rounded-xl py-0 shadow-none", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

/** KPI tile: label (with optional definition tooltip), value, change vs previous period. */
export function Stat({
  label,
  value,
  delta,
  format,
  hint,
  sub,
  invert,
  icon: Icon,
}: {
  label: string;
  value?: ReactNode;
  delta?: Delta;
  format?: (v: number) => string;
  /** How the number is calculated — shown on hover. */
  hint?: string;
  sub?: ReactNode;
  invert?: boolean;
  icon?: LucideIcon;
}) {
  const shown = value ?? (delta && format ? format(delta.current) : "—");

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        {hint ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger className="cursor-help truncate underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
                {label}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 text-xs leading-5" dir="rtl">
                {hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </div>
      <p className="truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{shown}</p>
      <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {delta && <DeltaBadge value={percentChange(delta.current, delta.previous)} invert={invert} />}
        {delta && format && <span className="truncate">قبلها {format(delta.previous)}</span>}
        {sub}
      </div>
    </div>
  );
}

/** Horizontal share bar used in breakdown lists. */
export function ShareBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function EmptyNote({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Thumb({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn("relative size-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted", className)}>
      <Image src={src || "/images/product-placeholder.png"} alt="" fill sizes="36px" className="object-cover" />
    </span>
  );
}

/** Compact table shell matching the SaaS page table style. */
export function ReportTable({ head, children, className }: { head: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-xl text-sm">
        <thead>
          <tr className="h-10 border-b border-border bg-muted/40 text-xs text-muted-foreground [&>th]:px-3 [&>th]:text-start [&>th]:font-medium [&>th:first-child]:ps-5 [&>th:last-child]:pe-5">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-border [&_td]:px-3 [&_td]:py-2.5 [&_td:first-child]:ps-5 [&_td:last-child]:pe-5">
          {children}
        </tbody>
      </table>
    </div>
  );
}

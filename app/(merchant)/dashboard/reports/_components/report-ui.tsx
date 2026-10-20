import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, type LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DeltaBadge from "../../_components/overview/DeltaBadge";
import { percentChange } from "../../_components/overview/format";
import type { Delta } from "../_lib/types";
import { tdir, tr } from "@/lib/i18n/dashboard";

/** Opaque content card with a Headline title — the one surface every report block uses. */
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
    <section className={cn("apple-card overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[17px] leading-[22px] font-semibold ltr:tracking-[-0.01em]">{title}</h2>
          {description && <p className="text-[13px] leading-[18px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("px-5 pb-5", contentClassName)}>{children}</div>
    </section>
  );
}

/** Plain tinted text action for a panel header ("الورديات ›"). */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="apple-press -me-2 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ChevronLeft className="size-4 ltr:-scale-x-100" />
    </Link>
  );
}

/** KPI tile: label (with optional definition tooltip), large value, change vs previous period. */
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
    <div className="apple-card flex min-w-0 flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.8} />}
          {hint ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger className="cursor-help truncate underline decoration-(--label-3) decoration-dotted underline-offset-4">
                  {label}
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 rounded-xl text-[12px] leading-5" dir={tdir()}>
                  {hint}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="truncate">{label}</span>
          )}
        </div>
        {delta && <DeltaBadge value={percentChange(delta.current, delta.previous)} invert={invert} className="shrink-0" />}
      </div>
      <p className="truncate text-[22px] leading-7 font-bold tabular-nums ltr:tracking-[-0.02em] sm:text-[28px] sm:leading-[34px]">{shown}</p>
      <div className="flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
        {delta && format && <span className="truncate">{tr("قبلها {0}", format(delta.previous))}</span>}
        {sub}
      </div>
    </div>
  );
}

/** Horizontal share bar used in breakdown lists (one hue: magnitude). */
export function ShareBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-(--ease-apple)"
        style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
      />
    </div>
  );
}

/** Inline note inside a panel (info / warning), text stays in the label color. */
export function Note({ icon: Icon, tone = "info", children }: { icon: LucideIcon; tone?: "info" | "warning"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] leading-5",
        tone === "warning" ? "bg-(--sys-orange)/12 text-foreground/85" : "bg-background text-muted-foreground",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "warning" && "text-(--sys-orange)")} />
      <span>{children}</span>
    </p>
  );
}

export function EmptyNote({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-background px-4 py-10 text-center">
      <Icon className="mb-1 size-8 text-(--label-3)" strokeWidth={1.5} />
      <p className="text-[17px] font-semibold">{title}</p>
      {description && <p className="max-w-sm text-[13px] leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Thumb({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn("relative size-10 shrink-0 overflow-hidden rounded-[10px] bg-muted", className)}>
      <Image src={src || "/images/product-placeholder.png"} alt="" fill sizes="40px" className="object-cover" />
    </span>
  );
}

/** List-view table: caption-size header, inset hairlines between rows. */
export function ReportTable({ head, children, className }: { head: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-xl border-separate border-spacing-0 text-[15px]">
        <thead>
          <tr className="text-[12px] text-muted-foreground [&>th]:h-8 [&>th]:px-3 [&>th]:pb-2 [&>th]:text-start [&>th]:align-bottom [&>th]:font-medium [&>th]:whitespace-nowrap [&>th:first-child]:ps-5 [&>th:last-child]:pe-5">
            {head}
          </tr>
        </thead>
        <tbody className="[&_td]:border-t-[0.5px] [&_td]:border-border [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:ps-5 [&_td:last-child]:pe-5 [&>tr]:transition-colors [&>tr:hover]:bg-muted/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}

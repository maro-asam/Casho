import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Small server-safe building blocks shared by admin pages, on the shell's
// `.apple-ui` tokens: opaque cards on the grouped background, Settings-style
// rows, quiet table headers. List pages use `@/components/saas-page` (apple-kit).

export type Kpi = {
  label: string;
  value: ReactNode;
  /** One short line under the value (comparison, breakdown…). */
  hint?: ReactNode;
  icon?: LucideIcon;
  href?: string;
};

/** Summary tiles: one opaque card per figure, the number carries the hierarchy. */
export function KpiStrip({ items, className }: { items: Kpi[]; className?: string }) {
  return (
    <section
      aria-label="المؤشرات"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        items.length >= 4 ? "xl:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "",
        className,
      )}
    >
      {items.map((kpi) => {
        const Icon = kpi.icon;
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                {Icon && <Icon className="size-[15px] shrink-0" strokeWidth={1.8} />}
                {kpi.label}
              </p>
              {kpi.href && <ChevronLeft className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />}
            </div>
            <p className="text-[28px] leading-[34px] font-bold tabular-nums">{kpi.value}</p>
            {kpi.hint && <p className="text-[13px] leading-[18px] text-muted-foreground">{kpi.hint}</p>}
          </>
        );
        const tile = "apple-card flex flex-col gap-1.5 px-5 py-4";
        return kpi.href ? (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={cn(tile, "apple-press hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
          >
            {body}
          </Link>
        ) : (
          <div key={kpi.label} className={tile}>
            {body}
          </div>
        );
      })}
    </section>
  );
}

/** Titled card. `flush` removes body padding for tables/lists. */
export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("apple-card overflow-hidden", className)}>
      <div className="flex flex-col gap-2 px-5 pt-5 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[17px] leading-[22px] font-semibold">{title}</h2>
          {description && <p className="text-[13px] leading-[18px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={flush ? "pb-2" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

/** Label / value rows (Settings style): label leading, value trailing, inset hairlines. */
export function Fields({ rows }: { rows: { label: string; value: ReactNode; ltr?: boolean }[] }) {
  return (
    <dl className="apple-rows text-[15px] [--row-inset:0px]">
      {rows.map((row) => (
        <div key={row.label} className="flex min-h-11 items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 wrap-break-word text-end" dir={row.ltr ? "ltr" : undefined}>
            {row.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Back navigation: tinted chevron + parent title, like a navigation bar back button. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="apple-press -ms-1.5 inline-flex h-9 items-center gap-0.5 rounded-full ps-1 pe-3 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight className="size-5" strokeWidth={2.2} />
      {children}
    </Link>
  );
}

/** Empty line inside a Panel. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-[15px] text-muted-foreground">{children}</p>;
}

/** Quiet table header: secondary label, no fill, one hairline (tables read as grouped lists). */
export const th = "h-9 text-[13px] font-medium text-muted-foreground";
export const theadRow = "border-b-[0.5px] border-border text-right";

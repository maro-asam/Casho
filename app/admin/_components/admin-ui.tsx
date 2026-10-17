import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Small server-safe building blocks shared by admin pages. List pages use
// `@/components/saas-page`; these cover overview/detail layouts.

export type Kpi = {
  label: string;
  value: ReactNode;
  /** One short line under the value (comparison, breakdown…). */
  hint?: ReactNode;
  icon?: LucideIcon;
  href?: string;
};

/** Hairline-separated KPI row, same anatomy as the merchant overview. */
export function KpiStrip({ items, className }: { items: Kpi[]; className?: string }) {
  return (
    <section
      aria-label="المؤشرات"
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2",
        items.length >= 4 ? "xl:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "",
        className,
      )}
    >
      {items.map((kpi) => {
        const Icon = kpi.icon;
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              {Icon && <Icon className="size-4 text-muted-foreground/70" />}
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{kpi.value}</p>
            {kpi.hint && <p className="text-xs text-muted-foreground">{kpi.hint}</p>}
          </>
        );
        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href} className="flex flex-col gap-2 bg-card p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            {body}
          </Link>
        ) : (
          <div key={kpi.label} className="flex flex-col gap-2 bg-card p-5">
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
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={flush ? undefined : "p-4"}>{children}</div>
    </section>
  );
}

/** Label / value rows for side panels. */
export function Fields({ rows }: { rows: { label: string; value: ReactNode; ltr?: boolean }[] }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 wrap-break-word text-end font-medium" dir={row.ltr ? "ltr" : undefined}>
            {row.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowRight className="size-3.5" />
      {children}
    </Link>
  );
}

/** Empty line inside a Panel. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Shared table look (saas-page rule 7). */
export const th = "h-10 text-xs font-medium text-muted-foreground";
export const theadRow = "bg-muted/40 text-right";

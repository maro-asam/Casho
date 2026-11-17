import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";

// Small server-safe pieces shared by the Analytics Center pages.

/** Card with a headline, optional ⓘ definition and trailing actions. */
export function Section({
  title,
  subtitle,
  info,
  actions,
  children,
  className,
  flush,
}: {
  title: string;
  subtitle?: ReactNode;
  info?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No body padding (lists, tables). */
  flush?: boolean;
}) {
  return (
    <section className={cn("apple-card overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[17px] leading-[22px] font-semibold">{title}</h2>
            {info && <InfoTip title={title}>{info}</InfoTip>}
          </div>
          {subtitle && <p className="text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={flush ? "" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

/** Quiet table chrome (grouped-list look). Wrap in a horizontally scrollable box on phones. */
export function DataTable({ head, children, minWidth = 640 }: { head: ReactNode[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-[14px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b-[0.5px] border-border text-right">
            {head.map((h, i) => (
              <th key={i} scope="col" className={cn("h-9 px-3 text-[12px] font-medium whitespace-nowrap text-muted-foreground first:ps-5 last:pe-5", i > 0 && "text-end")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-b-[0.5px] [&_tr]:border-border/60 [&_tr:last-child]:border-0 [&_td]:h-11 [&_td]:px-3 [&_td:first-child]:ps-5 [&_td:last-child]:pe-5 [&_td:not(:first-child)]:text-end [&_td:not(:first-child)]:tabular-nums">
          {children}
        </tbody>
      </table>
    </div>
  );
}

/** One line of quiet explanation under a section (definitions, data caveats). */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[12px] leading-[17px] text-muted-foreground", className)}>{children}</p>;
}

/** Big number + label, for small stat rows inside cards. */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="text-[20px] leading-[25px] font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

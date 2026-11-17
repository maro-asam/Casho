import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpLeft, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { pctChange } from "@/lib/analytics/metrics";
import { fmtPct } from "../_lib/format";
import { InfoTip } from "./info-tip";

export type KpiSpec = {
  id: string;
  label: string;
  /** Formatted current value. */
  value: string;
  /** Raw numbers for the delta (null = not applicable). */
  current: number | null;
  previous: number | null;
  /** Which direction is good — bounce rate goes down, signups go up. */
  better?: "up" | "down";
  spark?: number[];
  /** How it is calculated (shown in the ⓘ popover). */
  definition: ReactNode;
  hint?: ReactNode;
};

/** Single-series sparkline: 2px line, a 10 % wash under it, no axes. */
export function Sparkline({ values, label, className }: { values: number[]; label: string; className?: string }) {
  const w = 120;
  const h = 32;
  if (values.length < 2 || values.every((v) => v === 0)) {
    return <div className={cn("h-8", className)} aria-hidden />;
  }
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full overflow-visible", className)} role="img" aria-label={label}>
      <title>{label}</title>
      <path d={area} fill="var(--viz-1)" opacity={0.1} />
      <path d={line} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** "+١٢٪" with an arrow; green/red only when the direction is known to be good/bad. Never color alone. */
export function Delta({ current, previous, better = "up", compareLabel }: { current: number | null; previous: number | null; better?: "up" | "down"; compareLabel: string }) {
  const change = pctChange(current, previous);
  if (previous === null) return null;
  if (change === null) {
    return <span className="text-[12px] text-muted-foreground">جديد · {compareLabel}</span>;
  }
  const flat = Math.abs(change) < 0.005;
  const up = change > 0;
  const good = flat ? null : better === "up" ? up : !up;
  const Icon = flat ? Minus : up ? ArrowUpLeft : ArrowDownLeft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
        good === null ? "text-muted-foreground" : good ? "text-(--sys-green)" : "text-(--sys-red)",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      <span>
        {up && !flat ? "+" : ""}
        {fmtPct(change)}
      </span>
      <span className="font-normal text-muted-foreground">{compareLabel}</span>
    </span>
  );
}

export function KpiTile({ kpi, compareLabel }: { kpi: KpiSpec; compareLabel: string }) {
  return (
    <div className="apple-card flex min-w-0 flex-col gap-1 px-5 pt-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] leading-[18px] text-muted-foreground">{kpi.label}</p>
        <InfoTip title={kpi.label}>{kpi.definition}</InfoTip>
      </div>
      <p className="truncate text-[26px] leading-[32px] font-bold tabular-nums">{kpi.value}</p>
      <div className="min-h-[18px]">
        {kpi.hint ?? <Delta current={kpi.current} previous={kpi.previous} better={kpi.better} compareLabel={compareLabel} />}
      </div>
      {kpi.spark && <Sparkline values={kpi.spark} label={`${kpi.label} على مدار الفترة`} className="mt-1" />}
    </div>
  );
}

export function KpiGrid({ items, compareLabel, className }: { items: KpiSpec[]; compareLabel: string; className?: string }) {
  return (
    <section aria-label="المؤشرات" className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {items.map((kpi) => (
        <KpiTile key={kpi.id} kpi={kpi} compareLabel={compareLabel} />
      ))}
    </section>
  );
}

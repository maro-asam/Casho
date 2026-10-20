import type { Kpi, OverviewData } from "./overview-data";
import DeltaBadge from "./DeltaBadge";
import { formatMoney, formatNumber, formatPercent, percentChange } from "./format";
import { tr } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";

function Sparkline({ values, id, className }: { values: number[]; id: string; className?: string }) {
  const W = 120;
  const H = 36;
  const max = Math.max(...values, 0);
  if (max === 0) {
    return <div className={cn("h-9 w-full border-b border-dashed border-border", className)} aria-hidden />;
  }

  const step = W / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - (v / max) * (H - 6)).toFixed(1)}`);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-9 w-full text-primary", className)}
      // Time runs left→right even in RTL, matching the main chart.
      style={{ direction: "ltr" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.14} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${points.join(" ")} ${W},${H}`} fill={`url(#spark-${id})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCell({
  id,
  label,
  kpi,
  format,
  hint,
  featured = false,
}: {
  id: string;
  /** The headline metric: filled with the primary color. */
  featured?: boolean;
  label: string;
  kpi: Kpi;
  format: (value: number) => string;
  hint: string;
}) {
  return (
    <div
      className={cn(
        "apple-card flex min-w-0 flex-col gap-3 p-5",
        featured && "bg-linear-to-b from-primary/90 to-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.2)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("truncate text-[13px] font-semibold", featured ? "text-primary-foreground/75" : "text-muted-foreground")}>
          {label}
        </p>
        <DeltaBadge
          value={percentChange(kpi.current, kpi.previous)}
          className={featured ? "bg-white/20 text-white dark:text-white" : undefined}
        />
      </div>
      <p className="truncate text-[28px] leading-[34px] font-bold tracking-[-0.02em] tabular-nums">{format(kpi.current)}</p>
      <Sparkline values={kpi.series} id={id} className={featured ? "border-white/30 text-white" : undefined} />
      <p className={cn("truncate text-[12px]", featured ? "text-primary-foreground/70" : "text-muted-foreground")}>
        {hint}:{" "}
        <span className={cn("tabular-nums", featured ? "text-primary-foreground" : "text-foreground/70")}>
          {format(kpi.previous)}
        </span>
      </p>
    </div>
  );
}

export default function KpiGrid({ kpis }: { kpis: OverviewData["kpis"] }) {
  const hint = tr("الـ٣٠ يوم اللي قبلها");

  return (
    <section
      aria-label={tr("المؤشرات الرئيسية")}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:*:last:col-span-2 xl:*:last:col-span-1"
    >
      <KpiCell id="revenue" label={tr("الإيرادات")} kpi={kpis.revenue} format={formatMoney} hint={hint} featured />
      <KpiCell id="orders" label={tr("الطلبات")} kpi={kpis.orders} format={formatNumber} hint={hint} />
      <KpiCell id="visits" label={tr("الزيارات")} kpi={kpis.visits} format={formatNumber} hint={hint} />
      <KpiCell id="conversion" label={tr("معدل التحويل")} kpi={kpis.conversion} format={formatPercent} hint={hint} />
      <KpiCell id="aov" label={tr("متوسط قيمة الطلب")} kpi={kpis.aov} format={formatMoney} hint={hint} />
    </section>
  );
}

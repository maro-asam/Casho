import type { Kpi, OverviewData } from "./overview-data";
import DeltaBadge from "./DeltaBadge";
import { formatMoney, formatNumber, formatPercent, percentChange } from "./format";

function Sparkline({ values }: { values: number[] }) {
  const W = 120;
  const H = 32;
  const max = Math.max(...values, 0);
  if (max === 0) {
    return <div className="h-8 w-full border-b border-dashed border-border" aria-hidden />;
  }

  const step = W / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-8 w-full text-primary"
      // Time runs left→right even in RTL, matching the main chart.
      style={{ direction: "ltr" }}
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiCell({
  label,
  kpi,
  format,
  hint,
}: {
  label: string;
  kpi: Kpi;
  format: (value: number) => string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <DeltaBadge value={percentChange(kpi.current, kpi.previous)} />
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{format(kpi.current)}</p>
      <Sparkline values={kpi.series} />
      <p className="text-xs text-muted-foreground">
        {hint}: <span className="font-medium tabular-nums text-foreground/80">{format(kpi.previous)}</span>
      </p>
    </div>
  );
}

export default function KpiGrid({ kpis }: { kpis: OverviewData["kpis"] }) {
  const hint = "الـ٣٠ يوم اللي قبلها";

  return (
    <section
      aria-label="المؤشرات الرئيسية"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:[&>:last-child]:col-span-2 xl:[&>:last-child]:col-span-1"
    >
      <KpiCell label="الإيرادات" kpi={kpis.revenue} format={formatMoney} hint={hint} />
      <KpiCell label="الطلبات" kpi={kpis.orders} format={formatNumber} hint={hint} />
      <KpiCell label="الزيارات" kpi={kpis.visits} format={formatNumber} hint={hint} />
      <KpiCell label="معدل التحويل" kpi={kpis.conversion} format={formatPercent} hint={hint} />
      <KpiCell label="متوسط قيمة الطلب" kpi={kpis.aov} format={formatMoney} hint={hint} />
    </section>
  );
}

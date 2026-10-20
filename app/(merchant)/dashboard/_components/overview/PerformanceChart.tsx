"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DailyPoint } from "./overview-data";
import DeltaBadge from "./DeltaBadge";
import { formatMoney, formatNumber, percentChange } from "./format";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

type Metric = "revenue" | "orders" | "visits";

const METRICS: Record<Metric, { label: string; format: (v: number) => string; axis: (v: number) => string }> = {
  revenue: {
    get label() { return tr("الإيرادات"); },
    format: formatMoney,
    axis: (v) => new Intl.NumberFormat(intlLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(v / 100),
  },
  orders: { get label() { return tr("الطلبات"); }, format: formatNumber, axis: formatNumber },
  visits: { get label() { return tr("الزيارات"); }, format: formatNumber, axis: formatNumber },
};

function ChartTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string;
  metric: Metric;
}) {
  if (!active || !payload?.length) return null;
  const { label: metricLabel, format } = METRICS[metric];

  return (
    <div className="apple-glass rounded-xl px-3 py-2 text-start">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
        {metricLabel}: {format(Number(payload[0].value ?? 0))}
      </p>
    </div>
  );
}

export default function PerformanceChart({
  data,
  previousTotals,
}: {
  data: DailyPoint[];
  previousTotals: Record<Metric, number>;
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const config = METRICS[metric];
  const total = data.reduce((sum, point) => sum + point[metric], 0);
  const hasData = data.some((p) => p.revenue > 0 || p.orders > 0 || p.visits > 0);

  return (
    <section className="apple-card h-full">
      <div className="flex flex-col gap-4 p-5 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-[17px] leading-[22px] font-semibold">{tr("الأداء")}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[34px] leading-[41px] font-bold tracking-[-0.02em] tabular-nums">{config.format(total)}</span>
            <DeltaBadge value={percentChange(total, previousTotals[metric])} />
          </div>
          <p className="text-[13px] text-muted-foreground">{tr("{0} · آخر ٣٠ يوم", config.label)}</p>
        </div>

        {/* Segmented control: equal-width segments, white thumb on a gray track. */}
        <div
          role="radiogroup"
          aria-label={tr("المؤشر")}
          dir={tdir()}
          className="grid shrink-0 grid-cols-3 rounded-[9px] bg-muted p-0.5"
        >
          {(Object.keys(METRICS) as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={metric === key}
              onClick={() => setMetric(key)}
              className={cn(
                "h-8 min-w-20 rounded-[7px] px-3 text-[13px] transition-[background-color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                metric === key
                  ? "bg-card font-semibold shadow-[0_3px_8px_rgba(0,0,0,.12),0_3px_1px_rgba(0,0,0,.04)] dark:bg-[#636366]"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              {METRICS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 pt-2">
        {hasData ? (
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="overview-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={28}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                  tickFormatter={(v) => config.axis(Number(v))}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltip metric={metric} />}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--primary)"
                  strokeWidth={2.25}
                  fill="url(#overview-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-2xl bg-background text-center">
            <LineChart className="size-7 text-(--label-3)" strokeWidth={1.6} />
            <p className="text-[17px] font-semibold">{tr("لسه مفيش بيانات في آخر ٣٠ يوم")}</p>
            <p className="max-w-xs text-[13px] leading-5 text-muted-foreground">
              {tr("أول ما يوصلك زيارات وطلبات، هتشوف أداء متجرك يوم بيوم هنا.")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

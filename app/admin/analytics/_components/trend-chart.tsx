"use client";

import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import { SegmentedButtons, Unavailable } from "@/components/saas-page";

export type TrendMetric = {
  key: string;
  label: string;
  /** "count" | "pct" | "ms" | "money" — how values are formatted. */
  format: "count" | "pct" | "ms" | "money";
  current: (number | null)[];
  previous: (number | null)[] | null;
};

const nf = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });

function format(kind: TrendMetric["format"], v: number | null, axis = false) {
  if (v === null || !Number.isFinite(v)) return "—";
  if (kind === "pct") return pct.format(v);
  if (kind === "ms") return `${nf.format(Math.round(v / 1000))} ث`;
  if (kind === "money") return axis ? compact.format(v / 100) : money.format(v / 100);
  return axis && Math.abs(v) >= 10_000 ? compact.format(v) : nf.format(v);
}

type Row = { label: string; prevLabel?: string; current: number | null; previous: number | null };

function ChartTooltip({ active, payload, metric }: { active?: boolean; payload?: { payload: Row }[]; metric: TrendMetric }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="min-w-40 rounded-xl bg-popover px-3 py-2 text-right text-[13px] shadow-[0_10px_40px_rgba(0,0,0,0.14),0_0_0_0.5px_var(--border)]" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden className="h-0.5 w-3 rounded-full bg-(--viz-1)" />
          {row.label}
        </span>
        <span className="font-semibold tabular-nums">{format(metric.format, row.current)}</span>
      </div>
      {metric.previous && (
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden className="h-0 w-3 border-t-2 border-dashed border-(--viz-prev)" />
            {row.prevLabel ?? "قبلها"}
          </span>
          <span className="tabular-nums text-muted-foreground">{format(metric.format, row.previous)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The period's trend for one metric at a time, with the previous period as a
 * dashed gray line (same x position = same day of the period).
 */
export function TrendChart({ labels, prevLabels, metrics, title }: { labels: string[]; prevLabels: string[]; metrics: TrendMetric[]; title: string }) {
  const [key, setKey] = useState(metrics[0]?.key ?? "");
  const metric = metrics.find((m) => m.key === key) ?? metrics[0];
  const data: Row[] = labels.map((label, i) => ({ label, prevLabel: prevLabels[i], current: metric?.current[i] ?? null, previous: metric?.previous?.[i] ?? null }));
  if (!metric) return null;
  const hasData = metric.current.some((v) => v !== null && v !== 0) || (metric.previous ?? []).some((v) => v !== null && v !== 0);
  const total =
    metric.format === "count" || metric.format === "money" ? metric.current.reduce<number>((s, v) => s + (v ?? 0), 0) : null;

  return (
    <section className="apple-card overflow-hidden">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[13px] font-semibold text-muted-foreground">{title}</h2>
          {total !== null && <p className="text-[28px] leading-[34px] font-bold tabular-nums">{format(metric.format, total)}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded-full bg-(--viz-1)" />
              الفترة دي
            </span>
            {metric.previous && (
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="w-4 border-t-2 border-dashed border-(--viz-prev)" />
                فترة المقارنة
              </span>
            )}
          </div>
        </div>
        <SegmentedButtons
          label="المؤشر"
          value={metric.key}
          onChange={setKey}
          options={metrics.map((m) => [m.key, m.label] as const)}
          className="max-w-full self-start overflow-x-auto [scrollbar-width:none]"
        />
      </div>
      <div className="px-2 pt-3 pb-4 sm:px-4">
        {hasData ? (
          <div className="h-64 w-full sm:h-72" dir="ltr" role="img" aria-label={`${metric.label} على مدار الفترة`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={24}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={metric.format === "pct"}
                  domain={[0, "auto"]}
                  tickFormatter={(v) => format(metric.format, Number(v), true)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                {metric.previous && (
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--viz-prev)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="var(--viz-1)"
                  strokeWidth={2}
                  fill="var(--viz-1)"
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--viz-1)" }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Unavailable icon={LineChart} title="مفيش بيانات للفترة دي" description="أول ما الزوار يوصلوا هتظهر الأرقام هنا." className="h-64" />
        )}
      </div>
    </section>
  );
}

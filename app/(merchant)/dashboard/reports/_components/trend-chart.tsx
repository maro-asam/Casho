"use client";

import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import DeltaBadge from "../../_components/overview/DeltaBadge";
import { formatMoney, formatNumber, percentChange } from "../../_components/overview/format";
import type { SeriesPoint } from "../_lib/types";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

type Metric = "netSales" | "profit" | "orders" | "visitors";
const PREV: Record<Metric, keyof SeriesPoint> = {
  netSales: "prevNetSales",
  profit: "prevProfit",
  orders: "prevOrders",
  visitors: "prevVisitors",
};

const compact = lazyIntl.number({ notation: "compact", maximumFractionDigits: 1 });

const METRICS: Record<Metric, { label: string; format: (v: number) => string; axis: (v: number) => string }> = {
  netSales: { get label() { return tr("صافي المبيعات"); }, format: formatMoney, axis: (v) => compact.format(v / 100) },
  profit: { get label() { return tr("الربح"); }, format: formatMoney, axis: (v) => compact.format(v / 100) },
  orders: { get label() { return tr("الطلبات"); }, format: formatNumber, axis: formatNumber },
  visitors: { get label() { return tr("الزوار"); }, format: formatNumber, axis: formatNumber },
};

type TooltipProps = {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number | string }[];
  label?: string;
  metric: Metric;
};

function ChartTooltip({ active, payload, label, metric }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { format } = METRICS[metric];
  const current = payload.find((p) => p.dataKey === metric)?.value;
  const previous = payload.find((p) => p.dataKey === PREV[metric])?.value;

  return (
    <div className="apple-glass min-w-44 rounded-xl px-3 py-2 text-start" dir={tdir()}>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center justify-between gap-4 text-[13px]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-3 rounded-full bg-primary" />{tr("الفترة دي")}
        </span>
        <span className="text-[15px] font-semibold tabular-nums">{format(Number(current ?? 0))}</span>
      </p>
      {previous !== undefined && (
        <p className="mt-0.5 flex items-center justify-between gap-4 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-3 border-t-2 border-dashed border-(--sys-gray)" />{tr("اللي قبلها")}
          </span>
          <span className="tabular-nums">{format(Number(previous))}</span>
        </p>
      )}
    </div>
  );
}

export function TrendChart({ series, previousLabel }: { series: SeriesPoint[]; previousLabel: string }) {
  const [metric, setMetric] = useState<Metric>("netSales");
  const config = METRICS[metric];
  const total = series.reduce((s, p) => s + p[metric], 0);
  const prevTotal = series.reduce((s, p) => s + Number(p[PREV[metric]]), 0);
  const hasData = series.some((p) => p.orders > 0 || p.visitors > 0 || p.prevOrders > 0);

  return (
    <section className="apple-card">
      <div className="flex flex-col gap-4 p-5 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-[17px] leading-[22px] font-semibold">{tr("{0} على مدار الفترة", config.label)}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[34px] leading-[41px] font-bold tabular-nums ltr:tracking-[-0.02em]">{config.format(total)}</span>
            <DeltaBadge value={percentChange(total, prevTotal)} />
          </div>
          {/* Legend: two series, so identity is never color/dash alone. */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded-full bg-primary" />
              {tr("الفترة دي")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="w-4 border-t-2 border-dashed border-(--sys-gray)" />
              {previousLabel} <span className="tabular-nums">({config.format(prevTotal)})</span>
            </li>
          </ul>
        </div>

        {/* Segmented control: white thumb on a gray track. */}
        <div role="radiogroup" aria-label={tr("المؤشر")} dir={tdir()} className="flex max-w-full shrink-0 overflow-x-auto rounded-full bg-(--sys-gray)/14 p-[3px] [scrollbar-width:none]">
          {(Object.keys(METRICS) as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={metric === key}
              onClick={() => setMetric(key)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3.5 text-[13px] transition-[background-color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                metric === key
                  ? "bg-card font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                  : "text-foreground/70 hover:text-foreground",
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
              <ComposedChart data={series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="reports-area" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={24}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={false}
                  tickFormatter={(v) => config.axis(Number(v))}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey={PREV[metric]}
                  stroke="var(--sys-gray)"
                  strokeOpacity={0.7}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--primary)"
                  strokeWidth={2.25}
                  fill="url(#reports-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-2xl bg-background text-center">
            <LineChart className="size-7 text-(--label-3)" strokeWidth={1.6} />
            <p className="text-[17px] font-semibold">{tr("مفيش مبيعات ولا زيارات في الفترة دي")}</p>
            <p className="max-w-xs text-[13px] leading-5 text-muted-foreground">{tr("جرّب فترة أطول من فوق.")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

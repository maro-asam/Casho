"use client";

import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeltaBadge from "../../_components/overview/DeltaBadge";
import { formatMoney, formatNumber, percentChange } from "../../_components/overview/format";
import type { SeriesPoint } from "../_lib/types";

type Metric = "netSales" | "profit" | "orders" | "visitors";
const PREV: Record<Metric, keyof SeriesPoint> = {
  netSales: "prevNetSales",
  profit: "prevProfit",
  orders: "prevOrders",
  visitors: "prevVisitors",
};

const compact = new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 });

const METRICS: Record<Metric, { label: string; format: (v: number) => string; axis: (v: number) => string }> = {
  netSales: { label: "صافي المبيعات", format: formatMoney, axis: (v) => compact.format(v / 100) },
  profit: { label: "الربح", format: formatMoney, axis: (v) => compact.format(v / 100) },
  orders: { label: "الطلبات", format: formatNumber, axis: formatNumber },
  visitors: { label: "الزوار", format: formatNumber, axis: formatNumber },
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
    <div className="min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-right text-xs shadow-md" dir="rtl">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" /> الفترة دي
        </span>
        <span className="font-semibold tabular-nums">{format(Number(current ?? 0))}</span>
      </p>
      {previous !== undefined && (
        <p className="mt-0.5 flex items-center justify-between gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/50" /> اللي قبلها
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
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{config.label} على مدار الفترة</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{config.format(total)}</span>
            <DeltaBadge value={percentChange(total, prevTotal)} />
          </div>
          <p className="text-xs text-muted-foreground">
            الخط المتقطع = {previousLabel} ({config.format(prevTotal)})
          </p>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)} dir="rtl">
          <TabsList>
            {(Object.keys(METRICS) as Metric[]).map((key) => (
              <TabsTrigger key={key} value={key} className="px-3 text-xs">
                {METRICS[key].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-5">
        {hasData ? (
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="reports-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  allowDecimals={false}
                  tickFormatter={(v) => config.axis(Number(v))}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey={PREV[metric]}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.5}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#reports-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <LineChart className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">مفيش مبيعات ولا زيارات في الفترة دي</p>
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">جرّب فترة أطول من فوق.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

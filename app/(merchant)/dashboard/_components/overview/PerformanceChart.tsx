"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-start shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
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
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{tr("الأداء")}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{config.format(total)}</span>
            <DeltaBadge value={percentChange(total, previousTotals[metric])} />
          </div>
          <p className="text-xs text-muted-foreground">{tr("{0} · آخر ٣٠ يوم", config.label)}</p>
        </div>

        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)} dir={tdir()}>
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
              <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="overview-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
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
                  strokeWidth={2}
                  fill="url(#overview-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <LineChart className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">{tr("لسه مفيش بيانات في آخر ٣٠ يوم")}</p>
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">
              {tr("أول ما يوصلك زيارات وطلبات، هتشوف أداء متجرك يوم بيوم هنا.")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

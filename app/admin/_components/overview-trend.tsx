"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtMoney, fmtMoneyCompact, fmtNum } from "../_lib/format";
import type { MonthPoint } from "../_lib/overview-data";

type Metric = "subscriptions" | "profit" | "topups" | "newStores";

const METRICS: Record<Metric, { label: string; format: (v: number) => string; axis: (v: number) => string; note: string }> = {
  subscriptions: { label: "إيراد الاشتراكات", format: fmtMoney, axis: fmtMoneyCompact, note: "خصومات الاشتراك ناقص المرتجع" },
  profit: { label: "صافي الربح", format: fmtMoney, axis: fmtMoneyCompact, note: "الإيراد ناقص عمولات فريق المبيعات" },
  topups: { label: "شحن الرصيد", format: fmtMoney, axis: fmtMoneyCompact, note: "كل الشحنات اللي دخلت أرصدة المتاجر" },
  newStores: { label: "متاجر جديدة", format: fmtNum, axis: fmtNum, note: "متاجر اتعملت في الشهر" },
};

function ChartTooltip({ active, payload, label, metric }: { active?: boolean; payload?: { value?: number }[]; label?: string; metric: Metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-32 rounded-lg border border-border bg-popover px-3 py-2 text-right text-xs shadow-md" dir="rtl">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{METRICS[metric].format(Number(payload[0].value ?? 0))}</p>
    </div>
  );
}

export function OverviewTrend({ months }: { months: MonthPoint[] }) {
  const [metric, setMetric] = useState<Metric>("subscriptions");
  const config = METRICS[metric];
  const total = months.reduce((s, m) => s + m[metric], 0);
  const hasData = months.some((m) => m[metric] !== 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{config.label} — آخر ١٢ شهر</h2>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{config.format(total)}</p>
          <p className="text-xs text-muted-foreground">{config.note}</p>
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
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="h-72 w-full" dir="ltr" role="img" aria-label={`${config.label} شهريًا`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-trend-area" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={16}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  allowDecimals={false}
                  domain={[(min: number) => Math.min(0, min), "auto"]} // keep 0 in view; profit can dip below it
                  tickFormatter={(v) => config.axis(Number(v))}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#admin-trend-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <LineChart className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">مفيش بيانات للمؤشر ده لسه</p>
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">أول ما يحصل نشاط هيظهر هنا شهر بشهر.</p>
          </div>
        )}
      </div>
    </section>
  );
}

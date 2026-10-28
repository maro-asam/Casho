"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { SegmentedButtons, Unavailable } from "@/components/saas-page";
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
    <div className="min-w-32 rounded-xl bg-popover px-3 py-2 text-right text-[13px] shadow-[0_10px_40px_rgba(0,0,0,0.14),0_0_0_0.5px_var(--border)]" dir="rtl">
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
    <section className="apple-card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-[13px] font-semibold text-muted-foreground">{config.label} — آخر ١٢ شهر</h2>
          <p className="text-[34px] leading-[41px] font-bold tabular-nums">{config.format(total)}</p>
          <p className="text-[13px] text-muted-foreground">{config.note}</p>
        </div>
        <SegmentedButtons
          label="المؤشر"
          value={metric}
          onChange={setMetric}
          options={(Object.keys(METRICS) as Metric[]).map((key) => [key, METRICS[key].label] as const)}
          className="max-w-full self-start overflow-x-auto [scrollbar-width:none]"
        />
      </div>

      <div className="px-3 pt-4 pb-4 sm:px-5">
        {hasData ? (
          <div className="h-72 w-full" dir="ltr" role="img" aria-label={`${config.label} شهريًا`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-trend-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
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
                  strokeWidth={2.5}
                  fill="url(#admin-trend-area)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Unavailable icon={LineChart} title="مفيش بيانات للمؤشر ده لسه" description="أول ما يحصل نشاط هيظهر هنا شهر بشهر." className="h-72" />
        )}
      </div>
    </section>
  );
}

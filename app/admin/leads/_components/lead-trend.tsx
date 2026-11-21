"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import { SegmentedButtons, Unavailable } from "@/components/saas-page";

type Point = { period: string; added: number; converted: number; lost: number };
type Metric = "added" | "converted" | "lost";

const METRICS: Record<Metric, { label: string; note: string }> = {
  added: { label: "ليدز جديدة", note: "اتضافت يدوي أو من ملف (المحذوفة مش محسوبة)" },
  converted: { label: "تحويلات", note: "ليدز دفع أصحابها أول اشتراك — بتاريخ الدفع" },
  lost: { label: "خسارة", note: "ليدز اتقفلت خسارة — بتاريخ القفل" },
};

const nf = new Intl.NumberFormat("ar-EG");

function label(period: string, unit: string) {
  const d = new Date(`${period}T12:00:00Z`);
  return new Intl.DateTimeFormat("ar-EG", unit === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }).format(d);
}

function ChartTooltip({ active, payload, label: l, metric }: { active?: boolean; payload?: { value?: number }[]; label?: string; metric: Metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-28 rounded-xl bg-popover px-3 py-2 text-right text-[13px] shadow-[0_10px_40px_rgba(0,0,0,0.14),0_0_0_0.5px_var(--border)]" dir="rtl">
      <p className="text-muted-foreground">{l}</p>
      <p className="mt-1 font-semibold tabular-nums">
        {nf.format(Number(payload[0].value ?? 0))} {METRICS[metric].label}
      </p>
    </div>
  );
}

/** One metric at a time — one series, one axis, the title names it. Counts per period are discrete, so bars. */
export function LeadTrend({ points, unit, rangeControl }: { points: Point[]; unit: string; rangeControl: React.ReactNode }) {
  const [metric, setMetric] = useState<Metric>("added");
  const data = points.map((p) => ({ ...p, label: label(p.period, unit) }));
  const total = points.reduce((s, p) => s + p[metric], 0);
  const hasData = points.some((p) => p[metric] > 0);

  return (
    <section className="apple-card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-[13px] font-semibold text-muted-foreground">{METRICS[metric].label}</h2>
          <p className="text-[34px] leading-[41px] font-bold tabular-nums">{nf.format(total)}</p>
          <p className="text-[13px] text-muted-foreground">{METRICS[metric].note}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <SegmentedButtons label="المؤشر" value={metric} onChange={setMetric} options={(Object.keys(METRICS) as Metric[]).map((k) => [k, METRICS[k].label] as const)} />
          {rangeControl}
        </div>
      </div>
      <div className="px-3 pt-4 pb-4 sm:px-5">
        {hasData ? (
          <div className="h-64 w-full" dir="ltr" role="img" aria-label={`${METRICS[metric].label} على مدار الفترة`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => nf.format(v)} />
                <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ fill: "var(--fill-3)" }} />
                <Bar dataKey={metric} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Unavailable icon={LineChart} title="مفيش بيانات في الفترة دي" description="أول ما الليدز تتضاف أو تتحوّل هتظهر هنا." />
        )}
      </div>
    </section>
  );
}

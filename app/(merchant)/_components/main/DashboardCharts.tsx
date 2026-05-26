"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3, Eye, ShoppingCart, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartPoint = {
  name: string;
  revenue: number;
  orders: number;
  visits: number;
};

type DashboardChartsProps = {
  data: ChartPoint[];
};

type TooltipPayload = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function formatCompactPrice(value: number) {
  const normalized = value / 100;

  return new Intl.NumberFormat("ar-EG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(normalized);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const labelMap: Record<string, string> = {
    revenue: "الأرباح",
    orders: "الطلبات",
    visits: "الزيارات",
  };

  return (
    <div className="min-w-40 rounded-2xl border border-border/70 bg-background/95 p-3 text-right shadow-xl shadow-black/10 backdrop-blur-xl">
      <p className="mb-2 text-xs font-bold text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          const rawValue = Number(item.value ?? 0);
          const value = key === "revenue" ? formatPrice(rawValue) : formatNumber(rawValue);

          return (
            <div key={key} className="flex items-center justify-between gap-4 text-xs font-bold">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color ?? "var(--primary)" }}
                />
                {labelMap[key] ?? key}
              </span>
              <span>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 text-center">
      <div className="space-y-3">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Activity className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="font-bold">لسه مفيش بيانات كفاية</p>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            أول ما تبدأ الطلبات والزيارات تظهر، الرسوم البيانية هتتحول لمركز تحكم حقيقي.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const hasAnyData = data.some((point) => point.revenue > 0 || point.orders > 0 || point.visits > 0);
  const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);
  const totalVisits = data.reduce((sum, point) => sum + point.visits, 0);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card className="... border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl xl:col-span-3">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-5 pb-2 sm:p-6 sm:pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Wallet className="size-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold">منحنى الأرباح</CardTitle>
                <p className="text-sm text-muted-foreground">آخر 30 يوم</p>
              </div>
            </div>
          </div>
          <Badge className="rounded-full border-0 bg-primary/10 text-primary hover:bg-primary/10">
            {formatPrice(totalRevenue)}
          </Badge>
        </CardHeader>
        <CardContent className="p-5 pt-3 sm:p-6 sm:pt-4">
          {!hasAnyData ? (
            <EmptyChartState />
          ) : (
            <div className="h-[330px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashoRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={18}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => formatCompactPrice(Number(value))}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    orientation="right"
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--primary)", strokeOpacity: 0.18 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fill="url(#cashoRevenue)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="... border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl xl:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-5 pb-2 sm:p-6 sm:pb-2">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold">الطلبات والزيارات</CardTitle>
              <p className="text-sm text-muted-foreground">مقارنة تشغيلية يومية</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-3 sm:p-6 sm:pt-4">
          {!hasAnyData ? (
            <EmptyChartState />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <ShoppingCart className="size-4" />
                    الطلبات
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(totalOrders)}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Eye className="size-4" />
                    الزيارات
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(totalVisits)}</p>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={24}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      orientation="right"
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                    <Bar dataKey="orders" fill="var(--primary)" radius={[10, 10, 0, 0]} maxBarSize={16} />
                    <Bar dataKey="visits" fill="var(--chart-2)" radius={[10, 10, 0, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Package,
  Percent,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReportsData } from "../_lib/types";

const numFmt = new Intl.NumberFormat("ar-EG");
const moneyFmt = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const fmt = (v: number) => moneyFmt.format(v / 100);

const getChange = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontSize: 12,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(38 92% 50%)",
  PAID: "hsl(217 91% 60%)",
  SHIPPED: "hsl(262 83% 58%)",
  DELIVERED: "hsl(160 84% 39%)",
  CANCELED: "hsl(0 84% 60%)",
};

export function SectionOverview({ data }: { data: ReportsData }) {
  const { kpis, dailyData, statusData } = data;

  const kpiCards = [
    {
      title: "إجمالي المبيعات",
      value: fmt(kpis.revenue.current),
      change: getChange(kpis.revenue.current, kpis.revenue.previous),
      icon: Wallet,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      lowerIsBetter: false,
    },
    {
      title: "صافي المبيعات",
      value: fmt(kpis.netSales.current),
      change: getChange(kpis.netSales.current, kpis.netSales.previous),
      icon: TrendingUp,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      lowerIsBetter: false,
    },
    {
      title: "عدد الطلبات",
      value: numFmt.format(kpis.orders.current),
      change: getChange(kpis.orders.current, kpis.orders.previous),
      icon: Receipt,
      iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      lowerIsBetter: false,
    },
    {
      title: "زيارات المتجر",
      value: numFmt.format(kpis.visits.current),
      change: getChange(kpis.visits.current, kpis.visits.previous),
      icon: Eye,
      iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      lowerIsBetter: false,
    },
    {
      title: "معدل التحويل",
      value: `${kpis.conversionRate.current.toFixed(2)}%`,
      change: getChange(
        kpis.conversionRate.current,
        kpis.conversionRate.previous,
      ),
      icon: Users,
      iconClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      lowerIsBetter: false,
    },
    {
      title: "متوسط قيمة الطلب",
      value: fmt(kpis.aov.current),
      change: getChange(kpis.aov.current, kpis.aov.previous),
      icon: Package,
      iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      lowerIsBetter: false,
    },
    {
      title: "إجمالي الخصومات",
      value: fmt(kpis.totalDiscount.current),
      change: getChange(
        kpis.totalDiscount.current,
        kpis.totalDiscount.previous,
      ),
      icon: Percent,
      iconClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      lowerIsBetter: false,
    },
    {
      title: "نسبة الإلغاء",
      value: `${kpis.cancelRate.current.toFixed(1)}%`,
      change: getChange(kpis.cancelRate.current, kpis.cancelRate.previous),
      icon: XCircle,
      iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      lowerIsBetter: true,
    },
  ];

  // Interval for XAxis labels
  const labelInterval =
    data.period <= 30
      ? Math.floor(data.period / 7) - 1
      : Math.floor(data.period / 12);

  return (
    <div className="space-y-6">
      {/* Hero summary */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="relative overflow-hidden border-border shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/7 via-transparent to-transparent" />
          <CardContent className="relative p-6 sm:p-8">
            <Badge
              variant="secondary"
              className="mb-4 rounded-full border-0 bg-primary/10 text-primary"
            >
              ملخص آخر {data.period} يوم
            </Badge>

            <div className="grid gap-6 md:grid-cols-[1fr_200px] md:items-center">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                  {kpis.revenue.current > 0
                    ? `إجمالي إيراداتك ${fmt(kpis.revenue.current)}`
                    : "لسه مفيش مبيعات في الفترة دي"}
                </h2>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  صافي المبيعات المؤكدة{" "}
                  <span className="font-bold text-foreground">
                    {fmt(kpis.netSales.current)}
                  </span>
                  ، من{" "}
                  <span className="font-bold text-foreground">
                    {numFmt.format(kpis.orders.current)}
                  </span>{" "}
                  طلب على{" "}
                  <span className="font-bold text-foreground">
                    {numFmt.format(kpis.visits.current)}
                  </span>{" "}
                  زيارة.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  معدل التحويل
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {kpis.conversionRate.current.toFixed(2)}%
                </p>
                <Progress
                  value={Math.min(kpis.conversionRate.current * 10, 100)}
                  className="mt-3 h-1.5"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  متوسط الطلب: {fmt(kpis.aov.current)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold">توزيع الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={
                          STATUS_COLORS[entry.status] || "hsl(var(--muted))"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      numFmt.format(Number(value)),
                      "طلب",
                    ]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 space-y-1.5">
              {statusData
                .filter((s) => s.value > 0)
                .map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[item.status] || "hsl(var(--muted))",
                        }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">
                      {numFmt.format(item.value)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const change = card.change;
          const isPositive = card.lowerIsBetter ? change <= 0 : change >= 0;
          const TrendIcon = change >= 0 ? ArrowUpRight : ArrowDownRight;

          return (
            <Card
              key={card.title}
              className="border-border shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-xl",
                      card.iconClass,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    <TrendIcon className="size-3" />
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {card.title}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue chart */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
            المبيعات اليومية
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            الإيرادات اليومية خلال آخر {data.period} يوم
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={labelInterval}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                  tickFormatter={(v) =>
                    v === 0
                      ? "0"
                      : `${numFmt.format(Math.round(Number(v) / 100))} ج`
                  }
                />
                <Tooltip
                  formatter={(value) => [fmt(Number(value)), "المبيعات"]}
                  labelStyle={{
                    color: "hsl(var(--primary))",
                    fontWeight: 700,
                  }}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Visits vs Orders bar chart */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Eye className="size-4" />
            </span>
            الزيارات مقابل الطلبات
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            مقارنة يومية لزيارات المتجر وعدد الطلبات
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={labelInterval}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    numFmt.format(Number(value)),
                    name === "visits" ? "زيارات" : "طلبات",
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="visits"
                  radius={[6, 6, 0, 0]}
                  fill="var(--primary)"
                  opacity={0.25}
                />
                <Bar
                  dataKey="orders"
                  radius={[6, 6, 0, 0]}
                  fill="var(--primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

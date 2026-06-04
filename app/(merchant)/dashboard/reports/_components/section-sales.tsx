"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CreditCard,
  Percent,
  Receipt,
  Tag,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReportsData } from "../_lib/types";

const numFmt = new Intl.NumberFormat("ar-EG");
const moneyFmt = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const fmt = (v: number) => moneyFmt.format(v / 100);

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontSize: 12,
};

const BAR_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(262 83% 58%)",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(286 60% 55%)",
];

export function SectionSales({ data }: { data: ReportsData }) {
  const {
    kpis,
    paymentMethodData,
    dayOfWeekData,
    hourlyData,
    dailyData,
    discountPercentage,
    totalDiscount,
  } = data;

  const peakHour = [...hourlyData].sort((a, b) => b.orders - a.orders)[0];
  const peakDay = [...dayOfWeekData].sort((a, b) => b.revenue - a.revenue)[0];
  const worstDay = [...dayOfWeekData].sort((a, b) => a.revenue - b.revenue)[0];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "إجمالي الإيرادات",
            value: fmt(kpis.revenue.current),
            sub: `صافي: ${fmt(kpis.netSales.current)}`,
            icon: TrendingUp,
            color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "متوسط قيمة الطلب",
            value: fmt(kpis.aov.current),
            sub: `${numFmt.format(kpis.orders.current)} طلب`,
            icon: Receipt,
            color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "إجمالي الخصومات",
            value: fmt(totalDiscount),
            sub: `${discountPercentage.toFixed(1)}% من الإيرادات`,
            icon: Percent,
            color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          },
          {
            label: "أقوى يوم مبيعات",
            value: peakDay?.day ?? "—",
            sub: peakDay ? fmt(peakDay.revenue) : "لا بيانات",
            icon: Tag,
            color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border shadow-sm">
              <div className="p-5">
                <div
                  className={cn(
                    "mb-3 grid size-9 place-items-center rounded-xl",
                    card.color,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {card.sub}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment methods + day of week */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Payment methods */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </span>
              طرق الدفع
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              توزيع الإيرادات حسب طريقة الدفع
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {paymentMethodData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا توجد بيانات
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={paymentMethodData}
                    layout="vertical"
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                      tickFormatter={(v) =>
                        `${numFmt.format(Math.round(Number(v) / 100))} ج`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue"
                          ? fmt(Number(value))
                          : numFmt.format(Number(value)),
                        name === "revenue" ? "الإيراد" : "الطلبات",
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {paymentMethodData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {paymentMethodData.length > 0 && (
              <div className="mt-4 space-y-2">
                {paymentMethodData.map((item, i) => (
                  <div
                    key={item.method}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {numFmt.format(item.orders)} طلب
                      </span>
                      <span className="font-bold">{fmt(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day of week */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="size-4" />
              </span>
              المبيعات حسب اليوم
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              الإيرادات حسب يوم الأسبوع — اكتشف أقوى أيامك
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
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
                    formatter={(value, name) => [
                      name === "revenue"
                        ? fmt(Number(value))
                        : numFmt.format(Number(value)),
                      name === "revenue" ? "الإيراد" : "الطلبات",
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[6, 6, 0, 0]}
                  >
                    {dayOfWeekData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.day === peakDay?.day
                            ? "var(--primary)"
                            : "hsl(var(--primary) / 0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="text-xs">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  أقوى يوم: {peakDay?.day ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {peakDay ? fmt(peakDay.revenue) : ""}
                </p>
              </div>
              <div className="text-xs text-end">
                <p className="font-bold text-rose-600 dark:text-rose-400">
                  أضعف يوم: {worstDay?.day ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {worstDay ? fmt(worstDay.revenue) : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly distribution */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
            توزيع الطلبات بالساعة
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            اعرف الأوقات الأكتر نشاطاً في متجرك خلال اليوم
            {peakHour && (
              <span className="ms-2 font-bold text-primary">
                — الذروة عند {peakHour.hour} ({numFmt.format(peakHour.orders)}{" "}
                طلب)
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value) => [
                    numFmt.format(Number(value)),
                    "طلبات",
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.hour === peakHour?.hour
                          ? "var(--primary)"
                          : "hsl(var(--primary) / 0.3)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily breakdown table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="size-4" />
            </span>
            التفصيلة اليومية
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            إيرادات وطلبات وزيارات ومعدل تحويل كل يوم
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="ps-6 text-right text-xs text-muted-foreground">
                    التاريخ
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الإيراد
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الطلبات
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الزيارات
                  </TableHead>
                  <TableHead className="pe-6 text-right text-xs text-muted-foreground">
                    التحويل
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...dailyData].reverse().map((day) => {
                  const conv =
                    day.visits > 0
                      ? ((day.orders / day.visits) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow
                      key={day.date}
                      className="border-border/30 hover:bg-muted/20"
                    >
                      <TableCell className="ps-6 py-3 text-sm font-medium">
                        {day.label}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {day.revenue > 0 ? fmt(day.revenue) : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-sm">
                        {numFmt.format(day.orders)}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {numFmt.format(day.visits)}
                      </TableCell>
                      <TableCell className="pe-6 py-3">
                        <Badge
                          className={cn(
                            "rounded-full border-0 text-xs",
                            parseFloat(conv) >= 5
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : parseFloat(conv) >= 1
                                ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {conv}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

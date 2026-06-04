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
import { Award, Crown, Gift, Users, UserCheck, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SectionCustomers({ data }: { data: ReportsData }) {
  const { customerStats, topCustomers, loyaltyStats } = data;

  const returningCustomers = Math.max(
    0,
    customerStats.withOrders - customerStats.newThisPeriod,
  );

  const loyaltyChartData = [
    {
      name: "نقاط مكتسبة",
      value: loyaltyStats.totalEarned,
      fill: "hsl(160 84% 39%)",
    },
    {
      name: "نقاط مستردة",
      value: loyaltyStats.totalRedeemed,
      fill: "hsl(217 91% 60%)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "إجمالي العملاء",
            value: numFmt.format(customerStats.total),
            sub: "عملاء مسجلين بالمتجر",
            icon: Users,
            color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            label: "عملاء الفترة دي",
            value: numFmt.format(customerStats.withOrders),
            sub: "اشتروا في الفترة المحددة",
            icon: UserCheck,
            color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "عملاء جدد",
            value: numFmt.format(customerStats.newThisPeriod),
            sub: "أول مرة بيشتروا",
            icon: UserPlus,
            color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "عملاء عائدون",
            value: numFmt.format(returningCustomers),
            sub: "اشتروا أكتر من مرة",
            icon: Award,
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
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {card.sub}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top customers table + loyalty */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.4fr]">
        {/* Top customers */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Crown className="size-4" />
              </span>
              أفضل العملاء
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              أعلى العملاء إنفاقاً في الفترة المحددة
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="ps-6 text-right text-xs text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    العميل
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    رقم الهاتف
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الطلبات
                  </TableHead>
                  <TableHead className="pe-6 text-right text-xs text-muted-foreground">
                    الإنفاق
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      لا توجد بيانات عملاء في هذه الفترة
                    </TableCell>
                  </TableRow>
                ) : (
                  topCustomers.map((customer, index) => (
                    <TableRow
                      key={customer.phone}
                      className="border-border/30 hover:bg-muted/20"
                    >
                      <TableCell className="ps-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                            index === 0
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              : index === 1
                                ? "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                                : index === 2
                                  ? "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm font-bold">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Crown className="size-3.5 text-amber-500" />
                          )}
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-muted-foreground" dir="ltr">
                        {customer.phone}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge className="rounded-full border-0 bg-primary/10 text-primary text-xs">
                          {numFmt.format(customer.orders)} طلب
                        </Badge>
                      </TableCell>
                      <TableCell className="pe-6 py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(customer.totalSpend)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Loyalty stats */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Gift className="size-4" />
              </span>
              نقاط الولاء
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                نقاط مكتسبة
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {numFmt.format(loyaltyStats.totalEarned)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                نقاط مستردة
              </p>
              <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">
                {numFmt.format(loyaltyStats.totalRedeemed)}
              </p>
            </div>

            {(loyaltyStats.totalEarned > 0 ||
              loyaltyStats.totalRedeemed > 0) && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loyaltyChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 9,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 9,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        numFmt.format(Number(value)),
                        "نقطة",
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {loyaltyChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {loyaltyStats.totalEarned === 0 &&
              loyaltyStats.totalRedeemed === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  لا توجد نشاط نقاط ولاء في هذه الفترة
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Customer acquisition insight */}
      {customerStats.withOrders > 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {customerStats.withOrders > 0
                    ? Math.round(
                        (customerStats.newThisPeriod /
                          customerStats.withOrders) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  من المشترين عملاء جدد
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center">
                <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                  {customerStats.withOrders > 0
                    ? Math.round(
                        (returningCustomers / customerStats.withOrders) * 100,
                      )
                    : 0}
                  %
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  من المشترين عملاء عائدون
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {topCustomers.length > 0
                    ? fmt(topCustomers[0].totalSpend)
                    : "—"}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  أعلى إنفاق عميل واحد
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

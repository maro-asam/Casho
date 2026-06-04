"use client";

import {
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
import { Package, ShoppingBag, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const CATEGORY_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(262 83% 58%)",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(286 60% 55%)",
  "hsl(199 89% 48%)",
  "hsl(316 73% 52%)",
];

export function SectionProducts({ data }: { data: ReportsData }) {
  const {
    topProductsByRevenue,
    topProductsByQuantity,
    categoryData,
    productsWithNoSales,
  } = data;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="size-4" />
            </div>
            <p className="text-2xl font-bold">
              {numFmt.format(topProductsByRevenue.length)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              منتج باع في الفترة دي
            </p>
          </div>
        </Card>
        <Card className="border-border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="size-4" />
            </div>
            <p className="text-2xl font-bold">
              {numFmt.format(
                topProductsByRevenue.reduce((s, p) => s + p.sold, 0),
              )}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              قطعة تم بيعها
            </p>
          </div>
        </Card>
        <Card className="border-border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Tag className="size-4" />
            </div>
            <p className="text-2xl font-bold">
              {numFmt.format(productsWithNoSales.length)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              منتج بدون مبيعات في الفترة
            </p>
          </div>
        </Card>
      </div>

      {/* Top products by revenue */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </span>
            أفضل المنتجات — الإيراد
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            المنتجات الأعلى إيراداً خلال الفترة المحددة
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {topProductsByRevenue.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              لا توجد مبيعات في الفترة دي
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsByRevenue}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
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
                      fontSize: 10,
                    }}
                    tickFormatter={(v) =>
                      `${numFmt.format(Math.round(Number(v) / 100))} ج`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [fmt(Number(value)), "الإيراد"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown + top by quantity */}
      <div className="grid gap-4 xl:grid-cols-[0.6fr_1.4fr]">
        {/* Category donut */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Tag className="size-4" />
              </span>
              الإيراد حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {categoryData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                لا توجد بيانات
              </p>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {categoryData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [fmt(Number(value)), "الإيراد"]}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-2">
                  {categoryData.map((cat, i) => {
                    const totalCatRevenue = categoryData.reduce(
                      (s, c) => s + c.revenue,
                      0,
                    );
                    const pct =
                      totalCatRevenue > 0
                        ? Math.round((cat.revenue / totalCatRevenue) * 100)
                        : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                              }}
                            />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-1"
                          style={
                            {
                              "--progress-color":
                                CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top by quantity */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="size-4" />
              </span>
              أكتر المنتجات مبيعاً — الكمية
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              المنتجات الأكتر مبيعاً بالكميات في الفترة
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {topProductsByQuantity.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                لا توجد مبيعات
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsByQuantity}
                    layout="vertical"
                    margin={{ left: 0, right: 16 }}
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
                      allowDecimals={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        numFmt.format(Number(value)),
                        "قطعة",
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar
                      dataKey="sold"
                      radius={[0, 6, 6, 0]}
                      fill="hsl(217 91% 60%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full products performance table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </span>
            جدول أداء المنتجات الكامل
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            كل المنتجات اللي باعت في الفترة مع تفاصيل الأداء
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="ps-6 text-right text-xs text-muted-foreground">
                    المنتج
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الفئة
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الكمية
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الإيراد
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    المخزون
                  </TableHead>
                  <TableHead className="pe-6 text-right text-xs text-muted-foreground">
                    الأداء
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProductsByRevenue.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      لا توجد مبيعات منتجات في هذه الفترة
                    </TableCell>
                  </TableRow>
                ) : (
                  topProductsByRevenue.map((p) => (
                    <TableRow
                      key={p.id}
                      className="border-border/30 hover:bg-muted/20"
                    >
                      <TableCell className="ps-6 py-3.5 text-sm font-bold">
                        {p.name}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {p.category}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm">
                        {numFmt.format(p.sold)} قطعة
                      </TableCell>
                      <TableCell className="py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(p.revenue)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          className={cn(
                            "rounded-full border-0 text-xs",
                            p.stock === 0
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                              : p.stock <= 5
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          )}
                        >
                          {numFmt.format(p.stock)}
                        </Badge>
                      </TableCell>
                      <TableCell className="pe-6 py-3.5">
                        <div className="flex min-w-28 items-center gap-2">
                          <Progress value={p.performance} className="h-1.5" />
                          <span className="text-xs font-bold text-muted-foreground">
                            {p.performance}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Products with no sales */}
      {productsWithNoSales.length > 0 && (
        <Card className="border-border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <Package className="size-4" />
              </span>
              منتجات بدون مبيعات في الفترة دي
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {productsWithNoSales.length} منتج نشط لم يحقق أي مبيع — راجع
              التسعير أو الظهور
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              {productsWithNoSales.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-muted-foreground">{p.category}</span>
                  <Badge
                    className={cn(
                      "rounded-full border-0 text-[10px]",
                      p.stock === 0
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.stock === 0 ? "نفد" : `${numFmt.format(p.stock)} متبقي`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

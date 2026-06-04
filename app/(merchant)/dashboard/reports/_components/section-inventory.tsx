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
  AlertTriangle,
  Archive,
  Package,
  Star,
  ThumbsUp,
} from "lucide-react";

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

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  direction: "rtl" as const,
  textAlign: "right" as const,
  fontSize: 12,
};

const STAR_COLORS = [
  "hsl(160 84% 39%)",
  "hsl(160 70% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(0 70% 65%)",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "size-3.5",
            s <= Math.round(rating)
              ? "fill-amber-500 text-amber-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function SectionInventory({ data }: { data: ReportsData }) {
  const { inventoryStats, lowStockProducts, reviewStats } = data;

  const stockHealthPercent =
    inventoryStats.activeProducts > 0
      ? Math.round(
          ((inventoryStats.activeProducts -
            inventoryStats.lowStock -
            inventoryStats.outOfStock) /
            inventoryStats.activeProducts) *
            100,
        )
      : 100;

  return (
    <div className="space-y-6">
      {/* Inventory KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="size-4" />
            </div>
            <p className="text-2xl font-bold">
              {numFmt.format(inventoryStats.activeProducts)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              منتج نشط
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">صحة المخزون</span>
                <span className="font-bold">{stockHealthPercent}%</span>
              </div>
              <Progress value={stockHealthPercent} className="h-1" />
            </div>
          </div>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {numFmt.format(inventoryStats.lowStock)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              مخزون منخفض
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              أقل من أو يساوي الحد المحدد
            </p>
          </div>
        </Card>

        <Card className="border-rose-500/20 bg-rose-500/5 border shadow-sm">
          <div className="p-5">
            <div className="mb-3 grid size-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Archive className="size-4" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {numFmt.format(inventoryStats.outOfStock)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              نفد المخزون
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              مخزون = صفر، يجب إعادة التوريد
            </p>
          </div>
        </Card>
      </div>

      {/* Low stock products table + reviews */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Low stock table */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <AlertTriangle className="size-4" />
              </span>
              منتجات تحتاج إعادة توريد
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              مرتبة من الأقل مخزوناً — اتخذ إجراء قبل النفاد
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="font-bold">المخزون تمام</p>
                  <p className="text-sm text-muted-foreground">
                    مفيش منتجات على وشك النفاد 🎉
                  </p>
                </div>
              </div>
            ) : (
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
                      المتبقي
                    </TableHead>
                    <TableHead className="pe-6 text-right text-xs text-muted-foreground">
                      الحالة
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p) => {
                    const urgency =
                      p.stock === 0
                        ? "out"
                        : p.stock <= Math.ceil(p.threshold / 2)
                          ? "critical"
                          : "low";
                    return (
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
                        <TableCell className="py-3.5">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              urgency === "out"
                                ? "text-rose-600 dark:text-rose-400"
                                : urgency === "critical"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-orange-600 dark:text-orange-400",
                            )}
                          >
                            {numFmt.format(p.stock)} قطعة
                          </span>
                        </TableCell>
                        <TableCell className="pe-6 py-3.5">
                          <Badge
                            className={cn(
                              "rounded-full border-0 text-xs",
                              urgency === "out"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : urgency === "critical"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  : "bg-orange-500/10 text-orange-700 dark:text-orange-300",
                            )}
                          >
                            {urgency === "out"
                              ? "نفد المخزون"
                              : urgency === "critical"
                                ? "حرج جداً"
                                : "منخفض"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reviews summary */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Star className="size-4" />
              </span>
              ملخص التقييمات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {reviewStats.total === 0 ? (
              <div className="py-8 text-center">
                <ThumbsUp className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  لا توجد تقييمات حتى الآن
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center">
                  <p className="text-4xl font-bold">
                    {reviewStats.avgRating.toFixed(1)}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <StarRating rating={reviewStats.avgRating} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    من {numFmt.format(reviewStats.total)} تقييم
                  </p>
                </div>

                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...reviewStats.distribution].reverse()}
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
                        allowDecimals={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="rating"
                        axisLine={false}
                        tickLine={false}
                        width={24}
                        tickFormatter={(v) => `${v}★`}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          numFmt.format(Number(value)),
                          "تقييم",
                        ]}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {reviewStats.distribution.map((entry, i) => (
                          <Cell
                            key={entry.rating}
                            fill={
                              STAR_COLORS[
                                reviewStats.distribution.length - 1 - i
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5">
                  {reviewStats.distribution.map((d) => {
                    const pct =
                      reviewStats.total > 0
                        ? Math.round((d.count / reviewStats.total) * 100)
                        : 0;
                    return (
                      <div key={d.rating} className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                          {d.rating}★
                        </span>
                        <Progress
                          value={pct}
                          className="h-1.5 flex-1"
                        />
                        <span className="w-8 text-end text-xs font-bold text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Percent, Tag, TicketPercent, TrendingDown } from "lucide-react";

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

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function SectionCoupons({ data }: { data: ReportsData }) {
  const { couponData, totalDiscount, discountPercentage, kpis } = data;

  const activeCoupons = couponData.filter((c) => c.isActive).length;
  const usedThisPeriod = couponData.filter((c) => c.usedThisPeriod > 0).length;
  const totalUsed = couponData.reduce((s, c) => s + c.usedThisPeriod, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "إجمالي الكوبونات",
            value: numFmt.format(couponData.length),
            sub: `${numFmt.format(activeCoupons)} كوبون نشط`,
            icon: Tag,
            color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            label: "استخدام في الفترة",
            value: numFmt.format(totalUsed),
            sub: `من ${numFmt.format(usedThisPeriod)} كوبون مختلف`,
            icon: TicketPercent,
            color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
          {
            label: "إجمالي الخصومات",
            value: fmt(totalDiscount),
            sub: `${discountPercentage.toFixed(1)}% من الإيرادات`,
            icon: TrendingDown,
            color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          },
          {
            label: "نسبة الطلبات بكوبون",
            value:
              kpis.orders.current > 0
                ? `${Math.round((totalUsed / kpis.orders.current) * 100)}%`
                : "0%",
            sub: "من كل الطلبات",
            icon: Percent,
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

      {/* Coupons table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <TicketPercent className="size-4" />
            </span>
            تفاصيل الكوبونات
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            أداء كل كوبون في الفترة المحددة
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {couponData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Tag className="size-6" />
              </div>
              <div>
                <p className="font-bold">لا توجد كوبونات</p>
                <p className="text-sm text-muted-foreground">
                  أنشئ كوبونات خصم لتشجيع المشتريات
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="ps-6 text-right text-xs text-muted-foreground">
                    الكود
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    النوع
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    القيمة
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    استخدام في الفترة
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الخصم المعطى
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    الانتهاء
                  </TableHead>
                  <TableHead className="pe-6 text-right text-xs text-muted-foreground">
                    الحالة
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponData.map((coupon) => (
                  <TableRow
                    key={coupon.id}
                    className="border-border/30 hover:bg-muted/20"
                  >
                    <TableCell className="ps-6 py-3.5">
                      <code className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs font-bold">
                        {coupon.code}
                      </code>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge
                        className={cn(
                          "rounded-full border-0 text-xs",
                          coupon.type === "PERCENTAGE"
                            ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            : "bg-sky-500/10 text-sky-700 dark:text-sky-300",
                        )}
                      >
                        {coupon.type === "PERCENTAGE" ? "نسبة %%" : "مبلغ ثابت"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 text-sm font-bold">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : fmt(coupon.value * 100)}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm">
                      {coupon.usedThisPeriod > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {numFmt.format(coupon.usedThisPeriod)} مرة
                        </span>
                      ) : (
                        <span className="text-muted-foreground">لم يستخدم</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm font-bold text-rose-600 dark:text-rose-400">
                      {coupon.totalDiscount > 0
                        ? fmt(coupon.totalDiscount)
                        : "—"}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-muted-foreground">
                      {coupon.expiresAt ? (
                        <span
                          className={cn(
                            new Date(coupon.expiresAt) < new Date()
                              ? "text-rose-600 dark:text-rose-400"
                              : "",
                          )}
                        >
                          {dateFormatter.format(new Date(coupon.expiresAt))}
                        </span>
                      ) : (
                        "بدون انتهاء"
                      )}
                    </TableCell>
                    <TableCell className="pe-6 py-3.5">
                      <Badge
                        className={cn(
                          "rounded-full border-0 text-xs",
                          coupon.isActive
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {coupon.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Discount impact insight */}
      {totalDiscount > 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
                <TrendingDown className="size-5" />
              </div>
              <div>
                <p className="font-bold">تأثير الخصومات على الإيرادات</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  أعطيت خصومات بقيمة{" "}
                  <span className="font-bold text-foreground">
                    {fmt(totalDiscount)}
                  </span>{" "}
                  على إجمالي إيرادات{" "}
                  <span className="font-bold text-foreground">
                    {fmt(kpis.revenue.current)}
                  </span>
                  . الخصومات كانت{" "}
                  <span
                    className={cn(
                      "font-bold",
                      discountPercentage > 20
                        ? "text-rose-600 dark:text-rose-400"
                        : discountPercentage > 10
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {discountPercentage.toFixed(1)}%
                  </span>{" "}
                  من الإيرادات.
                  {discountPercentage > 20
                    ? " ⚠️ الخصومات مرتفعة — راجع استراتيجية التسعير."
                    : discountPercentage > 10
                      ? " نسبة معقولة — راقب التأثير على الهامش."
                      : " ✅ نسبة صحية وتحت السيطرة."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

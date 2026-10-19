import Link from "next/link";
import type { OrderSource, OrderStatus } from "@prisma/client";
import { ArrowLeft, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CHANNELS, formatMoney } from "./format";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type RecentOrder = {
  id: string;
  fullName: string;
  status: OrderStatus;
  source: OrderSource;
  total: number;
  createdAt: Date;
};

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  PAID: { get label() { return tr("مدفوع"); }, className: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  SHIPPED: { get label() { return tr("تم الشحن"); }, className: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  DELIVERED: { get label() { return tr("تم التسليم"); }, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  CANCELED: { get label() { return tr("ملغي"); }, className: "bg-muted text-muted-foreground" },
};

const dateFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-5 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{tr("آخر الطلبات")}</CardTitle>
          <p className="text-xs text-muted-foreground">{tr("أحدث طلبات المتجر والكاشير")}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/orders">
            {tr("عرض الكل")}
            <ArrowLeft className="size-3.5 ltr:-scale-x-100" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-5 text-start text-xs">{tr("الطلب")}</TableHead>
                <TableHead className="hidden text-start text-xs md:table-cell">{tr("القناة")}</TableHead>
                <TableHead className="text-start text-xs">{tr("الحالة")}</TableHead>
                <TableHead className="hidden text-start text-xs lg:table-cell">{tr("التاريخ")}</TableHead>
                <TableHead className="pe-5 text-end text-xs">{tr("المبلغ")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status = STATUS[order.status];
                const channel = CHANNELS[order.source];
                const ChannelIcon = channel.icon;

                return (
                  <TableRow key={order.id} className="relative">
                    <TableCell className="ps-5">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none"
                      >
                        {order.fullName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        #{order.id.slice(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ChannelIcon className="size-3.5" />
                        {channel.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", status.className)}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {dateFormat.format(order.createdAt)}
                    </TableCell>
                    <TableCell className="pe-5 text-end text-sm font-semibold tabular-nums">
                      {formatMoney(order.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="mx-5 mb-5 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <ShoppingCart className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">{tr("لسه مفيش طلبات")}</p>
            <p className="text-xs text-muted-foreground">{tr("شارك لينك متجرك وأول طلب هيظهر هنا.")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import type { OrderSource, OrderStatus } from "@prisma/client";
import { ChevronLeft, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import CardHeading from "./CardHeading";
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

// Dot color + label: status never relies on color alone.
const STATUS: Record<OrderStatus, { label: string; dot: string }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, dot: "bg-(--sys-orange)" },
  PAID: { get label() { return tr("مدفوع"); }, dot: "bg-primary" },
  SHIPPED: { get label() { return tr("تم الشحن"); }, dot: "bg-(--sys-indigo)" },
  DELIVERED: { get label() { return tr("تم التسليم"); }, dot: "bg-(--sys-green)" },
  CANCELED: { get label() { return tr("ملغي"); }, dot: "bg-(--sys-gray)" },
};

function initialOf(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "#";
}

const dateFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className="apple-card h-full overflow-hidden">
      <CardHeading
        title={tr("آخر الطلبات")}
        subtitle={tr("أحدث طلبات المتجر والكاشير")}
        action={{ label: tr("عرض الكل"), href: "/orders" }}
      />

      {orders.length > 0 ? (
        <ul className="apple-rows pb-2 [--row-inset:68px]">
          {orders.map((order) => {
            const status = STATUS[order.status];
            const channel = CHANNELS[order.source];
            const ChannelIcon = channel.icon;

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex min-h-16 items-center gap-3.5 px-4 py-2.5 transition-colors hover:bg-muted/60 active:bg-muted focus-visible:bg-muted/60 focus-visible:outline-none sm:px-5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[15px] font-semibold text-foreground/70">
                    {initialOf(order.fullName)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] leading-5">{order.fullName}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-[18px] text-muted-foreground">
                      <span className="font-mono text-[12px]" dir="ltr">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="hidden items-center gap-1 sm:inline-flex">
                        <ChannelIcon className="size-3.5" strokeWidth={1.8} />
                        {channel.label}
                      </span>
                      <span aria-hidden className="hidden sm:inline">·</span>
                      <span className="truncate">{dateFormat.format(order.createdAt)}</span>
                    </span>
                  </span>

                  <span className="hidden shrink-0 items-center gap-1.5 text-[13px] text-foreground/80 md:inline-flex">
                    <span aria-hidden className={cn("size-2 rounded-full", status.dot)} />
                    {status.label}
                  </span>

                  <span className="w-24 shrink-0 text-end">
                    <span className="block text-[15px] font-semibold tabular-nums">{formatMoney(order.total)}</span>
                    <span className="flex items-center justify-end gap-1 text-[12px] text-muted-foreground md:hidden">
                      <span aria-hidden className={cn("size-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </span>

                  <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mx-5 mb-5 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background py-12 text-center">
          <ShoppingCart className="size-7 text-(--label-3)" strokeWidth={1.6} />
          <p className="text-[17px] font-semibold">{tr("لسه مفيش طلبات")}</p>
          <p className="text-[13px] text-muted-foreground">{tr("شارك لينك متجرك وأول طلب هيظهر هنا.")}</p>
        </div>
      )}
    </section>
  );
}

import { OrderSource, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Merchants are in Egypt; bucket days by Cairo time, not the server's clock.
const TIME_ZONE = "Africa/Cairo";
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Orders that count as money actually earned (same rule as reports).
const REVENUE_STATUSES: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayLabelFormat = new Intl.DateTimeFormat("ar-EG", { timeZone: TIME_ZONE, day: "numeric", month: "short" });

const dayKey = (date: Date) => dayKeyFormat.format(date);

export type DailyPoint = {
  label: string;
  revenue: number;
  orders: number;
  visits: number;
};

export type Kpi = {
  current: number;
  previous: number;
  series: number[];
};

export type ChannelTotal = { source: OrderSource; revenue: number; orders: number };

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;

function sum(points: DailyPoint[], key: keyof Omit<DailyPoint, "label">) {
  return points.reduce((total, point) => total + point[key], 0);
}

export async function getOverviewData(storeId: string) {
  const now = new Date();
  // Two full periods (+1 day of slack so the oldest Cairo day is complete).
  const since = new Date(now.getTime() - (PERIOD_DAYS * 2 + 1) * DAY_MS);

  const [orders, visitRows, pendingOrders, products] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, createdAt: { gte: since } },
      select: { createdAt: true, total: true, status: true, source: true },
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM "Visit"
      WHERE "storeId" = ${storeId} AND "createdAt" >= ${since}
      GROUP BY 1
    `,
    prisma.order.count({ where: { storeId, status: OrderStatus.PENDING } }),
    prisma.product.findMany({
      where: { storeId },
      select: { stock: true, lowStockThreshold: true },
    }),
  ]);

  // 60 consecutive Cairo days, oldest first.
  const days = Array.from({ length: PERIOD_DAYS * 2 }, (_, i) => {
    const date = new Date(now.getTime() - (PERIOD_DAYS * 2 - 1 - i) * DAY_MS);
    return {
      key: dayKey(date),
      point: { label: dayLabelFormat.format(date), revenue: 0, orders: 0, visits: 0, earning: 0 },
    };
  });
  const byKey = new Map(days.map((d) => [d.key, d.point]));
  const currentKeys = new Set(days.slice(PERIOD_DAYS).map((d) => d.key));

  const channels = new Map<OrderSource, ChannelTotal>();

  for (const order of orders) {
    const key = dayKey(order.createdAt);
    const point = byKey.get(key);
    if (!point || order.status === OrderStatus.CANCELED) continue;

    point.orders += 1;
    if (REVENUE_STATUSES.includes(order.status)) {
      point.revenue += order.total;
      point.earning += 1;

      if (currentKeys.has(key)) {
        const channel = channels.get(order.source) ?? { source: order.source, revenue: 0, orders: 0 };
        channel.revenue += order.total;
        channel.orders += 1;
        channels.set(order.source, channel);
      }
    }
  }

  for (const row of visitRows) {
    const point = byKey.get(row.day);
    if (point) point.visits += Number(row.count);
  }

  const all = days.map((d) => d.point);
  const previous = all.slice(0, PERIOD_DAYS);
  const current = all.slice(PERIOD_DAYS);

  const aov = (points: typeof all) => {
    const earning = points.reduce((n, p) => n + p.earning, 0);
    return earning > 0 ? Math.round(sum(points, "revenue") / earning) : 0;
  };
  const conversion = (points: typeof all) => {
    const visits = sum(points, "visits");
    return visits > 0 ? (sum(points, "orders") / visits) * 100 : 0;
  };

  const kpis = {
    revenue: { current: sum(current, "revenue"), previous: sum(previous, "revenue"), series: current.map((p) => p.revenue) },
    orders: { current: sum(current, "orders"), previous: sum(previous, "orders"), series: current.map((p) => p.orders) },
    visits: { current: sum(current, "visits"), previous: sum(previous, "visits"), series: current.map((p) => p.visits) },
    aov: {
      current: aov(current),
      previous: aov(previous),
      series: current.map((p) => (p.earning > 0 ? p.revenue / p.earning : 0)),
    },
    conversion: {
      current: conversion(current),
      previous: conversion(previous),
      series: current.map((p) => (p.visits > 0 ? (p.orders / p.visits) * 100 : 0)),
    },
  } satisfies Record<string, Kpi>;

  const lowStockCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD),
  ).length;

  const today = current[current.length - 1];

  return {
    kpis,
    today: { revenue: today.revenue, orders: today.orders, visits: today.visits },
    daily: current.map(({ label, revenue, orders, visits }) => ({ label, revenue, orders, visits })),
    previousTotals: {
      revenue: kpis.revenue.previous,
      orders: kpis.orders.previous,
      visits: kpis.visits.previous,
    },
    channels: [...channels.values()].sort((a, b) => b.revenue - a.revenue),
    pendingOrders,
    lowStockCount,
    productCount: products.length,
  };
}

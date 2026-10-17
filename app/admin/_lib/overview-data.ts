
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cairoMonthStart, getMonthlyFinance, monthKey } from "./finance";

const MONTHS = 12;
const DAY = 86_400_000;

export type MonthPoint = { key: string; label: string; subscriptions: number; profit: number; topups: number; newStores: number };

export async function getAdminOverview() {
  const now = new Date();
  const thisMonth = cairoMonthStart(0, now);
  const lastMonth = cairoMonthStart(-1, now);
  const since = cairoMonthStart(-(MONTHS - 1), now);
  const in3Days = new Date(now.getTime() + 3 * DAY);

  const [
    statusCounts,
    totalUsers,
    newStoresThisMonth,
    newStoresLastMonth,
    pendingTopups,
    pendingTopupsAmount,
    newServices,
    newSupport,
    atRiskRenewals,
    unconfirmedPlans,
    finance,
    storesSince,
    ordersThisMonth,
    latestStores,
    latestActivity,
  ] = await Promise.all([
    prisma.store.groupBy({ by: ["subscriptionStatus"], _count: { _all: true } }),
    prisma.user.count(),
    prisma.store.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.store.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.topupRequest.count({ where: { status: "PENDING" } }),
    prisma.topupRequest.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.supportRequest.count({ where: { status: "PENDING" } }),
    // Active stores renewing in ≤3 days whose balance can't cover the next charge.
    prisma.store.findMany({
      where: { subscriptionStatus: SubscriptionStatus.ACTIVE, subscriptionEndsAt: { gte: now, lte: in3Days } },
      select: { balance: true, monthlyPrice: true },
    }),
    prisma.plan.count({ where: { isActive: true, pricingConfigured: false } }),
    getMonthlyFinance(MONTHS, now),
    prisma.store.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: thisMonth }, status: { not: "CANCELED" } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.store.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
        balance: true,
        createdAt: true,
        plan: { select: { name: true } },
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.balanceTransaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, amount: true, createdAt: true, store: { select: { name: true, slug: true } } },
    }),
  ]);

  // Monthly series, oldest → newest.
  const months: MonthPoint[] = finance.map((m) => ({
    key: m.key,
    label: m.label,
    subscriptions: m.revenue,
    profit: m.profit,
    topups: m.topups,
    newStores: 0,
  }));
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const s of storesSince) {
    const point = byKey.get(monthKey(s.createdAt));
    if (point) point.newStores += 1;
  }

  const countBy = Object.fromEntries(statusCounts.map((r) => [r.subscriptionStatus, r._count._all])) as Partial<Record<SubscriptionStatus, number>>;
  const totalStores = statusCounts.reduce((s, r) => s + r._count._all, 0);
  const current = months[months.length - 1];
  const previous = months[months.length - 2];

  return {
    totalStores,
    totalUsers,
    statusCounts: countBy,
    newStores: { current: newStoresThisMonth, previous: newStoresLastMonth },
    subscriptionRevenue: { current: current.subscriptions, previous: previous.subscriptions },
    profit: {
      current: current.profit,
      previous: previous.profit,
      commissions: finance[finance.length - 1].commissions,
    },
    topups: { current: current.topups, previous: previous.topups },
    gmv: { amount: ordersThisMonth._sum.total ?? 0, orders: ordersThisMonth._count._all },
    queues: {
      pendingTopups,
      pendingTopupsAmount: pendingTopupsAmount._sum.amount ?? 0,
      newServices,
      newSupport,
      grace: countBy.GRACE_PERIOD ?? 0,
      pastDue: countBy.PAST_DUE ?? 0,
      atRiskRenewals: atRiskRenewals.filter((s) => s.balance < s.monthlyPrice).length,
      unconfirmedPlans,
    },
    months,
    latestStores,
    latestActivity,
  };
}

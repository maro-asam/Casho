"use server";

import { prisma } from "@/lib/prisma";
import { BalanceTransactionType, SubscriptionStatus } from "@prisma/client";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function getAdminDashboardData() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const last6Months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: formatMonthLabel(date),
      month: date.getMonth(),
      year: date.getFullYear(),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    };
  });

  const [
    storeStatusCounts,
    totalStores,
    pendingTopupRequests,
    latestStores,
    totalTopupAggregate,
    thisMonthTopupAggregate,
    recentTopupTransactions,
    topStoresGrouped,
  ] = await Promise.all([
    // Single groupBy replaces 4 separate COUNT queries (active/grace/pastDue/inactive)
    prisma.store.groupBy({
      by: ["subscriptionStatus"],
      _count: { id: true },
    }),

    // Total store count (includes CANCELED which groupBy above also covers)
    prisma.store.count(),

    prisma.topupRequest.count({
      where: { status: "PENDING" },
    }),

    // Use select instead of include to avoid loading all store columns
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
        user: {
          select: { email: true },
        },
      },
    }),

    // Total topup sum — aggregate instead of loading all rows
    prisma.balanceTransaction.aggregate({
      where: { type: BalanceTransactionType.TOPUP },
      _sum: { amount: true },
    }),

    // This-month topup sum
    prisma.balanceTransaction.aggregate({
      where: {
        type: BalanceTransactionType.TOPUP,
        createdAt: { gte: thisMonthStart },
      },
      _sum: { amount: true },
    }),

    // Last 6 months only — avoid loading the entire history into memory
    prisma.balanceTransaction.findMany({
      where: {
        type: BalanceTransactionType.TOPUP,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        createdAt: true,
        storeId: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.balanceTransaction.groupBy({
      by: ["storeId"],
      where: { type: BalanceTransactionType.TOPUP },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  // Extract status counts from the single groupBy result
  const countByStatus = Object.fromEntries(
    storeStatusCounts.map((r) => [r.subscriptionStatus, r._count.id]),
  );
  const activeStores = countByStatus[SubscriptionStatus.ACTIVE] ?? 0;
  const graceStores = countByStatus[SubscriptionStatus.GRACE_PERIOD] ?? 0;
  const pastDueStores = countByStatus[SubscriptionStatus.PAST_DUE] ?? 0;
  const inactiveStores = countByStatus[SubscriptionStatus.INACTIVE] ?? 0;

  const totalApprovedTopupsAmount = totalTopupAggregate._sum.amount ?? 0;
  const thisMonthApprovedTopupsAmount = thisMonthTopupAggregate._sum.amount ?? 0;

  const monthlyTopups = last6Months.map((month) => {
    const monthItems = recentTopupTransactions.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= month.start && itemDate < month.end;
    });

    return {
      month: month.label,
      amount: monthItems.reduce((sum, item) => sum + item.amount, 0),
      count: monthItems.length,
    };
  });

  const topStoreIds = topStoresGrouped.map((item) => item.storeId);

  const topStores = topStoreIds.length
    ? await prisma.store.findMany({
        where: { id: { in: topStoreIds } },
        select: { id: true, name: true },
      })
    : [];

  const topStoresMap = new Map(topStores.map((store) => [store.id, store.name]));

  const topStoresByTopups = topStoresGrouped.map((item) => ({
    name: topStoresMap.get(item.storeId) ?? "متجر",
    amount: item._sum.amount ?? 0,
  }));

  const statusBreakdown = [
    { label: "نشط", value: activeStores },
    { label: "فترة سماح", value: graceStores },
    { label: "متأخر", value: pastDueStores },
    { label: "غير مفعل", value: inactiveStores },
  ];

  return {
    stats: {
      totalStores,
      activeStores,
      graceStores,
      pastDueStores,
      inactiveStores,
      pendingTopupRequests,
    },

    latestStores,

    analytics: {
      totalApprovedTopupsAmount,
      thisMonthApprovedTopupsAmount,
      monthlyTopups,
      statusBreakdown,
      topStoresByTopups,
    },
  };
}

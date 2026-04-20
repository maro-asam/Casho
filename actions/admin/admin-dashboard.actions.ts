"use server";

import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, BalanceTransactionType } from "@prisma/client";

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
    totalStores,
    activeStores,
    graceStores,
    pastDueStores,
    inactiveStores,
    pendingTopupRequests,
    latestStores,
    approvedTopupTransactions,
    topStoresGrouped,
  ] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({
      where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
    }),
    prisma.store.count({
      where: { subscriptionStatus: SubscriptionStatus.GRACE_PERIOD },
    }),
    prisma.store.count({
      where: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
    }),
    prisma.store.count({
      where: { subscriptionStatus: SubscriptionStatus.INACTIVE },
    }),

    prisma.topupRequest.count({
      where: { status: "PENDING" },
    }),

    prisma.store.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),

    prisma.balanceTransaction.findMany({
      where: {
        type: BalanceTransactionType.TOPUP,
      },
      select: {
        amount: true,
        createdAt: true,
        storeId: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    prisma.balanceTransaction.groupBy({
      by: ["storeId"],
      where: {
        type: BalanceTransactionType.TOPUP,
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const totalApprovedTopupsAmount = approvedTopupTransactions.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const thisMonthApprovedTopupsAmount = approvedTopupTransactions
    .filter((item) => item.createdAt >= thisMonthStart)
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyTopups = last6Months.map((month) => {
    const monthItems = approvedTopupTransactions.filter((item) => {
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
        where: {
          id: {
            in: topStoreIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
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
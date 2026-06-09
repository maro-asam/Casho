"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { computeHealthScore } from "./customers.actions";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

export async function GetCRMDashboardStatsAction() {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prevPeriodEnd = thirtyDaysAgo;

  const [
    totalCustomers,
    newThisMonth,
    newLastMonth,
    activeCustomers,
    vipCustomers,
    totalLoyaltyEarned,
    totalLoyaltyRedeemed,
    topCustomers,
    recentCustomers,
    upcomingBirthdays,
  ] = await Promise.all([
    prisma.customer.count({ where: { storeId } }),

    prisma.customer.count({
      where: { storeId, createdAt: { gte: thirtyDaysAgo } },
    }),

    prisma.customer.count({
      where: { storeId, createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd } },
    }),

    prisma.customer.count({
      where: {
        storeId,
        orders: { some: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELED" } } },
      },
    }),

    prisma.customer.count({ where: { storeId, status: "VIP" } }),

    prisma.loyaltyTransaction.aggregate({
      where: { customer: { storeId }, type: "EARNED" },
      _sum: { points: true },
    }),

    prisma.loyaltyTransaction.aggregate({
      where: { customer: { storeId }, type: "REDEEMED" },
      _sum: { points: true },
    }),

    // Top 5 customers by spend
    prisma.order.groupBy({
      by: ["customerId"],
      where: { storeId, status: { not: "CANCELED" }, customerId: { not: null } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),

    prisma.customer.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, phone: true, createdAt: true, status: true },
    }),

    // Upcoming birthdays (next 30 days)
    prisma.customer.count({
      where: {
        storeId,
        birthday: { not: null },
        status: { not: "BLOCKED" },
      },
    }),
  ]);

  // Enrich top customers
  const topCustomerIds = topCustomers
    .filter((t) => t.customerId)
    .map((t) => t.customerId as string);

  const topCustomerDetails = await prisma.customer.findMany({
    where: { id: { in: topCustomerIds } },
    select: { id: true, name: true, phone: true, status: true },
  });

  const enrichedTop = topCustomers.map((t) => ({
    customerId: t.customerId,
    totalSpend: t._sum.total ?? 0,
    orderCount: t._count,
    customer: topCustomerDetails.find((c) => c.id === t.customerId) ?? null,
  }));

  // Customer growth (last 30 days, daily)
  const growthData = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "Customer"
    WHERE "storeId" = ${storeId}
      AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // At-risk customers (had orders, last order > 60 days ago)
  const atRiskCount = await prisma.customer.count({
    where: {
      storeId,
      orders: {
        none: { createdAt: { gte: ninetyDaysAgo }, status: { not: "CANCELED" } },
        some: { status: { not: "CANCELED" } },
      },
    },
  });

  // Wallet stats
  const walletStats = await prisma.customerWalletTransaction.aggregate({
    where: { storeId },
    _sum: { amount: true },
  });

  const newGrowthPct =
    newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : newThisMonth > 0
      ? 100
      : 0;

  return {
    totalCustomers,
    newThisMonth,
    newGrowthPct,
    activeCustomers,
    vipCustomers,
    atRiskCount,
    loyaltyStats: {
      totalEarned: totalLoyaltyEarned._sum.points ?? 0,
      totalRedeemed: totalLoyaltyRedeemed._sum.points ?? 0,
    },
    topCustomers: enrichedTop,
    recentCustomers,
    upcomingBirthdaysCount: upcomingBirthdays,
    growthData: growthData.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    totalWalletActivity: walletStats._sum.amount ?? 0,
  };
}

export async function GetCRMAnalyticsAction(period: 30 | 60 | 90 | 365 = 30) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const periodStart = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  // Customer segments distribution (by health score)
  const allCustomers = await prisma.customer.findMany({
    where: { storeId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      orders: {
        where: { status: { not: "CANCELED" } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const healthDist = { HEALTHY: 0, ACTIVE: 0, AT_RISK: 0, LOST: 0 };
  let totalLTV = 0;

  for (const c of allCustomers) {
    const lastOrderDate = c.orders[0]?.createdAt ?? null;

    const allOrders = await prisma.order.aggregate({
      where: { customerId: c.id, status: { not: "CANCELED" } },
      _sum: { total: true },
      _count: true,
    });

    const { category } = computeHealthScore({
      lastOrderDate,
      orderCount: allOrders._count,
      totalSpend: allOrders._sum.total ?? 0,
    });

    healthDist[category]++;
    totalLTV += allOrders._sum.total ?? 0;
  }

  // Retention: customers who ordered in both this period and previous period
  const prevStart = new Date(periodStart.getTime() - period * 24 * 60 * 60 * 1000);
  const [activeCurrent, activePrev, retained] = await Promise.all([
    prisma.customer.count({
      where: {
        storeId,
        orders: { some: { createdAt: { gte: periodStart }, status: { not: "CANCELED" } } },
      },
    }),
    prisma.customer.count({
      where: {
        storeId,
        orders: {
          some: {
            createdAt: { gte: prevStart, lt: periodStart },
            status: { not: "CANCELED" },
          },
        },
      },
    }),
    prisma.customer.count({
      where: {
        storeId,
        orders: {
          some: { createdAt: { gte: periodStart }, status: { not: "CANCELED" } },
        },
        AND: {
          orders: {
            some: {
              createdAt: { gte: prevStart, lt: periodStart },
              status: { not: "CANCELED" },
            },
          },
        },
      },
    }),
  ]);

  const retentionRate = activePrev > 0 ? Math.round((retained / activePrev) * 100) : 0;
  const churnRate = activePrev > 0
    ? Math.round(((activePrev - retained) / activePrev) * 100)
    : 0;

  // Repeat purchase rate
  const multiOrderCustomers = await prisma.customer.count({
    where: {
      storeId,
      orders: { some: { status: { not: "CANCELED" } } },
    },
  });

  const repeatCustomers = await prisma.customer.count({
    where: {
      storeId,
      orders: {
        some: { status: { not: "CANCELED" } },
      },
    },
  });

  // Monthly new customers trend (last 6 months)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const monthlyGrowth = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month, COUNT(*) as count
    FROM "Customer"
    WHERE "storeId" = ${storeId}
      AND "createdAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  // Status distribution
  const statusDist = await prisma.customer.groupBy({
    by: ["status"],
    where: { storeId },
    _count: true,
  });

  const avgLTV = allCustomers.length > 0 ? totalLTV / allCustomers.length : 0;

  return {
    healthDistribution: healthDist,
    retentionRate,
    churnRate,
    repeatPurchaseRate: multiOrderCustomers > 0
      ? Math.round((repeatCustomers / multiOrderCustomers) * 100)
      : 0,
    avgLTV: Math.round(avgLTV),
    totalLTV,
    monthlyGrowth: monthlyGrowth.map((m) => ({
      month: m.month,
      count: Number(m.count),
    })),
    statusDistribution: statusDist.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    activeCurrent,
    activePrev,
    retained,
  };
}

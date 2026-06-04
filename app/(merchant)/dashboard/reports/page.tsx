import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { LoyaltyTransactionType, OrderStatus } from "@prisma/client";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { PeriodSelector } from "./_components/period-selector";
import { ReportsContent } from "./_components/reports-content";
import type { ReportPeriod, ReportsData } from "./_lib/types";

const VALID_PERIODS: ReportPeriod[] = [7, 30, 90, 365];

function parsePeriod(raw: string | undefined): ReportPeriod {
  const n = parseInt(raw ?? "30") as ReportPeriod;
  return VALID_PERIODS.includes(n) ? n : 30;
}

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ARABIC_DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "الدفع عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "InstaPay",
  bank_transfer: "تحويل بنكي",
  kashier: "Kashier",
};

export default async function MerchantReportsRoute({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);

  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      settings: { select: { defaultLowStockThreshold: true } },
    },
  });

  if (!store) redirect("/");

  const storeId = store.id;
  const lowStockThreshold = store.settings?.defaultLowStockThreshold ?? 5;

  const now = new Date();
  const currentFrom = addDays(startOfDay(now), -(period - 1));
  const previousFrom = addDays(currentFrom, -period);
  const previousTo = currentFrom;

  const [
    currentOrders,
    previousOrders,
    currentVisitsAll,
    previousVisitsCount,
    allProducts,
    allCustomers,
    coupons,
    allReviews,
    loyaltyTransactions,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, createdAt: { gte: currentFrom } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.order.findMany({
      where: { storeId, createdAt: { gte: previousFrom, lt: previousTo } },
      select: { total: true, status: true, discount: true },
    }),

    prisma.visit.findMany({
      where: { storeId, createdAt: { gte: currentFrom } },
      select: { createdAt: true },
    }),

    prisma.visit.count({
      where: { storeId, createdAt: { gte: previousFrom, lt: previousTo } },
    }),

    prisma.product.findMany({
      where: { storeId },
      include: { category: { select: { name: true } } },
    }),

    prisma.customer.findMany({
      where: { storeId },
      include: {
        orders: {
          select: { total: true, createdAt: true, status: true },
        },
      },
    }),

    prisma.coupon.findMany({
      where: { storeId },
      include: {
        appliedCoupons: { where: { createdAt: { gte: currentFrom } } },
      },
    }),

    prisma.productReview.findMany({
      where: { storeId },
      include: { product: { select: { name: true } } },
    }),

    prisma.loyaltyTransaction.findMany({
      where: { customer: { storeId }, createdAt: { gte: currentFrom } },
    }),
  ]);

  // ── KPI Computation ──────────────────────────────────────────
  const validCurrent = currentOrders.filter(
    (o) => o.status !== OrderStatus.CANCELED,
  );
  const validPrevious = previousOrders.filter(
    (o) => o.status !== OrderStatus.CANCELED,
  );

  const totalRevenue = validCurrent.reduce((s, o) => s + o.total, 0);
  const previousRevenue = validPrevious.reduce((s, o) => s + o.total, 0);

  const netStatuses: string[] = ["PAID", "SHIPPED", "DELIVERED"];
  const netCurrent = currentOrders.filter((o) => netStatuses.includes(o.status));
  const netPrevious = previousOrders.filter((o) =>
    netStatuses.includes(o.status as string),
  );
  const netSales = netCurrent.reduce((s, o) => s + o.total, 0);
  const previousNetSales = netPrevious.reduce((s, o) => s + o.total, 0);

  const totalOrders = currentOrders.length;
  const previousOrdersCount = previousOrders.length;
  const totalVisits = currentVisitsAll.length;

  const conversionRate =
    totalVisits > 0 ? (validCurrent.length / totalVisits) * 100 : 0;
  const prevConversionRate =
    previousVisitsCount > 0
      ? (validPrevious.length / previousVisitsCount) * 100
      : 0;

  const aov =
    validCurrent.length > 0
      ? Math.round(totalRevenue / validCurrent.length)
      : 0;
  const prevAov =
    validPrevious.length > 0
      ? Math.round(previousRevenue / validPrevious.length)
      : 0;

  const canceledCount = currentOrders.filter(
    (o) => o.status === OrderStatus.CANCELED,
  ).length;
  const cancelRate =
    totalOrders > 0 ? (canceledCount / totalOrders) * 100 : 0;
  const prevCanceledCount = previousOrders.filter(
    (o) => o.status === OrderStatus.CANCELED,
  ).length;
  const prevCancelRate =
    previousOrdersCount > 0
      ? (prevCanceledCount / previousOrdersCount) * 100
      : 0;

  const totalDiscount = currentOrders.reduce((s, o) => s + (o.discount || 0), 0);
  const previousDiscount = previousOrders.reduce(
    (s, o) => s + (o.discount || 0),
    0,
  );
  const discountPercentage =
    totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;

  // ── Daily Time-Series ─────────────────────────────────────────
  const dailyData = Array.from({ length: period }).map((_, i) => {
    const date = addDays(startOfDay(now), -(period - 1 - i));
    const nextDate = addDays(date, 1);
    const key = date.toISOString().split("T")[0];

    const dayOrders = currentOrders.filter(
      (o) => o.createdAt >= date && o.createdAt < nextDate,
    );
    const dayValid = dayOrders.filter(
      (o) => o.status !== OrderStatus.CANCELED,
    );
    const dayVisits = currentVisitsAll.filter(
      (v) => v.createdAt >= date && v.createdAt < nextDate,
    );

    return {
      date: key,
      label: new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
      }).format(date),
      revenue: dayValid.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
      visits: dayVisits.length,
    };
  });

  // ── Status Distribution ────────────────────────────────────────
  const statusData = [
    {
      name: "معلق",
      value: currentOrders.filter((o) => o.status === "PENDING").length,
      status: "PENDING",
    },
    {
      name: "مدفوع",
      value: currentOrders.filter((o) => o.status === "PAID").length,
      status: "PAID",
    },
    {
      name: "تم الشحن",
      value: currentOrders.filter((o) => o.status === "SHIPPED").length,
      status: "SHIPPED",
    },
    {
      name: "تم التسليم",
      value: currentOrders.filter((o) => o.status === "DELIVERED").length,
      status: "DELIVERED",
    },
    {
      name: "ملغي",
      value: currentOrders.filter((o) => o.status === "CANCELED").length,
      status: "CANCELED",
    },
  ];

  // ── Payment Method Breakdown ───────────────────────────────────
  const paymentMap = new Map<string, { orders: number; revenue: number }>();
  for (const order of validCurrent) {
    const method = order.paymentMethod;
    const cur = paymentMap.get(method) ?? { orders: 0, revenue: 0 };
    cur.orders++;
    cur.revenue += order.total;
    paymentMap.set(method, cur);
  }
  const paymentMethodData = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method] ?? method,
      ...data,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Day of Week ────────────────────────────────────────────────
  const dowMap = new Map(
    ARABIC_DAYS.map((d) => [d, { orders: 0, revenue: 0 }]),
  );
  for (const order of validCurrent) {
    const dayName = ARABIC_DAYS[order.createdAt.getDay()];
    const cur = dowMap.get(dayName)!;
    cur.orders++;
    cur.revenue += order.total;
  }
  const dayOfWeekData = ARABIC_DAYS.map((day) => ({
    day,
    ...dowMap.get(day)!,
  }));

  // ── Hourly Distribution ────────────────────────────────────────
  const hourMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) hourMap.set(h, 0);
  for (const order of validCurrent) {
    const h = order.createdAt.getHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const hourlyData = Array.from(hourMap.entries()).map(([hour, orders]) => ({
    hour: `${hour}:00`,
    orders,
  }));

  // ── Products Performance ───────────────────────────────────────
  const productStatsMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      sold: number;
      revenue: number;
      stock: number;
    }
  >();

  for (const order of validCurrent) {
    for (const item of order.items) {
      const cur = productStatsMap.get(item.productId);
      if (cur) {
        cur.sold += item.quantity;
        cur.revenue += item.price * item.quantity;
      } else {
        productStatsMap.set(item.productId, {
          id: item.productId,
          name: item.product.name,
          category: item.product.category.name,
          sold: item.quantity,
          revenue: item.price * item.quantity,
          stock: item.product.stock,
        });
      }
    }
  }

  const allProductStats = Array.from(productStatsMap.values());
  const maxProductRevenue = Math.max(
    ...allProductStats.map((p) => p.revenue),
    1,
  );

  const topProductsByRevenue = allProductStats
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p) => ({
      ...p,
      performance: Math.round((p.revenue / maxProductRevenue) * 100),
    }));

  const maxProductQty = Math.max(...allProductStats.map((p) => p.sold), 1);
  const topProductsByQuantity = [...allProductStats]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map((p) => ({
      ...p,
      performance: Math.round((p.sold / maxProductQty) * 100),
    }));

  const soldProductIds = new Set(productStatsMap.keys());
  const productsWithNoSales = allProducts
    .filter((p) => p.isActive && !soldProductIds.has(p.id))
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category.name,
      stock: p.stock,
    }));

  // ── Category Breakdown ─────────────────────────────────────────
  const categoryMap = new Map<
    string,
    { name: string; revenue: number; orders: number }
  >();
  for (const order of validCurrent) {
    for (const item of order.items) {
      const catName = item.product.category.name;
      const cur = categoryMap.get(catName) ?? {
        name: catName,
        revenue: 0,
        orders: 0,
      };
      cur.revenue += item.price * item.quantity;
      cur.orders += item.quantity;
      categoryMap.set(catName, cur);
    }
  }
  const categoryData = Array.from(categoryMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  // ── Customers ─────────────────────────────────────────────────
  const newCustomersThisPeriod = allCustomers.filter(
    (c) => new Date(c.createdAt) >= currentFrom,
  ).length;

  const customersWithOrdersThisPeriod = allCustomers.filter((c) =>
    c.orders.some(
      (o) =>
        new Date(o.createdAt) >= currentFrom &&
        o.status !== OrderStatus.CANCELED,
    ),
  );

  const topCustomers = customersWithOrdersThisPeriod
    .map((c) => {
      const periodOrders = c.orders.filter(
        (o) =>
          new Date(o.createdAt) >= currentFrom &&
          o.status !== OrderStatus.CANCELED,
      );
      return {
        phone: c.phone,
        name: c.name ?? "عميل",
        orders: periodOrders.length,
        totalSpend: periodOrders.reduce((s, o) => s + o.total, 0),
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10);

  // ── Loyalty ────────────────────────────────────────────────────
  const totalLoyaltyEarned = loyaltyTransactions
    .filter((t) => t.type === LoyaltyTransactionType.EARNED)
    .reduce((s, t) => s + t.points, 0);
  const totalLoyaltyRedeemed = loyaltyTransactions
    .filter((t) => t.type === LoyaltyTransactionType.REDEEMED)
    .reduce((s, t) => s + Math.abs(t.points), 0);

  // ── Inventory ──────────────────────────────────────────────────
  const activeProducts = allProducts.filter((p) => p.isActive);
  const outOfStock = activeProducts.filter((p) => p.stock === 0);
  const lowStockList = activeProducts
    .filter(
      (p) =>
        p.stock > 0 &&
        p.stock <= (p.lowStockThreshold ?? lowStockThreshold),
    )
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20);

  // ── Reviews ────────────────────────────────────────────────────
  const totalReviews = allReviews.length;
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0;
  const reviewDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: allReviews.filter((r) => r.rating === rating).length,
  }));

  // ── Coupons ────────────────────────────────────────────────────
  const couponData = coupons
    .map((c) => {
      const ordersWithCoupon = validCurrent.filter(
        (o) => o.couponCode === c.code,
      );
      const couponDiscount = ordersWithCoupon.reduce(
        (s, o) => s + (o.discount || 0),
        0,
      );
      return {
        id: c.id,
        code: c.code,
        type: c.type as string,
        value: c.value,
        usedThisPeriod: c.appliedCoupons.length,
        totalDiscount: couponDiscount,
        isActive: c.isActive,
        expiresAt: c.expiresAt,
      };
    })
    .sort((a, b) => b.usedThisPeriod - a.usedThisPeriod);

  // ── Assemble Data Object ───────────────────────────────────────
  const data: ReportsData = {
    period,
    storeName: store.name,

    kpis: {
      revenue: { current: totalRevenue, previous: previousRevenue },
      netSales: { current: netSales, previous: previousNetSales },
      orders: { current: totalOrders, previous: previousOrdersCount },
      visits: { current: totalVisits, previous: previousVisitsCount },
      conversionRate: {
        current: conversionRate,
        previous: prevConversionRate,
      },
      aov: { current: aov, previous: prevAov },
      cancelRate: { current: cancelRate, previous: prevCancelRate },
      totalDiscount: { current: totalDiscount, previous: previousDiscount },
    },

    dailyData,
    statusData,
    paymentMethodData,
    dayOfWeekData,
    hourlyData,

    topProductsByRevenue,
    topProductsByQuantity,
    categoryData,
    productsWithNoSales,

    customerStats: {
      total: allCustomers.length,
      newThisPeriod: newCustomersThisPeriod,
      withOrders: customersWithOrdersThisPeriod.length,
    },
    topCustomers,
    loyaltyStats: {
      totalEarned: totalLoyaltyEarned,
      totalRedeemed: totalLoyaltyRedeemed,
    },

    inventoryStats: {
      activeProducts: activeProducts.length,
      lowStock: lowStockList.length,
      outOfStock: outOfStock.length,
    },
    lowStockProducts: lowStockList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category.name,
      stock: p.stock,
      threshold: p.lowStockThreshold ?? lowStockThreshold,
    })),

    reviewStats: {
      total: totalReviews,
      avgRating,
      distribution: reviewDistribution,
    },

    couponData,
    totalDiscount,
    discountPercentage,
  };

  return (
    <div dir="rtl" className="space-y-6">
      <DashboardSectionHeader
        icon={BarChart3}
        title="التقارير والتحليلات"
        description="تحليل عميق وشامل لكل جوانب متجرك — مبيعات، منتجات، عملاء، مخزون، كوبونات وأكتر."
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          البيانات المعروضة لآخر{" "}
          <span className="font-bold text-foreground">{period}</span> يوم
        </p>
        <PeriodSelector current={period} />
      </div>

      <ReportsContent data={data} />
    </div>
  );
}

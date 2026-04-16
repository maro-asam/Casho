import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Clock3,
  CheckCircle2,
  Eye,
} from "lucide-react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  return ((current - previous) / previous) * 100;
}

function formatPercentageChange(value: number) {
  const rounded = Math.abs(value).toFixed(1);
  return `%${rounded}`;
}

const DashboardStats = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-5">
        <Card className="overflow-hidden rounded-[28px] border border-border/60 bg-background shadow-sm 2xl:col-span-5">
          <CardContent className="flex h-40 items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <p className="text-lg font-bold text-foreground">
                لا يوجد متجر بعد
              </p>
              <p className="text-sm text-muted-foreground">
                أنشئ متجرك أولًا حتى تظهر الإحصائيات هنا
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const now = new Date();

  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );
  const endOfPreviousMonth = startOfCurrentMonth;

  const [
    totalRevenueResult,
    totalOrders,
    pendingOrders,
    completedOrders,
    currentMonthRevenueResult,
    previousMonthRevenueResult,
    currentMonthOrders,
    previousMonthOrders,
    currentMonthPendingOrders,
    previousMonthPendingOrders,
    currentMonthCompletedOrders,
    previousMonthCompletedOrders,
    totalVisits,
    currentMonthVisits,
    previousMonthVisits,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: {
          in: ["PAID", "SHIPPED", "DELIVERED"],
        },
      },
      _sum: {
        total: true,
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "DELIVERED",
      },
    }),

    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: {
          in: ["PAID", "SHIPPED", "DELIVERED"],
        },
        createdAt: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: {
        total: true,
      },
    }),

    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: {
          in: ["PAID", "SHIPPED", "DELIVERED"],
        },
        createdAt: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
      _sum: {
        total: true,
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "PENDING",
        createdAt: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "PENDING",
        createdAt: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "DELIVERED",
        createdAt: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
    }),

    prisma.order.count({
      where: {
        storeId: store.id,
        status: "DELIVERED",
        createdAt: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
    }),

    prisma.visit.count({
      where: {
        storeId: store.id,
      },
    }),

    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
    }),

    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: startOfPreviousMonth,
          lt: endOfPreviousMonth,
        },
      },
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.total ?? 0;

  const currentMonthRevenue = currentMonthRevenueResult._sum.total ?? 0;
  const previousMonthRevenue = previousMonthRevenueResult._sum.total ?? 0;

  const revenueChange = calculatePercentageChange(
    currentMonthRevenue,
    previousMonthRevenue,
  );

  const ordersChange = calculatePercentageChange(
    currentMonthOrders,
    previousMonthOrders,
  );

  const pendingOrdersChange = calculatePercentageChange(
    currentMonthPendingOrders,
    previousMonthPendingOrders,
  );

  const completedOrdersChange = calculatePercentageChange(
    currentMonthCompletedOrders,
    previousMonthCompletedOrders,
  );

  const visitsChange = calculatePercentageChange(
    currentMonthVisits,
    previousMonthVisits,
  );

  const stats = [
    {
      title: "عدد الزيارات",
      value: formatNumber(totalVisits),
      change: visitsChange,
      note: "مقارنة بالشهر الماضي",
      icon: Eye,
      iconWrap: "bg-indigo-500/10",
      iconColor: "text-indigo-600",
      trendPositive: "bg-indigo-500/10 text-indigo-600",
    },
    {
      title: "إجمالي الأرباح",
      value: formatPrice(totalRevenue),
      change: revenueChange,
      note: "مقارنة بالشهر الماضي",
      icon: Wallet,
      iconWrap: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      trendPositive: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "إجمالي الطلبات",
      value: formatNumber(totalOrders),
      change: ordersChange,
      note: "مقارنة بالشهر الماضي",
      icon: ShoppingCart,
      iconWrap: "bg-sky-500/10",
      iconColor: "text-sky-600",
      trendPositive: "bg-sky-500/10 text-sky-600",
    },
    {
      title: "الطلبات المعلقة",
      value: formatNumber(pendingOrders),
      change: pendingOrdersChange,
      note: "مقارنة بالشهر الماضي",
      icon: Clock3,
      iconWrap: "bg-amber-500/10",
      iconColor: "text-amber-600",
      trendPositive: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "الطلبات المكتملة",
      value: formatNumber(completedOrders),
      change: completedOrdersChange,
      note: "مقارنة بالشهر الماضي",
      icon: CheckCircle2,
      iconWrap: "bg-violet-500/10",
      iconColor: "text-violet-600",
      trendPositive: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-5">
      {stats.map((stat) => {
        const isPositive = stat.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="group overflow-hidden border border-border/60 transition-all duration-300"
          >
            <CardContent className="p-5">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
                    {stat.value}
                  </h3>
                </div>

                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${stat.iconWrap}`}
                >
                  <Icon className={`size-5 ${stat.iconColor}`} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${
                    isPositive
                      ? stat.trendPositive
                      : "bg-rose-500/10 text-rose-600"
                  }`}
                >
                  <TrendIcon className="size-4" />
                  <span>{formatPercentageChange(stat.change)}</span>
                </div>

                <span className="text-sm text-muted-foreground">
                  {stat.note}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};

export default DashboardStats;

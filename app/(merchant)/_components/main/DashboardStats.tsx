import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Eye,
  MousePointerClick,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
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
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  const rounded = Math.abs(value).toFixed(1);

  return `${prefix}${rounded}%`;
}

const profitableStatuses = ["PAID", "SHIPPED", "DELIVERED"] as const;

const DashboardStats = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return (
      <Card className="overflow-hidden ... border-border bg-background shadow-sm">
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          لا يوجد متجر بعد
        </div>
      </Card>
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
      where: { storeId: store.id, status: { in: [...profitableStatuses] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { storeId: store.id } }),
    prisma.order.count({ where: { storeId: store.id, status: "PENDING" } }),
    prisma.order.count({ where: { storeId: store.id, status: "DELIVERED" } }),
    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: { in: [...profitableStatuses] },
        createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        storeId: store.id,
        status: { in: [...profitableStatuses] },
        createdAt: { gte: startOfPreviousMonth, lt: endOfPreviousMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: { gte: startOfPreviousMonth, lt: endOfPreviousMonth },
      },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        status: "PENDING",
        createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        status: "PENDING",
        createdAt: { gte: startOfPreviousMonth, lt: endOfPreviousMonth },
      },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        status: "DELIVERED",
        createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
    }),
    prisma.order.count({
      where: {
        storeId: store.id,
        status: "DELIVERED",
        createdAt: { gte: startOfPreviousMonth, lt: endOfPreviousMonth },
      },
    }),
    prisma.visit.count({ where: { storeId: store.id } }),
    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
    }),
    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: { gte: startOfPreviousMonth, lt: endOfPreviousMonth },
      },
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.total ?? 0;
  const currentMonthRevenue = currentMonthRevenueResult._sum.total ?? 0;
  const previousMonthRevenue = previousMonthRevenueResult._sum.total ?? 0;

  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const currentMonthAOV =
    currentMonthOrders > 0
      ? Math.round(currentMonthRevenue / currentMonthOrders)
      : 0;
  const previousMonthAOV =
    previousMonthOrders > 0
      ? Math.round(previousMonthRevenue / previousMonthOrders)
      : 0;

  const cvr = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
  const currentMonthCVR =
    currentMonthVisits > 0
      ? (currentMonthOrders / currentMonthVisits) * 100
      : 0;
  const previousMonthCVR =
    previousMonthVisits > 0
      ? (previousMonthOrders / previousMonthVisits) * 100
      : 0;

  const stats = [
    {
      title: "الزيارات",
      value: formatNumber(totalVisits),
      change: calculatePercentageChange(
        currentMonthVisits,
        previousMonthVisits,
      ),
      icon: Eye,
      iconClassName: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "إجمالي الأرباح",
      value: formatPrice(totalRevenue),
      change: calculatePercentageChange(
        currentMonthRevenue,
        previousMonthRevenue,
      ),
      icon: Wallet,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "متوسط الطلب",
      value: formatPrice(aov),
      change: calculatePercentageChange(currentMonthAOV, previousMonthAOV),
      icon: Receipt,
      iconClassName: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      title: "معدل التحويل",
      value: `${cvr.toFixed(1)}%`,
      change: calculatePercentageChange(currentMonthCVR, previousMonthCVR),
      icon: MousePointerClick,
      iconClassName: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: "إجمالي الطلبات",
      value: formatNumber(totalOrders),
      change: calculatePercentageChange(
        currentMonthOrders,
        previousMonthOrders,
      ),
      icon: ShoppingCart,
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      title: "طلبات معلقة",
      value: formatNumber(pendingOrders),
      change: calculatePercentageChange(
        currentMonthPendingOrders,
        previousMonthPendingOrders,
      ),
      icon: Clock3,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "طلبات مكتملة",
      value: formatNumber(completedOrders),
      change: calculatePercentageChange(
        currentMonthCompletedOrders,
        previousMonthCompletedOrders,
      ),
      icon: CheckCircle2,
      iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
      {stats.map((stat) => {
        const isPositive = stat.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="border-border bg-background shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-lg",
                    stat.iconClassName,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  <TrendIcon className="size-2.5" />
                  {formatPercentageChange(stat.change)}
                </span>
              </div>
              <p className="text-xl font-bold tracking-tight xl:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {stat.title}
              </p>
            </div>
          </Card>
        );
      })}
    </section>
  );
};

export default DashboardStats;

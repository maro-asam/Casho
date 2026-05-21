import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Eye,
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
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-5">
        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 2xl:col-span-5">
          <CardContent className="flex h-40 items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <p className="text-lg font-bold text-foreground">لا يوجد متجر بعد</p>
              <p className="text-sm text-muted-foreground">
                أنشئ متجرك الأول حتى تظهر الإحصائيات هنا.
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
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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
        status: { in: [...profitableStatuses] },
      },
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

  const stats = [
    {
      title: "الزيارات",
      subtitle: "Traffic",
      value: formatNumber(totalVisits),
      change: calculatePercentageChange(currentMonthVisits, previousMonthVisits),
      note: "هذا الشهر مقارنة بالسابق",
      icon: Eye,
      accent: "from-indigo-500/25 to-indigo-500/5",
      iconClassName: "bg-indigo-500/10 text-indigo-600",
    },
    {
      title: "إجمالي الأرباح",
      subtitle: "Revenue",
      value: formatPrice(totalRevenue),
      change: calculatePercentageChange(currentMonthRevenue, previousMonthRevenue),
      note: "الطلبات المدفوعة والمكتملة",
      icon: Wallet,
      accent: "from-emerald-500/25 to-emerald-500/5",
      iconClassName: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "إجمالي الطلبات",
      subtitle: "Orders",
      value: formatNumber(totalOrders),
      change: calculatePercentageChange(currentMonthOrders, previousMonthOrders),
      note: "كل حالات الطلبات",
      icon: ShoppingCart,
      accent: "from-sky-500/25 to-sky-500/5",
      iconClassName: "bg-sky-500/10 text-sky-600",
    },
    {
      title: "طلبات معلقة",
      subtitle: "Pending",
      value: formatNumber(pendingOrders),
      change: calculatePercentageChange(currentMonthPendingOrders, previousMonthPendingOrders),
      note: "محتاجة متابعة تشغيلية",
      icon: Clock3,
      accent: "from-amber-500/25 to-amber-500/5",
      iconClassName: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "طلبات مكتملة",
      subtitle: "Fulfilled",
      value: formatNumber(completedOrders),
      change: calculatePercentageChange(currentMonthCompletedOrders, previousMonthCompletedOrders),
      note: "مؤشر جودة التسليم",
      icon: CheckCircle2,
      accent: "from-violet-500/25 to-violet-500/5",
      iconClassName: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const isPositive = stat.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="group relative overflow-hidden rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b", stat.accent)} />
            <CardContent className="relative p-5">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.subtitle}
                  </p>
                  <p className="truncate text-sm font-bold text-muted-foreground">
                    {stat.title}
                  </p>
                </div>
                <div className={cn("grid size-11 place-items-center rounded-2xl", stat.iconClassName)}>
                  <Icon className="size-5" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
                  {stat.value}
                </h3>

                <div className="flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                      isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
                    )}
                  >
                    <TrendIcon className="size-3.5" />
                    <span>{formatPercentageChange(stat.change)}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {stat.note}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};

export default DashboardStats;

import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderStatus } from "@prisma/client";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { MerchantReportsCharts } from "./_components/merchant-reports-charts";

const numberFormatter = new Intl.NumberFormat("ar-EG");

const moneyFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const formatMoney = (amountInPiasters: number) =>
  moneyFormatter.format(amountInPiasters / 100);

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getChange = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

const formatChange = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const getArabicDay = (date: Date) =>
  new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);

function getStatusMeta(status: OrderStatus) {
  const meta: Record<
    OrderStatus,
    { label: string; className: string }
  > = {
    PENDING: {
      label: "معلق",
      className:
        "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
    },
    PAID: {
      label: "مدفوع",
      className:
        "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
    },
    SHIPPED: {
      label: "تم الشحن",
      className:
        "bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300",
    },
    DELIVERED: {
      label: "تم التسليم",
      className:
        "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
    },
    CANCELED: {
      label: "ملغي",
      className:
        "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
    },
  };
  return meta[status];
}

async function getReportsData() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true, balance: true },
  });

  if (!store) redirect("/dashboard");

  const now = new Date();
  const currentFrom = addDays(startOfDay(now), -29);
  const previousFrom = addDays(currentFrom, -30);
  const previousTo = currentFrom;

  const [
    currentOrders,
    previousOrders,
    currentVisits,
    previousVisits,
    orderItems,
    recentOrders,
    productsCount,
    lowStockCount,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id, createdAt: { gte: currentFrom } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: previousFrom, lt: previousTo },
      },
    }),
    prisma.visit.findMany({
      where: { storeId: store.id, createdAt: { gte: currentFrom } },
      select: { id: true, createdAt: true },
    }),
    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: { gte: previousFrom, lt: previousTo },
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          storeId: store.id,
          createdAt: { gte: currentFrom },
          status: { not: OrderStatus.CANCELED },
        },
      },
      include: { product: { include: { category: true } } },
    }),
    prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.count({ where: { storeId: store.id, isActive: true } }),
    prisma.product.count({
      where: { storeId: store.id, isActive: true, stock: { lte: 5 } },
    }),
  ]);

  const validCurrentOrders = currentOrders.filter(
    (o) => o.status !== OrderStatus.CANCELED,
  );
  const validPreviousOrders = previousOrders.filter(
    (o) => o.status !== OrderStatus.CANCELED,
  );

  const totalRevenue = validCurrentOrders.reduce((s, o) => s + o.total, 0);
  const previousRevenue = validPreviousOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = currentOrders.length;
  const previousOrdersCount = previousOrders.length;
  const totalVisits = currentVisits.length;

  const conversionRate =
    totalVisits > 0 ? (validCurrentOrders.length / totalVisits) * 100 : 0;
  const previousConversionRate =
    previousVisits > 0
      ? (validPreviousOrders.length / previousVisits) * 100
      : 0;

  const paidOrDeliveredOrders = currentOrders.filter(
    (o) =>
      o.status === OrderStatus.PAID ||
      o.status === OrderStatus.SHIPPED ||
      o.status === OrderStatus.DELIVERED,
  );
  const netSales = paidOrDeliveredOrders.reduce((s, o) => s + o.total, 0);
  const averageOrderValue =
    validCurrentOrders.length > 0
      ? Math.round(totalRevenue / validCurrentOrders.length)
      : 0;

  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startOfDay(now), i - 6);
    const nextDate = addDays(date, 1);
    const dayOrders = currentOrders.filter(
      (o) => o.createdAt >= date && o.createdAt < nextDate,
    );
    const dayValidOrders = dayOrders.filter(
      (o) => o.status !== OrderStatus.CANCELED,
    );
    const dayVisits = currentVisits.filter(
      (v) => v.createdAt >= date && v.createdAt < nextDate,
    );
    return {
      day: getArabicDay(date),
      sales: dayValidOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
      visits: dayVisits.length,
    };
  });

  const statusData = Object.values(OrderStatus).map((status) => ({
    name: getStatusMeta(status).label,
    value: currentOrders.filter((o) => o.status === status).length,
    status,
  }));

  const productStatsMap = new Map<
    string,
    { id: string; name: string; category: string; sold: number; revenue: number; stock: number }
  >();
  for (const item of orderItems) {
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
  const maxProductRevenue = Math.max(
    ...Array.from(productStatsMap.values()).map((p) => p.revenue),
    1,
  );
  const topProducts = Array.from(productStatsMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((p) => ({
      ...p,
      performance: Math.round((p.revenue / maxProductRevenue) * 100),
    }));

  const bestDay = [...days].sort((a, b) => b.sales - a.sales)[0];

  const kpis = [
    {
      title: "إجمالي المبيعات",
      value: formatMoney(totalRevenue),
      change: getChange(totalRevenue, previousRevenue),
      description: "مقارنة بآخر 30 يوم",
      icon: Wallet,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "عدد الطلبات",
      value: numberFormatter.format(totalOrders),
      change: getChange(totalOrders, previousOrdersCount),
      description: "كل الطلبات خلال 30 يوم",
      icon: Receipt,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      title: "زيارات المتجر",
      value: numberFormatter.format(totalVisits),
      change: getChange(totalVisits, previousVisits),
      description: "زيارات مسجلة على المتجر",
      icon: Eye,
      iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "معدل التحويل",
      value: `${conversionRate.toFixed(2)}%`,
      change: getChange(conversionRate, previousConversionRate),
      description: "من الزيارات لطلبات فعلية",
      icon: Users,
      iconClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  return {
    store,
    kpis,
    revenueData: days,
    statusData,
    topProducts,
    recentOrders,
    totalRevenue,
    netSales,
    averageOrderValue,
    bestDay,
    paidOrDeliveredOrdersCount: paidOrDeliveredOrders.length,
    productsCount,
    lowStockCount,
  };
}

const MerchantReportsRoute = async () => {
  const reports = await getReportsData();

  return (
    <div dir="rtl" className="space-y-6">
      <DashboardSectionHeader
        icon={BarChart3}
        title="التقارير والتحليلات"
        description="راقب أداء متجرك، المبيعات، الطلبات، الزيارات، وأفضل المنتجات من مكان واحد."
      />

      {/* Hero + product health */}
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="relative overflow-hidden ... border-border shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/7 via-transparent to-transparent" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:items-center">
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-primary/10 text-primary"
                >
                  ملخص آخر 30 يوم
                </Badge>

                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                  {reports.bestDay.sales > 0
                    ? `${reports.bestDay.day} أقوى يوم مبيعات في آخر أسبوع`
                    : "لسه مفيش بيانات كافية لعرض توصية"}
                </h2>

                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  إجمالي المبيعات{" "}
                  <span className="font-bold text-foreground">
                    {formatMoney(reports.totalRevenue)}
                  </span>
                  ، وصافي الطلبات المدفوعة والمسلمة{" "}
                  <span className="font-bold text-foreground">
                    {formatMoney(reports.netSales)}
                  </span>
                  .
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  صافي المبيعات
                </p>
                <p className="mt-1.5 text-3xl font-bold">
                  {formatMoney(reports.netSales)}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">طلبات فعالة</span>
                    <span className="font-bold">
                      {numberFormatter.format(reports.paidOrDeliveredOrdersCount)}
                    </span>
                  </div>
                  <Progress
                    value={
                      reports.totalRevenue > 0
                        ? Math.min(
                            Math.round(
                              (reports.netSales / reports.totalRevenue) * 100,
                            ),
                            100,
                          )
                        : 0
                    }
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="... border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Package className="size-4" />
              </span>
              حالة المنتجات
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 p-6 pt-0">
            <div className="rounded-2xl border border-border bg-muted/20 p-5">
              <p className="text-xs font-medium text-muted-foreground">
                منتجات نشطة
              </p>
              <p className="mt-2 text-3xl font-bold">
                {numberFormatter.format(reports.productsCount)}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <p className="text-xs font-medium text-muted-foreground">
                مخزون منخفض
              </p>
              <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">
                {numberFormatter.format(reports.lowStockCount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                مخزون 5 قطع أو أقل
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reports.kpis.map((item) => {
          const Icon = item.icon;
          const isUp = item.change >= 0;
          const TrendIcon = isUp ? TrendingUp : TrendingDown;

          return (
            <Card
              key={item.title}
              className="border-border bg-background shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "grid size-8 place-items-center rounded-lg",
                      item.iconClass,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                      isUp
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    <TrendIcon className="size-2.5" />
                    {formatChange(item.change)}
                  </span>
                </div>

                <p className="text-2xl font-bold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {item.description}
                </p>
              </div>
            </Card>
          );
        })}
      </section>

      <MerchantReportsCharts
        revenueData={reports.revenueData}
        statusData={reports.statusData}
      />

      {/* Sales details + recent orders */}
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="... border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-4" />
              </span>
              تفاصيل المبيعات
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  متوسط قيمة الطلب
                </p>
                <p className="mt-1.5 text-2xl font-bold">
                  {formatMoney(reports.averageOrderValue)}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  أعلى يوم مبيعات
                </p>
                <p className="mt-1.5 text-2xl font-bold">
                  {reports.bestDay.day}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatMoney(reports.bestDay.sales)}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  طلبات فعالة
                </p>
                <p className="mt-1.5 text-2xl font-bold">
                  {numberFormatter.format(reports.paidOrDeliveredOrdersCount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="... border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="size-4" />
              </span>
              آخر الطلبات
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="ps-6 text-right text-xs font-medium text-muted-foreground">
                    الطلب
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    العميل
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    الحالة
                  </TableHead>
                  <TableHead className="pe-6 text-right text-xs font-medium text-muted-foreground">
                    المبلغ
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      لا توجد طلبات حتى الآن
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.recentOrders.map((order) => {
                    const status = getStatusMeta(order.status);
                    return (
                      <TableRow
                        key={order.id}
                        className="border-border/30 transition-colors hover:bg-muted/20"
                      >
                        <TableCell className="py-3.5 ps-6">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-sm font-bold text-primary hover:underline"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat("ar-EG", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(order.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm font-medium">
                          {order.fullName}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge
                            className={cn(
                              "rounded-full border-0 text-xs",
                              status.className,
                            )}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="pe-6 py-3.5 text-sm font-bold">
                          {formatMoney(order.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Top products */}
      <Card className="... border-border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </span>
            أفضل المنتجات أداءً
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            المنتجات الأعلى مبيعًا وإيرادًا خلال آخر 30 يوم
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="ps-6 text-right text-xs font-medium text-muted-foreground">
                  المنتج
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  القسم
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  المبيعات
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  الإيراد
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  المخزون
                </TableHead>
                <TableHead className="pe-6 text-right text-xs font-medium text-muted-foreground">
                  الأداء
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reports.topProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    لا توجد مبيعات منتجات حتى الآن
                  </TableCell>
                </TableRow>
              ) : (
                reports.topProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="py-3.5 ps-6 text-sm font-bold">
                      {product.name}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm font-medium">
                      {numberFormatter.format(product.sold)} قطعة
                    </TableCell>
                    <TableCell className="py-3.5 text-sm font-bold">
                      {formatMoney(product.revenue)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge
                        className={cn(
                          "rounded-full border-0 text-xs",
                          product.stock <= 5
                            ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                            : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
                        )}
                      >
                        {numberFormatter.format(product.stock)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-6 py-3.5">
                      <div className="flex min-w-32 items-center gap-3">
                        <Progress
                          value={product.performance}
                          className="h-1.5"
                        />
                        <span className="text-xs font-bold text-muted-foreground">
                          {product.performance}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantReportsRoute;

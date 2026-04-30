import crypto from "node:crypto";

import { OrderStatus } from "@prisma/client";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Package,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MerchantReportsCharts } from "./_components/merchant-reports-charts";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";

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

const getTokenHash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getSessionToken = async () => {
  const cookieStore = await cookies();

  return (
    cookieStore.get("session")?.value ||
    cookieStore.get("sessionToken")?.value ||
    cookieStore.get("auth_session")?.value ||
    cookieStore.get("casho_session")?.value ||
    null
  );
};

const getCurrentUser = async () => {
  const token = await getSessionToken();

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: getTokenHash(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
};

const statusMeta: Record<
  OrderStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "قيد المراجعة",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  },
  PAID: {
    label: "مدفوع",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  },
  SHIPPED: {
    label: "تم الشحن",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
  },
  DELIVERED: {
    label: "تم التسليم",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  CANCELED: {
    label: "ملغي",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  },
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

async function getReportsData() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const store = await prisma.store.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
    },
  });

  if (!store) {
    redirect("/dashboard");
  }

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
      where: {
        storeId: store.id,
        createdAt: {
          gte: currentFrom,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.order.findMany({
      where: {
        storeId: store.id,
        createdAt: {
          gte: previousFrom,
          lt: previousTo,
        },
      },
    }),

    prisma.visit.findMany({
      where: {
        storeId: store.id,
        createdAt: {
          gte: currentFrom,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    }),

    prisma.visit.count({
      where: {
        storeId: store.id,
        createdAt: {
          gte: previousFrom,
          lt: previousTo,
        },
      },
    }),

    prisma.orderItem.findMany({
      where: {
        order: {
          storeId: store.id,
          createdAt: {
            gte: currentFrom,
          },
          status: {
            not: OrderStatus.CANCELED,
          },
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),

    prisma.product.count({
      where: {
        storeId: store.id,
        isActive: true,
      },
    }),

    prisma.product.count({
      where: {
        storeId: store.id,
        isActive: true,
        stock: {
          lte: 5,
        },
      },
    }),
  ]);

  const validCurrentOrders = currentOrders.filter(
    (order) => order.status !== OrderStatus.CANCELED,
  );

  const validPreviousOrders = previousOrders.filter(
    (order) => order.status !== OrderStatus.CANCELED,
  );

  const totalRevenue = validCurrentOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const previousRevenue = validPreviousOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

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
    (order) =>
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED,
  );

  const netSales = paidOrDeliveredOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const averageOrderValue =
    validCurrentOrders.length > 0
      ? Math.round(totalRevenue / validCurrentOrders.length)
      : 0;

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(startOfDay(now), index - 6);
    const nextDate = addDays(date, 1);

    const dayOrders = currentOrders.filter(
      (order) => order.createdAt >= date && order.createdAt < nextDate,
    );

    const dayValidOrders = dayOrders.filter(
      (order) => order.status !== OrderStatus.CANCELED,
    );

    const dayVisits = currentVisits.filter(
      (visit) => visit.createdAt >= date && visit.createdAt < nextDate,
    );

    return {
      day: getArabicDay(date),
      sales: dayValidOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
      visits: dayVisits.length,
    };
  });

  const statusData = Object.values(OrderStatus).map((status) => ({
    name: statusMeta[status].label,
    value: currentOrders.filter((order) => order.status === status).length,
    status,
  }));

  const productStats = new Map<
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

  for (const item of orderItems) {
    const current = productStats.get(item.productId);

    if (current) {
      current.sold += item.quantity;
      current.revenue += item.price * item.quantity;
    } else {
      productStats.set(item.productId, {
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
    ...Array.from(productStats.values()).map((product) => product.revenue),
    1,
  );

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((product) => ({
      ...product,
      performance: Math.round((product.revenue / maxProductRevenue) * 100),
    }));

  const bestDay = [...days].sort((a, b) => b.sales - a.sales)[0];

  const kpis = [
    {
      title: "إجمالي المبيعات",
      value: formatMoney(totalRevenue),
      change: formatChange(getChange(totalRevenue, previousRevenue)),
      trend: totalRevenue >= previousRevenue ? "up" : "down",
      description: "مقارنة بآخر 30 يوم قبل الفترة",
      icon: TrendingUp,
    },
    {
      title: "عدد الطلبات",
      value: numberFormatter.format(totalOrders),
      change: formatChange(getChange(totalOrders, previousOrdersCount)),
      trend: totalOrders >= previousOrdersCount ? "up" : "down",
      description: "كل الطلبات خلال آخر 30 يوم",
      icon: Receipt,
    },
    {
      title: "زيارات المتجر",
      value: numberFormatter.format(totalVisits),
      change: formatChange(getChange(totalVisits, previousVisits)),
      trend: totalVisits >= previousVisits ? "up" : "down",
      description: "زيارات مسجلة على المتجر",
      icon: Eye,
    },
    {
      title: "معدل التحويل",
      value: `${conversionRate.toFixed(2)}%`,
      change: formatChange(getChange(conversionRate, previousConversionRate)),
      trend: conversionRate >= previousConversionRate ? "up" : "down",
      description: "طلبات غير ملغية من إجمالي الزيارات",
      icon: Users,
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
    <main dir="rtl" className="">
      <div className="mx-auto flex w-full flex-col gap-6">
        <DashboardSectionHeader
          icon={Sparkles}
          title="التقارير والتحليلات"
          description={
            <>
              راقب أداء متجرك، المبيعات، الطلبات، الزيارات، وأفضل المنتجات من
              مكان واحد ببيانات حقيقية من قاعدة البيانات.
            </>
          }
        />

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <CardContent className="relative p-6 sm:p-8">
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-24 right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
                <div>
                  <Badge variant="secondary" className="mb-4 rounded-full">
                    ملخص الأداء
                  </Badge>

                  <h2 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                    {reports.bestDay.sales > 0
                      ? `${reports.bestDay.day} هو أقوى يوم مبيعات في آخر أسبوع.`
                      : "لسه مفيش مبيعات كفاية لعرض توصية قوية."}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    إجمالي المبيعات في آخر 30 يوم هو{" "}
                    <span className="font-semibold text-foreground">
                      {formatMoney(reports.totalRevenue)}
                    </span>
                    ، وصافي المبيعات من الطلبات المدفوعة أو المشحونة أو المسلمة
                    هو{" "}
                    <span className="font-semibold text-foreground">
                      {formatMoney(reports.netSales)}
                    </span>
                    .
                  </p>
                </div>

                <div className="rounded-3xl border bg-muted/50 p-5">
                  <p className="text-sm text-muted-foreground">صافي المبيعات</p>
                  <p className="mt-2 text-3xl font-bold">
                    {formatMoney(reports.netSales)}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">طلبات فعالة</span>
                    <span className="font-semibold">
                      {numberFormatter.format(
                        reports.paidOrDeliveredOrdersCount,
                      )}
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
                    className="mt-3 h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                حالة المنتجات
              </CardTitle>
              <CardDescription>
                ملخص سريع لمنتجات المتجر والمخزون.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">منتجات نشطة</p>
                <p className="mt-2 text-3xl font-bold">
                  {numberFormatter.format(reports.productsCount)}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">مخزون منخفض</p>
                <p className="mt-2 text-3xl font-bold">
                  {numberFormatter.format(reports.lowStockCount)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  منتجات مخزونها 5 قطع أو أقل.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reports.kpis.map((item) => {
            const Icon = item.icon;
            const isUp = item.trend === "up";

            return (
              <Card key={item.title} className="rounded-3xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-muted p-3">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        isUp
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                      }
                    >
                      {isUp ? (
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="ml-1 h-3.5 w-3.5" />
                      )}
                      {item.change}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <MerchantReportsCharts
          revenueData={reports.revenueData}
          statusData={reports.statusData}
        />

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>تفاصيل المبيعات</CardTitle>
              <CardDescription>
                متوسط الطلب وأفضل يوم مبيعات في الفترة الحالية.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-3xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    متوسط قيمة الطلب
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(reports.averageOrderValue)}
                  </p>
                </div>

                <div className="rounded-3xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    أعلى يوم مبيعات
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {reports.bestDay.day}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(reports.bestDay.sales)}
                  </p>
                </div>

                <div className="rounded-3xl border bg-card p-5">
                  <p className="text-sm text-muted-foreground">طلبات فعالة</p>
                  <p className="mt-2 text-2xl font-bold">
                    {numberFormatter.format(reports.paidOrDeliveredOrdersCount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>آخر الطلبات</CardTitle>
              <CardDescription>
                أحدث العمليات التي تمت داخل المتجر.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reports.recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        لا توجد طلبات حتى الآن.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.recentOrders.map((order) => {
                      const status = statusMeta[order.status];

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>{order.fullName}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={status.className}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatMoney(order.total)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Intl.DateTimeFormat("ar-EG", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(order.createdAt)}
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

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>أفضل المنتجات أداءً</CardTitle>
            <CardDescription>
              المنتجات الأعلى مبيعًا وإيرادًا خلال آخر 30 يوم.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">المبيعات</TableHead>
                  <TableHead className="text-right">الإيراد</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الأداء</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      لا توجد مبيعات منتجات حتى الآن.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category}
                      </TableCell>
                      <TableCell>
                        {numberFormatter.format(product.sold)} قطعة
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatMoney(product.revenue)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.stock <= 5
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                              : ""
                          }
                        >
                          {numberFormatter.format(product.stock)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-35 items-center gap-3">
                          <Progress
                            value={product.performance}
                            className="h-2"
                          />
                          <span className="text-xs font-semibold text-muted-foreground">
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
    </main>
  );
};

export default MerchantReportsRoute;

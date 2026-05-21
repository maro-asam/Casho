import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Headset,
  Package,
  PaintRoller,
  Rocket,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";

import CopyStoreLinkBtn from "../_components/CopyStoreLinkBtn";
import DashboardCharts from "../_components/main/DashboardCharts";
import DashboardStats from "../_components/main/DashboardStats";
import StarterGuideBar from "../_components/main/StarterGuideCard";

type ChartOrder = {
  createdAt: Date;
  total: number;
};

type ChartVisit = {
  createdAt: Date;
};

function getLast30DaysData(orders: ChartOrder[], visits: ChartVisit[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 30 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().split("T")[0];

    return {
      key,
      name: new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
      }).format(date),
      revenue: 0,
      orders: 0,
      visits: 0,
    };
  });

  const map = new Map(days.map((day) => [day.key, day]));

  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    const key = orderDate.toISOString().split("T")[0];
    const existing = map.get(key);

    if (existing) {
      existing.revenue += order.total;
      existing.orders += 1;
    }
  }

  for (const visit of visits) {
    const visitDate = new Date(visit.createdAt);
    visitDate.setHours(0, 0, 0, 0);
    const key = visitDate.toISOString().split("T")[0];
    const existing = map.get(key);

    if (existing) {
      existing.visits += 1;
    }
  }

  return days.map(({ name, revenue, orders, visits }) => ({
    name,
    revenue,
    orders,
    visits,
  }));
}

function getTodayDate() {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "قيد المراجعة",
    PAID: "مدفوع",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التسليم",
    CANCELED: "ملغي",
  };

  return labels[status] ?? status;
}

function getOrderStatusClassName(status: string) {
  const classes: Record<string, string> = {
    PENDING:
      "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
    PAID: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
    SHIPPED:
      "bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300",
    DELIVERED:
      "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
    CANCELED:
      "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
  };

  return classes[status] ?? "bg-muted text-muted-foreground hover:bg-muted";
}

const MerchantDashboardRoute = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } },
      banners: { select: { id: true } },
      settings: {
        select: {
          shippingPrice: true,
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
        },
      },
      storePaymentSettings: {
        select: {
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          vodafoneCashNumber: true,
          instapayEnabled: true,
          instapayAddress: true,
          bankTransferEnabled: true,
          bankTransferDetails: true,
          kashierEnabled: true,
          kashierMerchantId: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5">
          <CardContent className="flex min-h-105 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Store className="size-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              لا يوجد متجر حاليًا
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              يبدو أنك لم تنشئ متجرًا بعد. ابدأ بإنشاء متجرك الأول لتضيف منتجاتك
              وتستقبل الطلبات بسهولة.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = store.subscriptionStatus === SubscriptionStatus.ACTIVE;
  const hasPaymentMethods =
    store.paymentMethods.length > 0 ||
    Boolean(store.storePaymentSettings?.cashOnDeliveryEnabled) ||
    Boolean(
      store.storePaymentSettings?.vodafoneCashEnabled &&
      store.storePaymentSettings?.vodafoneCashNumber,
    ) ||
    Boolean(
      store.storePaymentSettings?.instapayEnabled &&
      store.storePaymentSettings?.instapayAddress,
    ) ||
    Boolean(
      store.storePaymentSettings?.bankTransferEnabled &&
      store.storePaymentSettings?.bankTransferDetails,
    ) ||
    Boolean(
      store.storePaymentSettings?.kashierEnabled &&
      store.storePaymentSettings?.kashierMerchantId,
    );
  const hasShippingPrice =
    typeof store.settings?.shippingPrice === "number" &&
    store.settings.shippingPrice > 0;
  const hasSeoSettings = Boolean(
    store.settings?.seoTitle?.trim() ||
    store.settings?.seoDescription?.trim() ||
    store.settings?.seoKeywords?.length,
  );

  const starterSteps = [
    {
      id: "balance",
      title: "فعّل الاشتراك",
      description: "أضف رصيد أو اختار خطة نشطة لتشغيل المتجر بثقة.",
      href: "/dashboard/balance",
      completed: isActive,
      icon: "wallet" as const,
    },
    {
      id: "categories",
      title: "أضف تصنيفاتك",
      description: "قسّم منتجاتك لتسهيل التصفح على العملاء.",
      href: "/dashboard/categories",
      completed: store.categories.length > 0,
      icon: "category" as const,
    },
    {
      id: "products",
      title: "أضف منتجاتك",
      description: "ابدأ بأول منتج بالصور والسعر والوصف.",
      href: "/dashboard/products/new",
      completed: store.products.length > 0,
      icon: "product" as const,
    },
    {
      id: "banners",
      title: "أضف بانرات",
      description: "اعرض العروض أو المنتجات المميزة في واجهة المتجر.",
      href: "/dashboard/banners",
      completed: store.banners.length > 0,
      icon: "banner" as const,
    },
    {
      id: "payment",
      title: "جهّز طرق الدفع",
      description:
        "فعّل الدفع المناسب لعملاء مصر: COD، فودافون كاش، InstaPay، أو غيره.",
      href: "/dashboard/payment-methods",
      completed: hasPaymentMethods,
      icon: "payment" as const,
    },
    {
      id: "shipping",
      title: "حدد سعر الشحن",
      description: "اضبط تكلفة الشحن الافتراضية عشان الطلبات تطلع مظبوطة.",
      href: "/dashboard/settings",
      completed: hasShippingPrice,
      icon: "shipping" as const,
    },
    {
      id: "seo",
      title: "إعدادات الـ SEO",
      description: "حسّن ظهور متجرك في محركات البحث والمشاركة.",
      href: "/dashboard/seo",
      completed: hasSeoSettings,
      icon: "seo" as const,
    },
  ];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [chartOrders, chartVisits] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.visit.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const chartData = getLast30DaysData(chartOrders, chartVisits);
  const storeUrl = buildStoreUrl(store.slug);
  const completedSetup = starterSteps.filter((step) => step.completed).length;
  const setupPercentage = Math.round(
    (completedSetup / starterSteps.length) * 100,
  );

  const quickActions = [
    {
      title: "إضافة منتج",
      description: "ابدأ بيع منتج جديد",
      href: "/dashboard/products/new",
      icon: Package,
    },
    {
      title: "تخصيص الواجهة",
      description: "لون، ثيم، وهوية المتجر",
      href: "/dashboard/customization",
      icon: PaintRoller,
    },
    {
      title: "طرق الدفع",
      description: "فعل وسائل التحصيل",
      href: "/dashboard/payment-methods",
      icon: CreditCard,
    },
    {
      title: "تحسين SEO",
      description: "ارفع ظهور المتجر",
      href: "/dashboard/seo",
      icon: Rocket,
    },
  ];

  const storeHealth = [
    {
      title: "حالة الاشتراك",
      value: isActive ? "نشط" : "غير نشط",
      completed: isActive,
    },
    {
      title: "الكتالوج",
      value: `${store.products.length} منتجات`,
      completed: store.products.length > 0,
    },
    {
      title: "طرق الدفع",
      value: hasPaymentMethods ? "مفعلة" : "غير مكتملة",
      completed: hasPaymentMethods,
    },
    {
      title: "الشحن",
      value: hasShippingPrice
        ? formatPrice(store.settings?.shippingPrice ?? 0)
        : "غير محدد",
      completed: hasShippingPrice,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="relative overflow-hidden rounded-[2.25rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary/15 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <CardContent className="relative p-5 sm:p-6 lg:p-7">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-stretch">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                  Merchant Command Center
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {getTodayDate()}
                </Badge>
                <Badge
                  className={
                    isActive
                      ? "rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                      : "rounded-full border-0 bg-rose-500/10 px-3 py-1 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                  }
                >
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      المتجر نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <XCircle className="size-3.5" />
                      المتجر غير نشط
                    </span>
                  )}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Casho SaaS Dashboard
                </p>
                <div className="space-y-7">
                  <h1 className="max-w-4xl text-3xl font-medium tracking-tight md:text-4xl xl:text-5xl">
                    أهلاً بيك في غرفة تشغيل{" "}
                    <span className="text-primary font-bold">{store.name}</span>
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    من هنا تقدر تتابع كل حاجة بتحصل في متجرك، من الطلبات لحد
                    الإحصائيات، وكمان تقدر تتحكم في كل حاجة تخص متجرك من مكان
                    واحد.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <CopyStoreLinkBtn storeUrl={storeUrl} />
                <Button asChild className=" font-bold">
                  <Link
                    href={`/store/${store.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    زيارة المتجر
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className=" bg-background/70 font-bold"
                >
                  <Link href="/dashboard/support">
                    <Headset className="size-4" />
                    اطلب الدعم
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Setup score
                    </p>
                    <p className="text-sm font-bold text-muted-foreground">
                      جاهزية المتجر
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-primary">
                    {setupPercentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${setupPercentage}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Wallet className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Balance
                    </p>
                    <p className="text-2xl font-bold">
                      {formatPrice(store.balance)}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="secondary"
                  className="w-full rounded-2xl font-bold"
                >
                  <Link href="/dashboard/balance">إدارة الرصيد</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StarterGuideBar steps={starterSteps} />

      <DashboardStats />

      <DashboardCharts data={chartData} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 p-5 pb-2 sm:p-6 sm:pb-2">
            <div>
              <CardTitle className="text-lg font-bold">آخر الطلبات</CardTitle>
              <p className="text-sm text-muted-foreground">
                متابعة سريعة لأحدث نشاط في المتجر
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl bg-background/70 font-bold"
            >
              <Link href="/dashboard/orders">
                كل الطلبات
                <ShoppingCart className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {store.orders.length > 0 ? (
              <div className="space-y-3">
                {store.orders.map((order) => {
                  const itemsCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <ShoppingCart className="size-5" />
                        </span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">
                              طلب #{order.id.slice(0, 8)}
                            </p>
                            <Badge
                              className={`rounded-full border-0 ${getOrderStatusClassName(order.status)}`}
                            >
                              {formatOrderStatus(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.fullName} • {itemsCount} قطعة •{" "}
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold">
                          {formatPrice(order.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/25 text-center">
                <div className="space-y-3">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">لسه مفيش طلبات</p>
                    <p className="text-sm text-muted-foreground">
                      شارك لينك المتجر وابدأ استقبال أول طلب.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl">
            <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="size-5 text-primary" />
                Quick actions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                اختصارات تشغيلية مهمة
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:p-6">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-muted/25 p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="grid size-10 place-items-center rounded-2xl bg-background text-primary shadow-sm">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {action.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </span>
                    <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-xl">
            <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="size-5 text-primary" />
                Store health
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                مراجعة سريعة للنقط المؤثرة
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-5 sm:p-6">
              {storeHealth.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-border/70 bg-muted/25 px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        item.completed
                          ? "grid size-7 place-items-center rounded-full bg-emerald-500 text-white"
                          : "grid size-7 place-items-center rounded-full bg-muted text-muted-foreground"
                      }
                    >
                      {item.completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Settings className="size-4" />
                      )}
                    </span>
                    <span className="text-sm font-bold">{item.title}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MerchantDashboardRoute;

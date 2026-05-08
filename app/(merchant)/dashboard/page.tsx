import { CheckCircle2, Headset, Store, XCircle } from "lucide-react";
import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import DashboardStats from "../_components/main/DashboardStats";
import DashboardCharts from "../_components/main/DashboardCharts";
import CopyStoreLinkBtn from "../_components/CopyStoreLinkBtn";
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

const MerchantDashboardRoute = async () => {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      products: {
        select: {
          id: true,
        },
      },
      categories: {
        select: {
          id: true,
        },
      },
      banners: {
        select: {
          id: true,
        },
      },
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
        <Card className="overflow-hidden rounded-[28px] border border-border/20 shadow-sm">
          <CardContent className="flex min-h-105 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-xl bg-primary/10">
              <Store className="size-8 text-primary" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
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
      title: "أضف رصيد",
      description: "فعّل متجرك بإضافة رصيد أو اشتراك نشط.",
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
      description: "ابدأ بإضافة أول منتج بالصور والسعر والوصف.",
      href: "/dashboard/products/new",
      completed: store.products.length > 0,
      icon: "product" as const,
    },
    {
      id: "banners",
      title: "أضف بانرز",
      description: "اعرض العروض أو المنتجات المميزة في واجهة المتجر.",
      href: "/dashboard/banners",
      completed: store.banners.length > 0,
      icon: "banner" as const,
    },
    {
      id: "payment",
      title: "أضف طرق الدفع",
      description: "حدد طرق الدفع المتاحة لعملائك.",
      href: "/dashboard/settings/payment",
      completed: hasPaymentMethods,
      icon: "payment" as const,
    },
    {
      id: "shipping",
      title: "أضف سعر الشحن",
      description: "حدد تكلفة الشحن الافتراضية للطلبات.",
      href: "/dashboard/settings",
      completed: hasShippingPrice,
      icon: "shipping" as const,
    },
    {
      id: "seo",
      title: "إعدادات الـ SEO",
      description: "حسّن ظهور متجرك في محركات البحث والمشاركة.",
      href: "/dashboard/settings/seo",
      completed: hasSeoSettings,
      icon: "seo" as const,
    },
  ];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const chartOrders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const chartVisits = await prisma.visit.findMany({
    where: {
      storeId: store.id,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const chartData = getLast30DaysData(chartOrders, chartVisits);

  const storeUrl = buildStoreUrl(store.slug);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border border-border/60">
        <div className="pointer-events-none absolute inset-0" />

        <CardContent className="relative">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-xl border-0 bg-primary/10 p-3 text-xs font-medium text-primary hover:bg-primary/10">
                  لوحة التحكم
                </Badge>

                <Badge className="rounded-xl border-0 bg-amber-700/10 p-3 text-xs font-medium text-amber-700 hover:bg-amber-700/10">
                  {getTodayDate()}
                </Badge>

                <Badge
                  className={`rounded-xl p-3 text-xs font-medium ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                      : "bg-red-500/10 text-red-600 hover:bg-red-500/10"
                  }`}
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
                <h1 className="text-xl tracking-tight md:text-3xl xl:text-4xl">
                  أهلاً بيك في متجرك{" "}
                  <span className="font-semibold text-primary">
                    {store.name}
                  </span>
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  تابع أداء متجرك، راقب الطلبات، وشوف الأرباح بشكل واضح ومنظم من
                  مكان واحد.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CopyStoreLinkBtn storeUrl={storeUrl} />

              <Button asChild variant="default">
                <Link href="/dashboard/support">
                  <Headset />
                  اطلب الدعم
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StarterGuideBar steps={starterSteps} />

      <DashboardStats />

      <DashboardCharts data={chartData} />
    </div>
  );
};

export default MerchantDashboardRoute;
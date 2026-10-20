import { SubscriptionStatus } from "@prisma/client";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";

import StarterGuideBar, { type StarterGuideStep } from "../_components/main/StarterGuideCard";
import AttentionPanel, { buildAttentionItems } from "./_components/overview/AttentionPanel";
import ChannelBreakdown from "./_components/overview/ChannelBreakdown";
import KpiGrid from "./_components/overview/KpiGrid";
import OverviewHeader from "./_components/overview/OverviewHeader";
import PerformanceChart from "./_components/overview/PerformanceChart";
import RecentOrdersTable from "./_components/overview/RecentOrdersTable";
import StoreStatus, { type StatusRow } from "./_components/overview/StoreStatus";
import WelcomeBanner from "./_components/overview/WelcomeBanner";
import { getDailyQuote, getGreeting } from "./_components/overview/daily-quote";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { formatMoney, formatNumber } from "./_components/overview/format";
import { getOverviewData } from "./_components/overview/overview-data";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const todayFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Merchants see the onboarding-call offer during their first week.
const NEW_MERCHANT_DAYS = 7;

const MerchantDashboardRoute = async () => {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      _count: { select: { categories: true, banners: true } },
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
        take: 6,
        select: { id: true, fullName: true, status: true, source: true, total: true, createdAt: true },
      },
    },
  });

  if (!store) {
    return (
      <div dir={tdir()} className="apple-card flex min-h-96 flex-col items-center justify-center gap-3 p-8 text-center">
        <Store className="size-10 text-(--label-3)" strokeWidth={1.4} />
        <h1 className="text-[22px] font-bold">{tr("لسه معندكش متجر")}</h1>
        <p className="max-w-sm text-[15px] leading-6 text-muted-foreground">
          {tr("أنشئ متجرك الأول عشان تضيف منتجاتك وتبدأ تستقبل طلبات أونلاين وفي محلك.")}
        </p>
      </div>
    );
  }

  const data = await getOverviewData(store.id);

  const payments = store.storePaymentSettings;
  const hasPaymentMethods =
    store.paymentMethods.length > 0 ||
    Boolean(payments?.cashOnDeliveryEnabled) ||
    Boolean(payments?.vodafoneCashEnabled && payments?.vodafoneCashNumber) ||
    Boolean(payments?.instapayEnabled && payments?.instapayAddress) ||
    Boolean(payments?.bankTransferEnabled && payments?.bankTransferDetails) ||
    Boolean(payments?.kashierEnabled && payments?.kashierMerchantId);
  const shippingPrice = store.settings?.shippingPrice ?? 0;
  const hasShippingPrice = shippingPrice > 0;
  const hasSeoSettings = Boolean(
    store.settings?.seoTitle?.trim() || store.settings?.seoDescription?.trim() || store.settings?.seoKeywords?.length,
  );

  const subscription =
    store.subscriptionStatus === SubscriptionStatus.ACTIVE
      ? "active"
      : store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD
        ? "grace"
        : "inactive";

  const starterSteps: StarterGuideStep[] = [
    {
      id: "balance",
      title: tr("فعّل الاشتراك"),
      description: tr("اشحن رصيد واختار باقة عشان متجرك يشتغل."),
      href: "/balance",
      completed: subscription === "active",
      icon: "wallet",
    },
    {
      id: "categories",
      title: tr("أضف تصنيفاتك"),
      description: tr("قسّم منتجاتك عشان العملاء يلاقوا اللي عايزينه بسرعة."),
      href: "/categories",
      completed: store._count.categories > 0,
      icon: "category",
    },
    {
      id: "products",
      title: tr("أضف أول منتج"),
      description: tr("بالصور والسعر والوصف والكمية المتاحة."),
      href: "/products/new",
      completed: data.productCount > 0,
      icon: "product",
    },
    {
      id: "banners",
      title: tr("أضف بانر"),
      description: tr("اعرض عروضك ومنتجاتك المميزة في واجهة المتجر."),
      href: "/banners",
      completed: store._count.banners > 0,
      icon: "banner",
    },
    {
      id: "payment",
      title: tr("جهّز طرق الدفع"),
      description: tr("الدفع عند الاستلام، فودافون كاش، InstaPay أو غيرهم."),
      href: "/payment-methods",
      completed: hasPaymentMethods,
      icon: "payment",
    },
    {
      id: "shipping",
      title: tr("حدد سعر الشحن"),
      description: tr("عشان إجمالي الطلب يطلع مظبوط للعميل."),
      href: "/settings",
      completed: hasShippingPrice,
      icon: "shipping",
    },
    {
      id: "seo",
      title: tr("إعدادات الـ SEO"),
      description: tr("حسّن ظهور متجرك في جوجل وعلى السوشيال."),
      href: "/seo",
      completed: hasSeoSettings,
      icon: "seo",
    },
  ];

  const statusRows: StatusRow[] = [
    {
      label: tr("الاشتراك"),
      value: subscription === "active" ? tr("نشط") : subscription === "grace" ? tr("فترة سماح") : tr("غير نشط"),
      ok: subscription === "active",
      href: "/balance",
    },
    {
      label: tr("المنتجات"),
      value: tr("{0} منتج", formatNumber(data.productCount)),
      ok: data.productCount > 0,
      href: "/products",
    },
    {
      label: tr("طرق الدفع"),
      value: hasPaymentMethods ? tr("مفعّلة") : tr("مش مكتملة"),
      ok: hasPaymentMethods,
      href: "/payment-methods",
    },
    {
      label: tr("الشحن"),
      value: hasShippingPrice ? formatMoney(shippingPrice) : tr("مش محدد"),
      ok: hasShippingPrice,
      href: "/settings",
    },
  ];

  const now = new Date();
  const isNewMerchant = now.getTime() - store.createdAt.getTime() < NEW_MERCHANT_DAYS * 24 * 60 * 60 * 1000;
  const meetingUrl = process.env.ONBOARDING_MEETING_URL;
  const onboarding = isNewMerchant
    ? meetingUrl
      ? { href: meetingUrl, external: true }
      : { href: "/support", external: false }
    : null;

  const attentionItems = buildAttentionItems({
    pendingOrders: data.pendingOrders,
    lowStockCount: data.lowStockCount,
    subscription,
  });

  return (
    <div className="space-y-4 sm:space-y-5" dir={tdir()}>
      <OverviewHeader
        storeUrl={buildStoreUrl(store.slug)}
        today={todayFormat.format(now)}
      />

      <WelcomeBanner
        greeting={getGreeting(now)}
        storeName={store.name}
        quote={getDailyQuote(now)}
        today={data.today}
        yesterday={data.yesterday}
        onboarding={onboarding}
      />

      <StarterGuideBar steps={starterSteps} />

      <KpiGrid kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceChart data={data.daily} previousTotals={data.previousTotals} />
        </div>
        <div className="space-y-4 sm:space-y-5">
          <AttentionPanel items={attentionItems} />
          <ChannelBreakdown channels={data.channels} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={store.orders} />
        </div>
        <StoreStatus balance={formatMoneyFromPiasters(store.balance)} rows={statusRows} />
      </div>
    </div>
  );
};

export default MerchantDashboardRoute;

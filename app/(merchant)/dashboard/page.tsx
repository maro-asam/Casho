import { SubscriptionStatus } from "@prisma/client";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";

import StarterGuideBar, { type GuideSubscription } from "../_components/main/StarterGuideCard";
import AttentionPanel, { buildAttentionItems } from "./_components/overview/AttentionPanel";
import ChannelBreakdown from "./_components/overview/ChannelBreakdown";
import KpiGrid from "./_components/overview/KpiGrid";
import OverviewHeader from "./_components/overview/OverviewHeader";
import PerformanceChart from "./_components/overview/PerformanceChart";
import RecentOrdersTable from "./_components/overview/RecentOrdersTable";
import StoreStatus, { type StatusRow } from "./_components/overview/StoreStatus";
import WelcomeBanner from "./_components/overview/WelcomeBanner";
import DemoDataBanner from "./_components/overview/DemoDataBanner";
import { loadStoreSetup } from "@/lib/store-setup/server";
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
/** Casho team WhatsApp (01211504120) in international form for wa.me. */
const ONBOARDING_WHATSAPP = "201211504120";

const MerchantDashboardRoute = async () => {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      settings: { select: { shippingPrice: true } },
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

  const [data, setup] = await Promise.all([getOverviewData(store.id), loadStoreSetup(store.id)]);

  const stepDone = (id: string) => Boolean(setup?.steps.find((s) => s.id === id)?.done);
  const hasPaymentMethods = stepDone("payment");
  const hasShipping = stepDone("shipping");
  const shippingPrice = store.settings?.shippingPrice ?? 0;
  const shippingMethods = setup?.shippingMethods ?? 0;
  const demoData = Boolean(setup?.steps.some((s) => s.id === "demo"));

  const subscription =
    store.subscriptionStatus === SubscriptionStatus.ACTIVE
      ? "active"
      : store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD
        ? "grace"
        : "inactive";

  const guideSubscription: GuideSubscription | null = setup
    ? setup.subscription.state === "trial"
      ? { ...setup.subscription, endsAt: setup.subscription.endsAt.toISOString() }
      : setup.subscription
    : null;

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
      value:
        shippingMethods > 0
          ? tr("{0} طريقة شحن", formatNumber(shippingMethods))
          : shippingPrice > 0
            ? formatMoney(shippingPrice)
            : hasShipping
              ? tr("مجاني")
              : tr("مش محدد"),
      ok: hasShipping,
      href: "/shipping",
    },
  ];

  const now = new Date();
  const isNewMerchant = now.getTime() - store.createdAt.getTime() < NEW_MERCHANT_DAYS * 24 * 60 * 60 * 1000;
  // The onboarding call is booked on the Casho team's WhatsApp, with the store prefilled.
  const meetingText = `أهلًا فريق كاشو 👋 عايز أحجز مكالمة زووم مجانية عشان أبدأ متجري.\nالمتجر: ${store.name}\nاللينك: ${storePublicUrl(store)}`;
  const onboarding = isNewMerchant
    ? { href: `https://wa.me/${ONBOARDING_WHATSAPP}?text=${encodeURIComponent(meetingText)}`, external: true }
    : null;

  const attentionItems = buildAttentionItems({
    pendingOrders: data.pendingOrders,
    lowStockCount: data.lowStockCount,
    subscription,
  });

  return (
    <div className="space-y-4 sm:space-y-5" dir={tdir()}>
      <OverviewHeader
        storeUrl={storePublicUrl(store)}
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

      {setup && guideSubscription ? (
        <StarterGuideBar
          steps={setup.steps}
          subscription={guideSubscription}
          logo={setup.logo}
          storeUrl={storePublicUrl(store)}
          fallback={demoData ? <DemoDataBanner /> : null}
        />
      ) : (
        demoData && <DemoDataBanner />
      )}

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

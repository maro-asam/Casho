"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { Bell, ExternalLink, Menu, Moon, Search, Sun } from "lucide-react";
import { OrderSource, OrderStatus } from "@prisma/client";

// The real dashboard, not a drawing of it: the shell's sidebar and the overview
// cards are the merchant components themselves, fed demo data, so the hero
// follows every dashboard redesign. Only the topbar is redrawn — the real one
// polls notifications and binds ⌘K.
import DashboardSidebar from "@/app/(merchant)/_components/main/DashboardSidebar";
import { findActiveNav } from "@/app/(merchant)/_components/main/dashboard-nav";
import AttentionPanel, { buildAttentionItems } from "@/app/(merchant)/dashboard/_components/overview/AttentionPanel";
import ChannelBreakdown from "@/app/(merchant)/dashboard/_components/overview/ChannelBreakdown";
import { getDailyQuote, getGreeting } from "@/app/(merchant)/dashboard/_components/overview/daily-quote";
import { formatMoney, formatNumber } from "@/app/(merchant)/dashboard/_components/overview/format";
import KpiGrid from "@/app/(merchant)/dashboard/_components/overview/KpiGrid";
import OverviewHeader from "@/app/(merchant)/dashboard/_components/overview/OverviewHeader";
import type { ChannelTotal, DailyPoint, OverviewData } from "@/app/(merchant)/dashboard/_components/overview/overview-data";
import PerformanceChart from "@/app/(merchant)/dashboard/_components/overview/PerformanceChart";
import RecentOrdersTable, { type RecentOrder } from "@/app/(merchant)/dashboard/_components/overview/RecentOrdersTable";
import StoreStatus from "@/app/(merchant)/dashboard/_components/overview/StoreStatus";
import WelcomeBanner from "@/app/(merchant)/dashboard/_components/overview/WelcomeBanner";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { LocaleContext } from "@/lib/i18n/dashboard/context";
import { ensureEnglish } from "@/lib/i18n/dashboard/load-english";
import { hasEnglish, setBrowserLocale, type Locale } from "@/lib/i18n/dashboard/runtime";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const dayLabel = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short" });
const todayLabel = lazyIntl.date({ timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", year: "numeric" });

const SLUG = "nour";
const ACTIVE = findActiveNav("/");

/* ------------------------------------------------------------------ */
/* Demo data — shaped like getOverviewData(), deterministic per day.    */
/* ------------------------------------------------------------------ */

type DemoOrder = Omit<RecentOrder, "createdAt"> & { minutesAgo: number };

const NAMES = {
  ar: ["منى حسن", "عميل نقدي", "محمد علي", "يوسف إبراهيم", "نورهان سمير", "أحمد مصطفى"],
  en: ["Mona Hassan", "Walk-in customer", "Mohamed Ali", "Youssef Ibrahim", "Nourhan Samir", "Ahmed Moustafa"],
};

const BASE_ORDERS: Omit<DemoOrder, "fullName">[] = [
  { id: "c7f41a9e2b", status: OrderStatus.PENDING, source: OrderSource.ONLINE, total: 89000, minutesAgo: 14 },
  { id: "a3d90e5c71", status: OrderStatus.PAID, source: OrderSource.POS, total: 25000, minutesAgo: 38 },
  { id: "e81b7c0d4f", status: OrderStatus.SHIPPED, source: OrderSource.ONLINE, total: 132000, minutesAgo: 95 },
  { id: "5b2fa6d839", status: OrderStatus.PAID, source: OrderSource.INSTAGRAM, total: 78000, minutesAgo: 160 },
  { id: "9e04c3b1a7", status: OrderStatus.DELIVERED, source: OrderSource.ONLINE, total: 45000, minutesAgo: 240 },
  { id: "d6a8f2e05c", status: OrderStatus.DELIVERED, source: OrderSource.POS, total: 61000, minutesAgo: 310 },
];

// Arrive as the hero's notification chips pop: an online order, then a POS sale (the receipt).
const LIVE_ORDERS: (Omit<DemoOrder, "fullName"> & { name: { ar: string; en: string } })[] = [
  { id: "f2c6e8a01d", status: OrderStatus.PENDING, source: OrderSource.ONLINE, total: 45000, minutesAgo: 0, name: { ar: "سارة أحمد", en: "Sara Ahmed" } },
  { id: "b9e3d71c4a", status: OrderStatus.PAID, source: OrderSource.POS, total: 115000, minutesAgo: 0, name: { ar: "عميل نقدي", en: "Walk-in customer" } },
];

const PAID: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
const CHANNEL_SHARE: [OrderSource, number][] = [
  [OrderSource.ONLINE, 0.61],
  [OrderSource.POS, 0.31],
  [OrderSource.INSTAGRAM, 0.08],
];

/** 60 days (previous + current period) of steady growth with a weekly rhythm. */
function demoPeriods(now: Date) {
  return Array.from({ length: 60 }, (_, i) => {
    const wave = Math.sin(i / 1.15) * 0.14 + ((i * 7) % 5) * 0.03;
    const trend = 0.62 + (i / 59) * 0.62;
    const orders = Math.round(8.2 * (trend + wave));
    const visits = Math.round(236 * (trend + wave * 0.55));
    const aov = 41_500 + ((i * 13) % 7) * 1_100;
    return { label: dayLabel.format(new Date(now.getTime() - (59 - i) * DAY_MS)), orders, visits, revenue: orders * aov };
  });
}

function sum(points: DailyPoint[], key: "revenue" | "orders" | "visits") {
  return points.reduce((total, point) => total + point[key], 0);
}

function buildDemo(now: Date, live: number, locale: Locale) {
  const all = demoPeriods(now);
  const arrived = LIVE_ORDERS.slice(0, live);

  // Live orders land on today, exactly as the real query would count them.
  const today = all[all.length - 1];
  for (const order of arrived) {
    today.orders += 1;
    if (PAID.includes(order.status)) today.revenue += order.total;
  }

  const previous = all.slice(0, 30);
  const current = all.slice(30);
  const aov = (points: DailyPoint[]) => Math.round(sum(points, "revenue") / sum(points, "orders"));
  const conversion = (points: DailyPoint[]) => (sum(points, "orders") / sum(points, "visits")) * 100;

  const kpis: OverviewData["kpis"] = {
    revenue: { current: sum(current, "revenue"), previous: sum(previous, "revenue"), series: current.map((p) => p.revenue) },
    orders: { current: sum(current, "orders"), previous: sum(previous, "orders"), series: current.map((p) => p.orders) },
    visits: { current: sum(current, "visits"), previous: sum(previous, "visits"), series: current.map((p) => p.visits) },
    aov: { current: aov(current), previous: aov(previous), series: current.map((p) => p.revenue / p.orders) },
    conversion: { current: conversion(current), previous: conversion(previous), series: current.map((p) => (p.orders / p.visits) * 100) },
  };

  const revenue = kpis.revenue.current;
  const orderCount = kpis.orders.current;
  const channels: ChannelTotal[] = CHANNEL_SHARE.map(([source, share]) => ({
    source,
    revenue: Math.round(revenue * share),
    orders: Math.round(orderCount * share),
  }));
  const posSales = arrived.filter((o) => o.source === OrderSource.POS);
  for (const sale of posSales) {
    channels[1].revenue += sale.total;
    channels[1].orders += 1;
  }

  const names = NAMES[locale];
  const orders: RecentOrder[] = [
    ...arrived
      .slice()
      .reverse()
      .map(({ name, minutesAgo, ...o }) => ({ ...o, fullName: name[locale], createdAt: new Date(now.getTime() - minutesAgo * MINUTE_MS) })),
    ...BASE_ORDERS.map(({ minutesAgo, ...o }, i) => ({ ...o, fullName: names[i], createdAt: new Date(now.getTime() - minutesAgo * MINUTE_MS) })),
  ].slice(0, 6);

  const pendingOrders = 2 + arrived.filter((o) => o.status === OrderStatus.PENDING).length;
  const yesterday = current[current.length - 2];

  return {
    kpis,
    daily: current,
    previousTotals: { revenue: kpis.revenue.previous, orders: kpis.orders.previous, visits: kpis.visits.previous },
    today: { revenue: today.revenue, orders: today.orders, visits: today.visits },
    yesterday: { revenue: yesterday.revenue, orders: yesterday.orders, visits: yesterday.visits },
    channels,
    orders,
    pendingOrders,
    unread: 3 + arrived.length,
  };
}

/* ------------------------------------------------------------------ */
/* Locale — follows the landing's language toggle.                      */
/* ------------------------------------------------------------------ */

/** Like DashboardI18nProvider minus the <html dir/lang> takeover. English loads on demand; Arabic shows meanwhile. */
function usePreviewLocale(lang: "ar" | "en"): Locale {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const wantsEnglish = lang === "en";

  useEffect(() => {
    if (wantsEnglish && !hasEnglish()) ensureEnglish().then(rerender);
  }, [wantsEnglish]);

  const locale = wantsEnglish && hasEnglish() ? "en" : "ar";
  // tr() reads this module-level locale while the children render.
  setBrowserLocale(locale);
  return locale;
}

/* ------------------------------------------------------------------ */
/* Topbar — markup and classes mirror DashboardTopbar.                  */
/* ------------------------------------------------------------------ */

function PreviewTopbar({ storeName, unread }: { storeName: string; unread: number }) {
  return (
    <div className="absolute inset-x-0 top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/80 to-transparent backdrop-blur-md mask-[linear-gradient(to_bottom,black_40%,transparent)]" />
      <header className="apple-glass relative flex h-14 items-center gap-2 rounded-full ps-4 pe-2 sm:ps-5">
        <span className="-ms-2 grid size-9 place-items-center md:hidden">
          <Menu className="size-5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{ACTIVE?.item.name}</p>

        <div className="flex shrink-0 items-center gap-1">
          <span className="grid size-10 place-items-center rounded-full text-foreground/80 md:flex md:h-9 md:w-56 md:items-center md:gap-2 md:bg-muted md:px-3.5 md:text-muted-foreground lg:w-64">
            <Search className="size-4 shrink-0" />
            <span className="hidden flex-1 text-start text-sm md:block">{tr("ابحث عن صفحة...")}</span>
            <kbd className="hidden rounded-md bg-background/70 px-1.5 py-0.5 font-sans text-[10px] font-medium md:block" dir="ltr">
              ⌘K
            </kbd>
          </span>
          <span className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm text-foreground/80 lg:inline-flex">
            <ExternalLink className="size-4" />
            {tr("زيارة المتجر")}
          </span>
          <span className="relative grid size-10 place-items-center rounded-full text-foreground/80">
            <Bell className="size-4" />
            <span className="absolute end-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--sys-red) px-1 text-[10px] font-semibold leading-none text-white">
              {formatNumber(unread)}
            </span>
          </span>
          <span className="relative grid size-10 place-items-center rounded-full text-foreground/80">
            <Sun className="size-4 dark:scale-0" />
            <Moon className="absolute size-4 scale-0 dark:scale-100" />
          </span>
          <span className="mx-1 hidden h-5 border-s-[0.5px] border-border sm:block" />
          <span className="grid size-10 place-items-center">
            <span className="grid size-8 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-xs font-semibold text-white">
              {storeName.trim().slice(0, 1).toUpperCase()}
            </span>
          </span>
        </div>
      </header>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

/**
 * The overview page inside a device. Lay it out at the visitor's real viewport
 * width (or a phone width below `sm`) so the dashboard's own breakpoints pick
 * the same layout a merchant would see. Decorative and inert.
 */
export default function DashboardScreen({
  lang,
  storeName,
  scroll,
  live,
}: {
  lang: "ar" | "en";
  storeName: string;
  /** 0 → top of the page, 1 → scrolled to the bottom. */
  scroll: MotionValue<number>;
  /** How many of the live orders have arrived (0–2). */
  live: number;
}) {
  const locale = usePreviewLocale(lang);
  const now = useMemo(() => new Date(), []);
  const data = useMemo(() => buildDemo(now, live, locale), [now, live, locale]);
  const store = { name: storeName, slug: SLUG };

  // Scroll the page under the floating topbar by however much it overflows.
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overflow = useMotionValue(0);
  const y = useTransform(() => -scroll.get() * overflow.get());

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const measure = () => overflow.set(Math.max(0, content.offsetHeight - viewport.offsetHeight));
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [overflow]);

  return (
    <LocaleContext.Provider value={locale}>
      <div inert dir={tdir()} className="relative h-full overflow-hidden">
        {/* Floating glass sidebar island, as in DashboardShell. */}
        <aside className="absolute inset-y-3 start-3 z-40 hidden w-64 overflow-hidden rounded-[22px] md:block">
          <DashboardSidebar store={store} active={ACTIVE} />
        </aside>

        <div className="relative h-full md:ps-70">
          <div ref={viewportRef} className="relative h-full overflow-hidden">
            <motion.div ref={contentRef} style={{ y }}>
              {/* Room for the floating topbar (pt-3 + h-14). */}
              <div className="h-17" />
              <main className="apple-auto apple-form mx-auto w-full max-w-385 px-4 pt-4 pb-10 sm:px-6 md:px-8 md:pt-6">
                {/* Same composition as app/(merchant)/dashboard/page.tsx. */}
                <div className="space-y-4 sm:space-y-5">
                  <OverviewHeader storeUrl={buildStoreUrl(SLUG)} today={todayLabel.format(now)} />

                  <WelcomeBanner
                    greeting={getGreeting(now)}
                    storeName={storeName}
                    quote={getDailyQuote(now)}
                    today={data.today}
                    yesterday={data.yesterday}
                    onboarding={null}
                  />

                  <KpiGrid kpis={data.kpis} />

                  <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                      <PerformanceChart data={data.daily} previousTotals={data.previousTotals} />
                    </div>
                    <div className="space-y-4 sm:space-y-5">
                      <AttentionPanel items={buildAttentionItems({ pendingOrders: data.pendingOrders, lowStockCount: 2, subscription: "active" })} />
                      <ChannelBreakdown channels={data.channels} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
                    {/* Rows that just arrived get a soft highlight (apple.css). */}
                    <div className={cn("xl:col-span-2", live > 0 && "al-live-orders")} data-live={live}>
                      <RecentOrdersTable orders={data.orders} />
                    </div>
                    <StoreStatus
                      balance={formatMoney(185_000)}
                      rows={[
                        { label: tr("الاشتراك"), value: tr("نشط"), ok: true, href: "/balance" },
                        { label: tr("المنتجات"), value: tr("{0} منتج", formatNumber(48)), ok: true, href: "/products" },
                        { label: tr("طرق الدفع"), value: tr("مفعّلة"), ok: true, href: "/payment-methods" },
                        { label: tr("الشحن"), value: formatMoney(6_000), ok: true, href: "/settings" },
                      ]}
                    />
                  </div>
                </div>
              </main>
            </motion.div>

            <PreviewTopbar storeName={storeName} unread={data.unread} />
          </div>
        </div>
      </div>
    </LocaleContext.Provider>
  );
}

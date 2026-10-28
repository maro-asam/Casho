import Link from "next/link";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Clock3,
  Headset,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";

import { Dot, LargeTitle, StatusText, appleButton, initialOf } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { KpiStrip, PanelEmpty } from "./_components/admin-ui";
import { OverviewTrend } from "./_components/overview-trend";
import { SUBSCRIPTION_META, TX_TYPE_META, fmtDate, fmtMoney, fmtNum, fmtRelative } from "./_lib/format";
import { getAdminOverview } from "./_lib/overview-data";

export const dynamic = "force-dynamic";

const todayFmt = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", year: "numeric" });

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "زي الشهر اللي فات" : "أول نشاط مقارنة بالشهر اللي فات";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(pct)}٪ عن الشهر اللي فات`;
}

type Attention = { id: string; title: string; description: string; href: string; color: string; icon: LucideIcon };

// Settings-style row icons: white glyph on a flat system color. The color names the kind of work.
const ICON_SQUARE = "grid size-[29px] shrink-0 place-items-center rounded-[7px] text-white";

const STATUS_ORDER: SubscriptionStatus[] = ["ACTIVE", "GRACE_PERIOD", "PAST_DUE", "INACTIVE", "CANCELED"];
const STATUS_BAR: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-(--sys-green)",
  GRACE_PERIOD: "bg-(--sys-orange)",
  PAST_DUE: "bg-(--sys-red)",
  INACTIVE: "bg-(--sys-gray)/50",
  CANCELED: "bg-(--sys-gray)/25",
};

/** Card heading row: Headline title + optional trailing "See All" link. */
function CardHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
      <h2 className="text-[17px] leading-[22px] font-semibold">{title}</h2>
      {href && (
        <Link href={href} className={appleButton.plain}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();
  const q = data.queues;
  const active = data.statusCounts.ACTIVE ?? 0;

  const attention: Attention[] = [];
  if (q.pendingTopups > 0)
    attention.push({
      id: "topups",
      title: `${fmtNum(q.pendingTopups)} طلب شحن مستني مراجعة`,
      description: `إجمالي ${fmtMoney(q.pendingTopupsAmount)} — التجار مستنيين الرصيد عشان يجددوا.`,
      href: "/admin/topup-requests",
      color: "bg-(--sys-orange)",
      icon: Wallet,
    });
  if (q.pastDue > 0)
    attention.push({
      id: "pastdue",
      title: `${fmtNum(q.pastDue)} متجر اشتراكه متأخر`,
      description: "الاشتراك خلص والرصيد مش مكفي، والمتجر واقف. تابع معاهم.",
      href: "/admin/stores?status=PAST_DUE",
      color: "bg-(--sys-red)",
      icon: AlertTriangle,
    });
  if (q.grace > 0)
    attention.push({
      id: "grace",
      title: `${fmtNum(q.grace)} متجر في فترة السماح`,
      description: "هيقفوا لو مشحنوش رصيد قبل ما الفترة تخلص.",
      href: "/admin/stores?status=GRACE_PERIOD",
      color: "bg-(--sys-orange)",
      icon: Clock3,
    });
  if (q.atRiskRenewals > 0)
    attention.push({
      id: "risk",
      title: `${fmtNum(q.atRiskRenewals)} تجديد في خطر خلال ٣ أيام`,
      description: "الرصيد مش مكفي التجديد الجاي.",
      href: "/admin/stores?status=EXPIRING",
      color: "bg-(--sys-indigo)",
      icon: Clock3,
    });
  if (q.newServices > 0)
    attention.push({
      id: "services",
      title: `${fmtNum(q.newServices)} طلب خدمة جديد`,
      description: "لسه محدش تواصل معاهم.",
      href: "/admin/service-requests?status=PENDING",
      color: "bg-primary",
      icon: BriefcaseBusiness,
    });
  if (q.newSupport > 0)
    attention.push({
      id: "support",
      title: `${fmtNum(q.newSupport)} تذكرة دعم جديدة`,
      description: "ردّ عليهم أو غيّر الحالة بعد المتابعة.",
      href: "/admin/support-requests?status=PENDING",
      color: "bg-(--sys-teal)",
      icon: Headset,
    });
  if (q.unconfirmedPlans > 0)
    attention.push({
      id: "plans",
      title: `${fmtNum(q.unconfirmedPlans)} باقة أسعارها مش مؤكدة`,
      description: "أكّد الأسعار قبل ما التجار يشتركوا عليها.",
      href: "/admin/plans",
      color: "bg-(--sys-gray)",
      icon: Layers,
    });

  return (
    <div className="space-y-6">
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{todayFmt.format(new Date())}</p>}
        title="نظرة عامة"
        subtitle="أداء المنصة والشغل اللي مستنيك."
      />

      <KpiStrip
        items={[
          {
            label: "إيراد الاشتراكات (الشهر ده)",
            value: fmtMoney(data.subscriptionRevenue.current),
            hint: delta(data.subscriptionRevenue.current, data.subscriptionRevenue.previous),
            href: "/admin/transactions?type=SUBSCRIPTION_CHARGE",
          },
          {
            label: "صافي الربح (الشهر ده)",
            value: fmtMoney(data.profit.current),
            hint: `بعد عمولات المبيعات (${fmtMoney(data.profit.commissions)}) · ${delta(data.profit.current, data.profit.previous)}`,
            href: "/admin/profit",
          },
          {
            label: "اشتراكات نشطة",
            value: fmtNum(active),
            hint: `من ${fmtNum(data.totalStores)} متجر · ${fmtNum(data.totalUsers)} مستخدم`,
            href: "/admin/stores?status=ACTIVE",
          },
          {
            label: "متاجر جديدة (الشهر ده)",
            value: fmtNum(data.newStores.current),
            hint: `مبيعات المتاجر: ${fmtMoney(data.gmv.amount)} في ${fmtNum(data.gmv.orders)} طلب`,
            href: "/admin/stores",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewTrend months={data.months} />
        </div>

        {/* Work waiting on an admin — a grouped list, most urgent first. */}
        <section aria-labelledby="attention-title" className="apple-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
            <h2 id="attention-title" className="text-[17px] leading-[22px] font-semibold">
              محتاج انتباهك
            </h2>
            {attention.length > 0 && <span className="text-[15px] text-muted-foreground tabular-nums">{fmtNum(attention.length)}</span>}
          </div>
          {attention.length > 0 ? (
            <ul className="apple-rows pb-2 [--row-inset:61px]">
              {attention.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-muted"
                    >
                      <span className={cn(ICON_SQUARE, item.color)}>
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-5">{item.title}</span>
                        <span className="block text-[13px] leading-[18px] text-muted-foreground">{item.description}</span>
                      </span>
                      <ChevronLeft className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-10 text-center">
              <span className="mb-1 grid size-11 place-items-center rounded-full bg-(--sys-green) text-white">
                <Check className="size-6" strokeWidth={2.4} />
              </span>
              <p className="text-[17px] font-semibold">مفيش حاجة مستنياك</p>
              <p className="max-w-60 text-[13px] leading-[18px] text-muted-foreground">كل الطلبات اتراجعت ومفيش متاجر متعثرة.</p>
            </div>
          )}
        </section>
      </div>

      {/* Subscription health: one stacked meter, every segment labelled below. */}
      <section aria-labelledby="health-title" className="apple-card overflow-hidden">
        <div className="space-y-0.5 px-5 pt-5 pb-4">
          <h2 id="health-title" className="text-[17px] leading-[22px] font-semibold">
            حالة الاشتراكات
          </h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground">توزيع كل المتاجر حسب حالة الاشتراك دلوقتي.</p>
        </div>
        {data.totalStores === 0 ? (
          <PanelEmpty>مفيش متاجر لسه.</PanelEmpty>
        ) : (
          <div className="space-y-4 px-5 pb-5">
            <div className="flex h-3 w-full gap-[3px] overflow-hidden rounded-full" role="img" aria-label="توزيع حالات الاشتراك">
              {STATUS_ORDER.map((s) => {
                const n = data.statusCounts[s] ?? 0;
                return n > 0 ? <div key={s} className={cn("rounded-full", STATUS_BAR[s])} style={{ width: `${(n / data.totalStores) * 100}%` }} /> : null;
              })}
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {STATUS_ORDER.map((s) => (
                <li key={s}>
                  <Link
                    href={`/admin/stores?status=${s}`}
                    className="apple-press flex flex-col gap-1 rounded-[14px] bg-(--fill-3) px-3.5 py-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Dot tone={SUBSCRIPTION_META[s].tone} />
                      {SUBSCRIPTION_META[s].label}
                    </span>
                    <span className="text-[22px] leading-7 font-bold tabular-nums">{fmtNum(data.statusCounts[s] ?? 0)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="apple-card overflow-hidden lg:col-span-3">
          <CardHeader title="أحدث المتاجر" href="/admin/stores" linkLabel="عرض الكل" />
          {data.latestStores.length === 0 ? (
            <PanelEmpty>مفيش متاجر لسه.</PanelEmpty>
          ) : (
            <ul className="apple-rows pb-2 [--row-inset:68px]">
              {data.latestStores.map((store) => (
                <li key={store.id} className="relative flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/60">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-[13px] font-semibold text-white">
                    {initialOf(store.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/stores/${store.slug}`} className="block truncate text-[15px] after:absolute after:inset-0">
                      {store.name}
                    </Link>
                    <p className="truncate text-[13px] text-muted-foreground">
                      <span dir="ltr">{store.user.email}</span>
                      <span className="hidden md:inline"> · {fmtDate(store.createdAt)}</span>
                    </p>
                  </div>
                  <StatusText tone={SUBSCRIPTION_META[store.subscriptionStatus].tone} className="hidden sm:inline-flex">
                    {SUBSCRIPTION_META[store.subscriptionStatus].label}
                  </StatusText>
                  <span className="w-24 shrink-0 text-left text-[15px] tabular-nums">{fmtMoney(store.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="apple-card overflow-hidden lg:col-span-2">
          <CardHeader title="آخر الحركات المالية" href="/admin/transactions" linkLabel="عرض الكل" />
          {data.latestActivity.length === 0 ? (
            <PanelEmpty>مفيش حركات لسه.</PanelEmpty>
          ) : (
            <ul className="apple-rows pb-2 [--row-inset:20px]">
              {data.latestActivity.map((tx) => (
                <li key={tx.id} className="relative flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-muted/60">
                  <div className="min-w-0">
                    <Link href={`/admin/stores/${tx.store.slug}`} className="block truncate text-[15px] after:absolute after:inset-0">
                      {tx.store.name}
                    </Link>
                    <p className="text-[13px] text-muted-foreground">
                      {TX_TYPE_META[tx.type].label} · {fmtRelative(tx.createdAt)}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-[15px] font-semibold tabular-nums", tx.amount < 0 ? "text-muted-foreground" : "text-[#248a3d] dark:text-(--sys-green)")} dir="ltr">
                    {tx.amount > 0 ? "+" : ""}
                    {fmtMoney(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Headset,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";

import { PageHeader, StatusPill } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { KpiStrip, Panel, PanelEmpty, th, theadRow } from "./_components/admin-ui";
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

type Attention = { id: string; title: string; description: string; href: string; tone: "warning" | "danger" | "neutral"; icon: LucideIcon };

const TONE: Record<Attention["tone"], string> = {
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  neutral: "bg-muted text-foreground",
};

const STATUS_ORDER: SubscriptionStatus[] = ["ACTIVE", "GRACE_PERIOD", "PAST_DUE", "INACTIVE", "CANCELED"];
const STATUS_BAR: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-emerald-500",
  GRACE_PERIOD: "bg-amber-500",
  PAST_DUE: "bg-rose-500",
  INACTIVE: "bg-muted-foreground/40",
  CANCELED: "bg-muted-foreground/20",
};

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
      tone: "warning",
      icon: Wallet,
    });
  if (q.pastDue > 0)
    attention.push({
      id: "pastdue",
      title: `${fmtNum(q.pastDue)} متجر اشتراكه متأخر`,
      description: "فترة السماح خلصت والمتجر واقف. تابع معاهم.",
      href: "/admin/stores?status=PAST_DUE",
      tone: "danger",
      icon: AlertTriangle,
    });
  if (q.grace > 0)
    attention.push({
      id: "grace",
      title: `${fmtNum(q.grace)} متجر في فترة السماح`,
      description: "هيقفوا لو مشحنوش رصيد قبل ما الفترة تخلص.",
      href: "/admin/stores?status=GRACE_PERIOD",
      tone: "warning",
      icon: Clock3,
    });
  if (q.atRiskRenewals > 0)
    attention.push({
      id: "risk",
      title: `${fmtNum(q.atRiskRenewals)} تجديد في خطر خلال ٣ أيام`,
      description: "الرصيد مش مكفي التجديد الجاي.",
      href: "/admin/stores?status=EXPIRING",
      tone: "neutral",
      icon: Clock3,
    });
  if (q.newServices > 0)
    attention.push({
      id: "services",
      title: `${fmtNum(q.newServices)} طلب خدمة جديد`,
      description: "لسه محدش تواصل معاهم.",
      href: "/admin/service-requests?status=PENDING",
      tone: "neutral",
      icon: BriefcaseBusiness,
    });
  if (q.newSupport > 0)
    attention.push({
      id: "support",
      title: `${fmtNum(q.newSupport)} تذكرة دعم جديدة`,
      description: "ردّ عليهم أو غيّر الحالة بعد المتابعة.",
      href: "/admin/support-requests?status=PENDING",
      tone: "neutral",
      icon: Headset,
    });
  if (q.unconfirmedPlans > 0)
    attention.push({
      id: "plans",
      title: `${fmtNum(q.unconfirmedPlans)} باقة أسعارها مش مؤكدة`,
      description: "أكّد الأسعار قبل ما التجار يشتركوا عليها.",
      href: "/admin/plans",
      tone: "neutral",
      icon: Layers,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="نظرة عامة" description={`أداء المنصة النهارده — ${todayFmt.format(new Date())}`} />

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

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">محتاج انتباهك</h2>
          </div>
          {attention.length > 0 ? (
            <ul className="p-2">
              {attention.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONE[item.tone])}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{item.title}</span>
                        <span className="block text-xs leading-5 text-muted-foreground">{item.description}</span>
                      </span>
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center gap-3 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">مفيش حاجة مستنياك</p>
                <p className="text-xs text-muted-foreground">كل الطلبات اتراجعت ومفيش متاجر متعثرة.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Subscription health: one stacked meter, every segment labelled below. */}
      <Panel title="حالة الاشتراكات" description="توزيع كل المتاجر حسب حالة الاشتراك دلوقتي.">
        {data.totalStores === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش متاجر لسه.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="توزيع حالات الاشتراك">
              {STATUS_ORDER.map((s) => {
                const n = data.statusCounts[s] ?? 0;
                return n > 0 ? <div key={s} className={STATUS_BAR[s]} style={{ width: `${(n / data.totalStores) * 100}%` }} /> : null;
              })}
            </div>
            <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {STATUS_ORDER.map((s) => (
                <li key={s}>
                  <Link href={`/admin/stores?status=${s}`} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                    <StatusPill tone={SUBSCRIPTION_META[s].tone}>{SUBSCRIPTION_META[s].label}</StatusPill>
                    <span className="font-semibold tabular-nums">{fmtNum(data.statusCounts[s] ?? 0)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="أحدث المتاجر"
          className="lg:col-span-3"
          flush
          actions={
            <Link href="/admin/stores" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              كل المتاجر <ArrowUpRight className="size-3" />
            </Link>
          }
        >
          {data.latestStores.length === 0 ? (
            <PanelEmpty>مفيش متاجر لسه.</PanelEmpty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={cn(th, "ps-4")}>المتجر</th>
                  <th className={cn(th, "hidden sm:table-cell")}>الحالة</th>
                  <th className={cn(th, "hidden md:table-cell")}>اتعمل</th>
                  <th className={cn(th, "pe-4 text-left")}>الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.latestStores.map((store) => (
                  <tr key={store.id} className="relative transition-colors hover:bg-muted/40">
                    <td className="py-3 ps-4">
                      <Link href={`/admin/stores/${store.slug}`} className="font-medium after:absolute after:inset-0">
                        {store.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {store.user.email}
                      </p>
                    </td>
                    <td className="hidden py-3 sm:table-cell">
                      <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>
                    </td>
                    <td className="hidden py-3 text-muted-foreground md:table-cell">{fmtDate(store.createdAt)}</td>
                    <td className="py-3 pe-4 text-left tabular-nums">{fmtMoney(store.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="آخر الحركات المالية"
          className="lg:col-span-2"
          flush
          actions={
            <Link href="/admin/transactions" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              كل الحركات <ArrowUpRight className="size-3" />
            </Link>
          }
        >
          {data.latestActivity.length === 0 ? (
            <PanelEmpty>مفيش حركات لسه.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {data.latestActivity.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/admin/stores/${tx.store.slug}`} className="block truncate font-medium hover:underline">
                      {tx.store.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {TX_TYPE_META[tx.type].label} · {fmtRelative(tx.createdAt)}
                    </p>
                  </div>
                  <span className={cn("shrink-0 font-semibold tabular-nums", tx.amount < 0 ? "text-muted-foreground" : "text-emerald-700 dark:text-emerald-400")} dir="ltr">
                    {tx.amount > 0 ? "+" : ""}
                    {fmtMoney(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

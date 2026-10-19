import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, CheckCircle2, Gift, History, Plus, Store, XCircle } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader, StatusPill, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { METHOD_LABELS, TOPUP_STATUS, formatMoney, formatSigned, txMeta } from "@/lib/balance-ui/meta";
import { prisma } from "@/lib/prisma";
import { getBillingPeriodDays } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { AutoRenewSwitch } from "./_components/auto-renew-switch";
import RenewSubscriptionModal from "./_components/RenewSubscriptionModal";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الرصيد والاشتراك"),
};
}

const nf = lazyIntl.number();
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const dtf = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ACTIVE: { get label() { return tr("نشط"); }, tone: "success" },
  GRACE_PERIOD: { get label() { return tr("فترة سماح"); }, tone: "warning" },
  PAST_DUE: { get label() { return tr("متأخر"); }, tone: "danger" },
  CANCELED: { get label() { return tr("ملغي"); }, tone: "neutral" },
  INACTIVE: { get label() { return tr("غير مفعّل"); }, tone: "neutral" },
};

const TOPUP_RESULT = {
  success: { icon: CheckCircle2, tone: "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300", get text() { return tr("الدفع تم بنجاح والرصيد اتضاف لمحفظتك."); } },
  failed: { icon: XCircle, tone: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300", get text() { return tr("الدفع ما تمش ومفيش أي مبلغ اتخصم. جرّب تاني أو استخدم تحويل يدوي."); } },
  invalid: { icon: AlertTriangle, tone: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300", get text() { return tr("مقدرناش نتأكد من عملية الدفع. لو المبلغ اتخصم من حسابك كلّمنا من الدعم."); } },
} as const;

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400_000);
const KASHIER_STALE_MS = 60 * 60 * 1000;

type BalanceRouteProps = { searchParams?: Promise<SearchParamsRecord> };

export default async function BalanceRoute({ searchParams }: BalanceRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      balance: true,
      monthlyPrice: true,
      autoRenew: true,
      billingCycle: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      plan: { select: { name: true } },
    },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تتابع الرصيد والاشتراك.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const now = new Date();
  const yearAgo = addDays(now, -365);
  const [transactions, requests, totals] = await Promise.all([
    prisma.balanceTransaction.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, amount: true, note: true, balanceAfter: true, createdAt: true },
    }),
    prisma.topupRequest.findMany({
      where: { storeId: store.id, OR: [{ status: "PENDING" }, { status: "REJECTED", updatedAt: { gte: addDays(now, -14) } }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, method: true, status: true, createdAt: true, transferRef: true },
    }),
    prisma.balanceTransaction.groupBy({
      by: ["type"],
      where: { storeId: store.id, createdAt: { gte: yearAgo } },
      _sum: { amount: true },
    }),
  ]);

  // Online-payment attempts that never came back are noise, not "pending".
  const visibleRequests = requests.filter((r) => r.method !== "KASHIER" || now.getTime() - r.createdAt.getTime() < KASHIER_STALE_MS);

  // ── Runway: how far the balance carries the subscription ────────────
  const price = store.monthlyPrice;
  const periodDays = getBillingPeriodDays(store.billingCycle);
  const cycleWord = store.billingCycle === "YEARLY" ? tr("سنة") : tr("شهر");
  const renewals = price > 0 ? Math.floor(store.balance / price) : 0;
  const nextRenewal = store.subscriptionEndsAt;
  const coveredUntil = nextRenewal ? addDays(nextRenewal, renewals * periodDays) : null;
  const shortBy = Math.max(0, price - store.balance);
  const daysToRenewal = nextRenewal ? Math.ceil((nextRenewal.getTime() - now.getTime()) / 86400_000) : null;
  const urgent = shortBy > 0 && daysToRenewal !== null && daysToRenewal <= 7;
  const slots = 12;

  const sumOf = (...types: string[]) => totals.filter((t) => types.includes(t.type)).reduce((s, t) => s + Math.abs(t._sum.amount ?? 0), 0);
  const toppedUp = sumOf("TOPUP");
  const spent = sumOf("SUBSCRIPTION_CHARGE");
  const gifts = sumOf("BONUS", "REFERRAL_REWARD");

  const topupResult = readParam(params, "topup");
  const result = topupResult && topupResult in TOPUP_RESULT ? TOPUP_RESULT[topupResult as keyof typeof TOPUP_RESULT] : null;
  const status = STATUS[store.subscriptionStatus] ?? STATUS.INACTIVE;

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("الرصيد والاشتراك")}
        description={tr("رصيد محفظتك بيجدد اشتراك المتجر تلقائي — اشحن مرة وانسى.")}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/balance/history">
                <History className="size-4" />
                {tr("سجل الحركات")}
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/balance/topup">
                <Plus className="size-4" />
                {tr("شحن رصيد")}
              </Link>
            </Button>
          </>
        }
      />

      {result && (
        <div className={cn("flex items-center gap-3 rounded-xl border p-4 text-sm", result.tone)} role="status">
          <result.icon className="size-5 shrink-0" />
          {result.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-6">
          {/* ── Balance + runway ─────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{tr("رصيد المحفظة")}</p>
                <p className="text-4xl font-bold tracking-tight tabular-nums">{formatMoney(store.balance)}</p>
                <p className="text-sm text-muted-foreground">
                  {price > 0 &&
                    (renewals > 0 ? (
                      <>
                        {tr("يكفي")}{" "}<span className="font-medium text-foreground">{tr("{0} تجديد", nf.format(renewals))}</span>
                        {coveredUntil && (
                          <>
                            {" "}{tr("— متجرك مغطّي لحد")}{" "}<span className="font-medium text-foreground">{df.format(coveredUntil)}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {tr("ناقصك")}{" "}<span className="font-medium text-foreground">{formatMoney(shortBy)}</span>{" "}{tr("للتجديد الجاي")}
                      </>
                    ))}
                </p>
              </div>
              {shortBy > 0 && (
                <Button asChild variant={urgent ? "default" : "outline"} className="gap-1.5">
                  <Link href={`/balance/topup?amount=${Math.ceil(shortBy / 100)}`}>
                    <Plus className="size-4" />
                    {tr("اشحن {0}", formatMoney(Math.ceil(shortBy / 100) * 100))}
                  </Link>
                </Button>
              )}
            </div>

            {price > 0 && (
              <div className="border-t border-border px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tr("كل مربع = تجديد {0} بـ {1}", cycleWord, formatMoney(price))}</span>
                  <span className="tabular-nums">
                    {nf.format(Math.min(renewals, slots))}
                    {renewals > slots && "+"}{" "}{tr("من {0}", nf.format(slots))}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1" role="img" aria-label={tr("الرصيد يغطي {0} تجديد", renewals)}>
                  {Array.from({ length: slots }).map((_, i) => {
                    const partial = i === renewals ? (store.balance % price) / price : 0;
                    return (
                      <span key={i} className="relative h-2.5 overflow-hidden rounded-sm bg-muted">
                        {i < renewals && <span className="absolute inset-0 bg-primary" />}
                        {partial > 0 && <span className="absolute inset-y-0 start-0 bg-primary/40" style={{ width: `${partial * 100}%` }} />}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {urgent && (
              <div className="flex items-center gap-2 border-t border-amber-500/30 bg-amber-500/5 px-5 py-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0" />
                {tr("التجديد")}{" "}{daysToRenewal! <= 0 ? tr("النهارده") : tr("بعد {0} يوم", nf.format(daysToRenewal!))}{" "}{tr("والرصيد مش كفاية — اشحن عشان المتجر ميقفش.")}
              </div>
            )}
          </section>

          {/* ── Topup requests in flight ─────────────────────────── */}
          {visibleRequests.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">{tr("طلبات الشحن")}</h2>
                <p className="text-xs text-muted-foreground">{tr("التحويلات اليدوية بتتراجع عادةً في خلال ساعات العمل.")}</p>
              </div>
              <ul className="divide-y divide-border">
                {visibleRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums">{formatMoney(r.amount)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {METHOD_LABELS[r.method]} · {dtf.format(r.createdAt)}
                        {r.transferRef && (
                          <>
                            {" · "}
                            <span className="font-mono" dir="ltr">
                              {r.transferRef}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <StatusPill tone={TOPUP_STATUS[r.status].tone}>{TOPUP_STATUS[r.status].label}</StatusPill>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Recent activity ──────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">{tr("آخر الحركات")}</h2>
              {transactions.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                  <Link href="/balance/history">
                    {tr("كل الحركات")}
                    <ArrowLeft className="size-3.5 ltr:-scale-x-100" />
                  </Link>
                </Button>
              )}
            </div>
            {transactions.length === 0 ? (
              <EmptyState icon={History} title={tr("لسه مفيش حركات")} description={tr("أول ما تشحن أو يتجدد الاشتراك هتلاقي التفاصيل هنا.")} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("الحركة")}</TableHead>
                    <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground sm:table-cell">{tr("التاريخ")}</TableHead>
                    <TableHead className="h-10 text-end text-xs font-medium text-muted-foreground">{tr("المبلغ")}</TableHead>
                    <TableHead className="hidden h-10 pe-4 text-end text-xs font-medium text-muted-foreground md:table-cell">{tr("الرصيد بعدها")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => {
                    const meta = txMeta(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="py-3 ps-4">
                          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                          {t.note && <p className="mt-1 max-w-72 truncate text-xs text-muted-foreground">{trv(t.note)}</p>}
                        </TableCell>
                        <TableCell className="hidden py-3 text-sm text-muted-foreground sm:table-cell">{dtf.format(t.createdAt)}</TableCell>
                        <TableCell
                          className={cn(
                            "py-3 text-left text-sm font-semibold tabular-nums",
                            t.amount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-foreground",
                          )}
                          dir="ltr"
                        >
                          {formatSigned(t.amount)}
                        </TableCell>
                        <TableCell className="hidden py-3 pe-4 text-end text-sm text-muted-foreground tabular-nums md:table-cell">
                          {formatMoney(t.balanceAfter)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </section>
        </div>

        {/* ── Side: subscription + year summary ──────────────────── */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">{tr("الباقة")}</p>
                <p className="font-semibold">{trv(store.plan?.name) ?? tr("الباقة الحالية")}</p>
              </div>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
            <dl className="space-y-2.5 px-4 py-3 text-sm">
              <Row label={tr("سعر ال{0}", cycleWord)} value={formatMoney(price)} />
              <Row label={tr("التجديد الجاي")} value={nextRenewal ? df.format(nextRenewal) : "—"} />
              {store.subscriptionStatus === "GRACE_PERIOD" && store.gracePeriodEndsAt && (
                <Row label={tr("آخر يوم في السماح")} value={df.format(store.gracePeriodEndsAt)} warn />
              )}
            </dl>
            <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span>
                <span className="block text-sm font-medium">{tr("التجديد التلقائي")}</span>
                <span className="block text-xs text-muted-foreground">{tr("بنجدد من الرصيد في الميعاد من غير ما تعمل حاجة.")}</span>
              </span>
              <AutoRenewSwitch storeId={store.id} initial={store.autoRenew} />
            </label>
            <div className="flex flex-wrap gap-2 border-t border-border p-3">
              <RenewSubscriptionModal
                storeId={store.id}
                balance={store.balance}
                monthlyPrice={store.monthlyPrice}
                subscriptionStatus={store.subscriptionStatus}
                subscriptionEndsAt={store.subscriptionEndsAt}
                gracePeriodEndsAt={store.gracePeriodEndsAt}
              />
              <Button asChild variant="ghost" size="sm">
                <Link href="/change-plan">{tr("غيّر الباقة")}</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="mb-2 text-xs text-muted-foreground">{tr("آخر ١٢ شهر")}</p>
            <dl className="space-y-2 text-sm">
              <Row label={tr("شحنت")} value={formatMoney(toppedUp)} />
              <Row label={tr("اتجدد بيه الاشتراك")} value={formatMoney(spent)} />
              {gifts > 0 && <Row label={tr("رصيد هدية ومكافآت")} value={formatMoney(gifts)} />}
            </dl>
          </section>

          <Link
            href="/referral"
            className="group flex items-center gap-3 rounded-xl border border-dashed border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Gift className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{tr("اشحن ببلاش")}</span>
              <span className="block text-xs text-muted-foreground">{tr("ادعي تاجر لكاشو وخد رصيد مكافأة لما يشترك.")}</span>
            </span>
            <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 ltr:-scale-x-100" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums", warn && "text-amber-700 dark:text-amber-400")}>{value}</dd>
    </div>
  );
}

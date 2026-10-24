import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, ChevronLeft, Gift, History, Plus, Store, XCircle } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, LargeTitle, Row, Rows, StatusText, Unavailable, appleButton, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { METHOD_LABELS, TOPUP_STATUS, formatMoney } from "@/lib/balance-ui/meta";
import { prisma } from "@/lib/prisma";
import { getBillingPeriodDays } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { AutoRenewSwitch } from "./_components/auto-renew-switch";
import RenewSubscriptionModal from "./_components/RenewSubscriptionModal";
import { TxRow } from "./_components/tx-row";
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
  success: { icon: CheckCircle2, tone: "text-(--sys-green)", get text() { return tr("الدفع تم بنجاح والرصيد اتضاف لمحفظتك."); } },
  failed: { icon: XCircle, tone: "text-(--sys-red)", get text() { return tr("الدفع ما تمش ومفيش أي مبلغ اتخصم. جرّب تاني أو استخدم تحويل يدوي."); } },
  invalid: { icon: AlertTriangle, tone: "text-(--sys-orange)", get text() { return tr("مقدرناش نتأكد من عملية الدفع. لو المبلغ اتخصم من حسابك كلّمنا من الدعم."); } },
} as const;

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400_000);
// Online top-ups nobody finished paying stop showing after an hour.
const ONLINE_STALE_MS = 60 * 60 * 1000;
const ONLINE_METHODS = new Set(["KASHIER", "PAYMOB"]);

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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول عشان تتابع الرصيد والاشتراك.")} />
      </div>
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
  const visibleRequests = requests.filter((r) => !ONLINE_METHODS.has(r.method) || now.getTime() - r.createdAt.getTime() < ONLINE_STALE_MS);

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
      <LargeTitle
        title={tr("الرصيد والاشتراك")}
        subtitle={tr("رصيد محفظتك بيجدد اشتراك المتجر تلقائي — اشحن مرة وانسى.")}
        actions={
          <>
            <Link href="/balance/history" className={appleButton.gray}>
              <History className="size-4" />
              {tr("سجل الحركات")}
            </Link>
            <Link href="/balance/topup" className={appleButton.filled}>
              <Plus className="size-4" strokeWidth={2.4} />
              {tr("شحن رصيد")}
            </Link>
          </>
        }
      />

      {result && (
        <div className="apple-card flex items-center gap-3 px-5 py-4 text-[15px]" role="status">
          <result.icon className={cn("size-6 shrink-0", result.tone)} />
          {result.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {/* ── Balance + runway (the one hero of the page) ─────────── */}
          <section className="apple-card overflow-hidden" aria-labelledby="wallet-title">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <p id="wallet-title" className="text-[15px] text-muted-foreground">
                  {tr("رصيد المحفظة")}
                </p>
                <p className="text-[48px] leading-none font-bold tabular-nums ltr:tracking-[-0.025em]">{formatMoney(store.balance)}</p>
                {price > 0 && (
                  <p className="pt-1 text-[15px] text-muted-foreground">
                    {renewals > 0 ? (
                      <>
                        {tr("يكفي")}{" "}<span className="font-semibold text-foreground">{tr("{0} تجديد", nf.format(renewals))}</span>
                        {coveredUntil && (
                          <>
                            {" "}{tr("— متجرك مغطّي لحد")}{" "}<span className="font-semibold text-foreground">{df.format(coveredUntil)}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {tr("ناقصك")}{" "}<span className="font-semibold text-foreground">{formatMoney(shortBy)}</span>{" "}{tr("للتجديد الجاي")}
                      </>
                    )}
                  </p>
                )}
              </div>
              {shortBy > 0 && (
                <Link href={`/balance/topup?amount=${Math.ceil(shortBy / 100)}`} className={urgent ? appleButton.filled : cn(appleButton.tinted, "h-11 px-5")}>
                  <Plus className="size-4" strokeWidth={2.4} />
                  {tr("اشحن {0}", formatMoney(Math.ceil(shortBy / 100) * 100))}
                </Link>
              )}
            </div>

            {price > 0 && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-12 gap-1.5" role="img" aria-label={tr("الرصيد يغطي {0} تجديد", renewals)}>
                  {Array.from({ length: slots }).map((_, i) => {
                    const partial = i === renewals ? (store.balance % price) / price : 0;
                    return (
                      <span key={i} className="relative h-2 overflow-hidden rounded-full bg-(--fill-3)">
                        {i < renewals && <span className="absolute inset-0 bg-primary" />}
                        {partial > 0 && <span className="absolute inset-y-0 start-0 rounded-full bg-primary/45" style={{ width: `${partial * 100}%` }} />}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>{tr("كل مربع = تجديد {0} بـ {1}", cycleWord, formatMoney(price))}</span>
                  <span className="tabular-nums">
                    {nf.format(Math.min(renewals, slots))}
                    {renewals > slots && "+"}{" "}{tr("من {0}", nf.format(slots))}
                  </span>
                </div>
              </div>
            )}

            {urgent && (
              <div className="flex items-start gap-2.5 border-t-[0.5px] border-border bg-(--sys-orange)/8 px-6 py-3.5 text-[15px]">
                <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-(--sys-orange)" />
                <span>
                  {tr("التجديد")}{" "}{daysToRenewal! <= 0 ? tr("النهارده") : tr("بعد {0} يوم", nf.format(daysToRenewal!))}{" "}{tr("والرصيد مش كفاية — اشحن عشان المتجر ميقفش.")}
                </span>
              </div>
            )}
          </section>

          {/* ── Topup requests in flight ─────────────────────────── */}
          {visibleRequests.length > 0 && (
            <Card title={tr("طلبات الشحن")} subtitle={tr("التحويلات اليدوية بتتراجع عادةً في خلال ساعات العمل.")}>
              <ul className="apple-rows pb-2 [--row-inset:20px]">
                {visibleRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold tabular-nums">{formatMoney(r.amount)}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
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
                    <StatusText tone={TOPUP_STATUS[r.status].tone}>{TOPUP_STATUS[r.status].label}</StatusText>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ── Recent activity ──────────────────────────────────── */}
          <Card
            title={tr("آخر الحركات")}
            action={
              transactions.length > 0 && (
                <Link href="/balance/history" className={appleButton.plain}>
                  {tr("كل الحركات")}
                </Link>
              )
            }
          >
            {transactions.length === 0 ? (
              <Unavailable icon={History} title={tr("لسه مفيش حركات")} description={tr("أول ما تشحن أو يتجدد الاشتراك هتلاقي التفاصيل هنا.")} className="py-12" />
            ) : (
              <ul className="apple-rows pb-2 [--row-inset:72px]">
                {transactions.map((t) => (
                  <TxRow key={t.id} t={t} date={dtf.format(t.createdAt)} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Side: subscription + year summary ──────────────────── */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card title={trv(store.plan?.name) ?? tr("الباقة الحالية")} subtitle={tr("الباقة")} action={<StatusText tone={status.tone}>{status.label}</StatusText>}>
            <Rows className="pb-0">
              <Row label={tr("سعر ال{0}", cycleWord)}>
                <span className="tabular-nums">{formatMoney(price)}</span>
              </Row>
              <Row label={tr("التجديد الجاي")}>{nextRenewal ? df.format(nextRenewal) : "—"}</Row>
              {store.subscriptionStatus === "GRACE_PERIOD" && store.gracePeriodEndsAt && (
                <Row label={tr("آخر يوم في السماح")}>
                  <span className="text-(--sys-orange)">{df.format(store.gracePeriodEndsAt)}</span>
                </Row>
              )}
              <div>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5 py-3">
                <span className="min-w-0">
                  <span className="block text-[15px]">{tr("التجديد التلقائي")}</span>
                  <span className="block text-[13px] text-muted-foreground">{tr("بنجدد من الرصيد في الميعاد من غير ما تعمل حاجة.")}</span>
                </span>
                <AutoRenewSwitch storeId={store.id} initial={store.autoRenew} />
              </label>
              </div>
            </Rows>
            <div className="flex flex-wrap items-center gap-2 border-t-[0.5px] border-border px-5 py-4">
              <RenewSubscriptionModal
                storeId={store.id}
                balance={store.balance}
                monthlyPrice={store.monthlyPrice}
                subscriptionStatus={store.subscriptionStatus}
                subscriptionEndsAt={store.subscriptionEndsAt}
                gracePeriodEndsAt={store.gracePeriodEndsAt}
              />
              <Link href="/change-plan" className={cn(appleButton.plain, "mx-0")}>
                {tr("غيّر الباقة")}
              </Link>
            </div>
          </Card>

          <Card title={tr("آخر ١٢ شهر")}>
            <Rows>
              <Row label={tr("شحنت")}>
                <span className="tabular-nums">{formatMoney(toppedUp)}</span>
              </Row>
              <Row label={tr("اتجدد بيه الاشتراك")}>
                <span className="tabular-nums">{formatMoney(spent)}</span>
              </Row>
              {gifts > 0 && (
                <Row label={tr("رصيد هدية ومكافآت")}>
                  <span className="tabular-nums">{formatMoney(gifts)}</span>
                </Row>
              )}
            </Rows>
          </Card>

          <Link href="/referral" className="apple-card apple-press group flex items-center gap-3 px-5 py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-(--sys-indigo) text-white">
              <Gift className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{tr("اشحن ببلاش")}</span>
              <span className="block text-[13px] text-muted-foreground">{tr("ادعي تاجر لكاشو وخد رصيد مكافأة لما يشترك.")}</span>
            </span>
            <ChevronLeft className="size-[18px] text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

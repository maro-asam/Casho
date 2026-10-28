import Link from "next/link";
import { AlertTriangle, CalendarClock, Info, Wallet } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";

import { Row, Rows, StatusText, appleButton } from "@/components/saas-page";
import { SUBSCRIPTION_STATUS, formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { AutoRenewSwitch } from "../../balance/_components/auto-renew-switch";
import RenewSubscriptionModal from "../../balance/_components/RenewSubscriptionModal";
import { nf } from "./plan-types";
import { TierGlyph } from "./tier-glyph";
import { lazyIntl, tr, trv } from "@/lib/i18n/dashboard";

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const DAY = 86_400_000;

export type HeroStore = {
  id: string;
  balance: number;
  monthlyPrice: number;
  billingCycle: "MONTHLY" | "YEARLY";
  autoRenew: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  trialStartDate: Date | null;
};

type Notice = { tone: "warning" | "danger" | "info"; text: string; action?: { label: string; href: string } };

export function SubscriptionHero({
  store,
  plan,
  inTrial,
  now,
}: {
  store: HeroStore;
  plan: { name: string; key: string } | null;
  inTrial: boolean;
  now: Date;
}) {
  const price = store.monthlyPrice;
  const cycleWord = store.billingCycle === "YEARLY" ? tr("سنة") : tr("شهر");
  const endsAt = store.subscriptionEndsAt;
  const shortfall = Math.max(0, price - store.balance);
  const topup = (amount: number) => `/balance/topup?amount=${Math.ceil(amount / 100)}`;
  const status = inTrial ? { label: tr("تجربة مجانية"), tone: "info" as const } : (SUBSCRIPTION_STATUS[store.subscriptionStatus] ?? SUBSCRIPTION_STATUS.INACTIVE);

  // ── Period timeline ───────────────────────────────────────────────
  const periodMs = (store.billingCycle === "YEARLY" ? 365 : 30) * DAY;
  const start = inTrial && store.trialStartDate ? store.trialStartDate : endsAt ? new Date(endsAt.getTime() - periodMs) : null;
  const running = !!endsAt && endsAt.getTime() > now.getTime() && (store.subscriptionStatus === "ACTIVE" || store.subscriptionStatus === "GRACE_PERIOD");
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY)) : 0;
  const elapsed = running && start && endsAt ? Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (endsAt.getTime() - start.getTime())) * 100)) : 100;

  // ── The one thing the merchant should know right now ─────────────
  let notice: Notice | null = null;
  const s = store.subscriptionStatus;
  if (s === "PAST_DUE") {
    notice = {
      tone: "danger",
      text: shortfall > 0 ? tr("متجرك متوقف عن استقبال الطلبات. اشحن {0} وهيرجع يشتغل فورًا.", formatMoney(shortfall)) : tr("متجرك متوقف عن استقبال الطلبات. جدّد دلوقتي من رصيدك."),
      action: shortfall > 0 ? { label: tr("اشحن {0}", formatMoney(shortfall)), href: topup(shortfall) } : undefined,
    };
  } else if (s === "GRACE_PERIOD") {
    notice = {
      tone: "warning",
      text: tr("متجرك شغال فترة سماح{0}. {1}", store.gracePeriodEndsAt ? tr(" لحد {0}", df.format(store.gracePeriodEndsAt)) : "", shortfall > 0 ? tr("اشحن {0} قبلها عشان ما يتقفلش.", formatMoney(shortfall)) : tr("جدّد دلوقتي عشان ما يتقفلش.")),
      action: shortfall > 0 ? { label: tr("اشحن {0}", formatMoney(shortfall)), href: topup(shortfall) } : undefined,
    };
  } else if (s === "CANCELED" || s === "INACTIVE") {
    notice = {
      tone: "info",
      text: shortfall > 0 ? tr("اشتراكك مش مفعّل. اشحن {0} واختار باقتك تحت.", formatMoney(shortfall)) : tr("اشتراكك مش مفعّل. اختار باقتك تحت وفعّلها من رصيدك."),
      action: shortfall > 0 ? { label: tr("اشحن {0}", formatMoney(shortfall)), href: topup(shortfall) } : undefined,
    };
  } else if (!store.autoRenew && endsAt) {
    notice = { tone: "info", text: tr("التجديد التلقائي مقفول — الاشتراك هيخلص يوم {0} والمتجر هيتقفل وقتها.", df.format(endsAt)) };
  } else if (shortfall > 0 && endsAt) {
    notice = {
      tone: daysLeft <= 3 ? "danger" : "warning",
      text: tr("{0} هنخصم {1} — رصيدك {2}، ناقصك {3}.", inTrial ? tr("بعد التجربة") : tr("في التجديد الجاي"), formatMoney(price), formatMoney(store.balance), formatMoney(shortfall)),
      action: { label: tr("اشحن {0}", formatMoney(shortfall)), href: topup(shortfall) },
    };
  }

  const canRenewNow = !inTrial && !(running && s === "ACTIVE") && shortfall === 0 && price > 0;

  const renewals = price > 0 ? Math.floor(store.balance / price) : 0;
  const NoticeIcon = notice?.tone === "info" ? Info : AlertTriangle;

  return (
    <section aria-labelledby="plan-title" className="apple-card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        {/* ── Identity + period ring ─────────────────────────── */}
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div className="flex items-center gap-4">
            <TierGlyph tier={plan?.key} size="lg" />
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] font-semibold text-muted-foreground">{tr("باقتك")}</p>
              <h2 id="plan-title" className="text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">
                {trv(plan?.name) ?? tr("مفيش باقة")}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StatusText tone={status.tone}>{status.label}</StatusText>
                <span className="text-[13px] text-muted-foreground">
                  {store.billingCycle === "YEARLY" ? tr("سنوي") : tr("شهري")} · {formatMoney(price)} / {cycleWord}
                </span>
              </div>
            </div>
          </div>

          {endsAt && running ? (
            <PeriodRing
              elapsed={elapsed}
              daysLeft={daysLeft}
              warn={daysLeft <= 3}
              caption={inTrial ? tr("التجربة فاضل فيها") : tr("فاضل في الفترة دي")}
              sub={`${inTrial ? tr("تخلص") : tr("تتجدد")} ${df.format(endsAt)}`}
            />
          ) : (
            <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
              <CalendarClock className="size-[18px]" />
              {endsAt ? tr("آخر فترة خلصت {0}", df.format(endsAt)) : tr("لسه مفيش فترة اشتراك بدأت")}
            </p>
          )}
        </div>

        {/* ── Billing rows ───────────────────────────────────── */}
        <div className="border-t-[0.5px] border-border lg:border-t-0 lg:border-s-[0.5px]">
          <Rows className="pt-2 pb-0">
            <Row label={inTrial ? tr("أول خصم") : tr("التجديد الجاي")}>{endsAt && running ? df.format(endsAt) : "—"}</Row>
            <Row label={tr("رصيدك")}>
              <span className={cn("tabular-nums", shortfall > 0 && "text-(--sys-orange)")}>{formatMoney(store.balance)}</span>
            </Row>
            <Row label={tr("الرصيد يكفي")}>
              {price > 0 ? (renewals > 0 ? tr("{0} تجديد", nf.format(renewals)) : tr("ولا تجديد")) : "—"}
            </Row>
            <div>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5 py-3">
                <span className="min-w-0">
                  <span className="block text-[15px]">{tr("التجديد التلقائي")}</span>
                  <span className="block text-[13px] text-muted-foreground">{tr("من الرصيد في الميعاد.")}</span>
                </span>
                <AutoRenewSwitch storeId={store.id} initial={store.autoRenew} />
              </label>
            </div>
          </Rows>
          <div className="flex flex-wrap items-center gap-2 border-t-[0.5px] border-border px-5 py-4">
            {canRenewNow ? (
              <RenewSubscriptionModal
                storeId={store.id}
                balance={store.balance}
                monthlyPrice={store.monthlyPrice}
                subscriptionStatus={store.subscriptionStatus}
                subscriptionEndsAt={store.subscriptionEndsAt}
                gracePeriodEndsAt={store.gracePeriodEndsAt}
              />
            ) : (
              <Link href="/balance/topup" className={appleButton.tinted}>
                <Wallet className="size-4" />
                {tr("شحن رصيد")}
              </Link>
            )}
            <Link href="/balance" className={cn(appleButton.plain, "mx-0")}>
              {tr("الرصيد والحركات")}
            </Link>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={cn(
            "flex flex-col gap-3 border-t-[0.5px] border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8",
            notice.tone === "danger" && "bg-(--sys-red)/8",
            notice.tone === "warning" && "bg-(--sys-orange)/8",
          )}
        >
          <p className="flex items-start gap-2.5 text-[15px] leading-6">
            <NoticeIcon
              className={cn(
                "mt-0.5 size-[18px] shrink-0",
                notice.tone === "danger" ? "text-(--sys-red)" : notice.tone === "warning" ? "text-(--sys-orange)" : "text-primary",
              )}
            />
            {notice.text}
          </p>
          {notice.action && (
            <Link href={notice.action.href} className={cn(appleButton.filled, "h-9 px-4 text-[15px]")}>
              <Wallet className="size-4" />
              {notice.action.label}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

/** Activity-ring style countdown: the ring empties as the period runs out. */
function PeriodRing({ elapsed, daysLeft, warn, caption, sub }: { elapsed: number; daysLeft: number; warn: boolean; caption: string; sub: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const left = Math.max(0.02, 1 - elapsed / 100);
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-28 shrink-0"
        role="progressbar"
        aria-valuenow={Math.round(elapsed)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={tr("الفترة الحالية")}
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-(--fill-3)" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${c * left} ${c}`}
            className={warn ? "stroke-(--sys-orange)" : "stroke-primary"}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-[28px] leading-none font-bold tabular-nums">{nf.format(daysLeft)}</span>
          <span className="text-[12px] text-muted-foreground">{tr("يوم")}</span>
        </div>
      </div>
      <div className="space-y-0.5 sm:hidden lg:block">
        <p className="text-[15px] font-medium">{caption}</p>
        <p className="text-[13px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

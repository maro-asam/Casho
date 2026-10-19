import Link from "next/link";
import { AlertTriangle, CalendarClock, Gem, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";

import { StatusPill } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_STATUS, formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { AutoRenewSwitch } from "../../balance/_components/auto-renew-switch";
import RenewSubscriptionModal from "../../balance/_components/RenewSubscriptionModal";
import { nf } from "./plan-types";
import { lazyIntl, tr, trv } from "@/lib/i18n/dashboard";

const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const TIER_ICON: Record<string, typeof Sparkles> = { SILVER: ShieldCheck, GOLD: Sparkles, PLATINUM: Gem };
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
  const Icon = TIER_ICON[plan?.key ?? ""] ?? ShieldCheck;

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
    notice = { tone: "info", text: tr("التجديد التلقائي مقفول — الاشتراك هيخلص يوم {0} والمتجر هيتقفل بعد فترة السماح.", df.format(endsAt)) };
  } else if (shortfall > 0 && endsAt) {
    notice = {
      tone: daysLeft <= 3 ? "danger" : "warning",
      text: tr("{0} هنخصم {1} — رصيدك {2}، ناقصك {3}.", inTrial ? tr("بعد التجربة") : tr("في التجديد الجاي"), formatMoney(price), formatMoney(store.balance), formatMoney(shortfall)),
      action: { label: tr("اشحن {0}", formatMoney(shortfall)), href: topup(shortfall) },
    };
  }

  const canRenewNow = !inTrial && !(running && s === "ACTIVE") && shortfall === 0 && price > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{tr("باقتك")}</p>
              <p className="text-xl font-bold">{trv(plan?.name) ?? tr("مفيش باقة")}</p>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {store.billingCycle === "YEARLY" ? tr("سنوي") : tr("شهري")}
              </span>
            </div>
          </div>

          {endsAt && running ? (
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {inTrial ? tr("التجربة فاضل فيها") : tr("فاضل في الفترة دي")} <span className="tabular-nums">{nf.format(daysLeft)}</span>{" "}{tr("يوم")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {inTrial ? tr("تخلص") : tr("تتجدد")} {df.format(endsAt)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(elapsed)} aria-valuemin={0} aria-valuemax={100} aria-label={tr("الفترة الحالية")}>
                <div
                  className={cn("h-full rounded-full", daysLeft <= 3 ? "bg-amber-500" : "bg-primary")}
                  style={{ width: `${Math.max(2, elapsed)}%` }}
                />
              </div>
              {start && <p className="mt-1.5 text-xs text-muted-foreground">{tr("بدأت {0}", df.format(start))}</p>}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {endsAt ? tr("آخر فترة خلصت {0}", df.format(endsAt)) : tr("لسه مفيش فترة اشتراك بدأت")}
            </p>
          )}

          {notice && (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
                notice.tone === "danger" && "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300",
                notice.tone === "warning" && "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
                notice.tone === "info" && "border-border bg-muted/40 text-foreground",
              )}
            >
              <p className="flex items-start gap-2 text-sm leading-6">
                <AlertTriangle className="mt-1 size-4 shrink-0" />
                {notice.text}
              </p>
              {notice.action && (
                <Button asChild size="sm" className="shrink-0 gap-1.5">
                  <Link href={notice.action.href}>
                    <Wallet className="size-4" />
                    {notice.action.label}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="border-t border-border bg-muted/20 lg:border-s lg:border-t-0">
          <dl className="space-y-2.5 px-5 py-4 text-sm">
            <Row label={inTrial ? tr("أول خصم") : tr("التجديد الجاي")} value={endsAt && running ? df.format(endsAt) : "—"} />
            <Row label={tr("المبلغ")} value={`${formatMoney(price)} / ${cycleWord}`} />
            <Row label={tr("رصيدك")} value={formatMoney(store.balance)} warn={shortfall > 0} />
            <Row
              label={tr("الرصيد يكفي")}
              value={price > 0 ? (Math.floor(store.balance / price) > 0 ? tr("{0} تجديد", nf.format(Math.floor(store.balance / price))) : tr("ولا تجديد")) : "—"}
            />
          </dl>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span>
              <span className="block text-sm font-medium">{tr("التجديد التلقائي")}</span>
              <span className="block text-xs text-muted-foreground">{tr("من الرصيد في الميعاد.")}</span>
            </span>
            <AutoRenewSwitch storeId={store.id} initial={store.autoRenew} />
          </label>
          <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
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
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/balance/topup">
                  <Wallet className="size-4" />
                  {tr("شحن رصيد")}
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="ghost">
              <Link href="/balance">{tr("الرصيد والحركات")}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
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

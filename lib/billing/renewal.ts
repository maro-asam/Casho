import { BalanceTransactionType, NotificationType, SubscriptionStatus, type BillingCycle } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GRACE_PERIOD_DAYS, addDays } from "@/lib/subscriptions";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { grantReferralRewardIfEligible, trackPaidReferralLevel } from "@/lib/referral";
import { recordSalesCommissionsForStore } from "@/lib/sales/engine";
import { nextPeriodEnd, resolveRenewal, type RenewalPlan } from "./plan-quote";

export type RenewalOutcome = "none" | "renewed" | "grace" | "past_due";

const RENEWABLE: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.PAST_DUE];

const PLAN_SELECT = { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true } as const;

const STORE_SELECT = {
  id: true,
  slug: true,
  balance: true,
  monthlyPrice: true,
  billingCycle: true,
  autoRenew: true,
  planSelected: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  gracePeriodEndsAt: true,
  plan: { select: PLAN_SELECT },
} as const;

type BillingStore = {
  id: string;
  slug: string;
  balance: number;
  monthlyPrice: number;
  billingCycle: BillingCycle;
  planSelected: boolean;
  subscriptionEndsAt: Date | null;
  plan: RenewalPlan | null;
};

const cycleWord = (cycle: BillingCycle) => (cycle === "YEARLY" ? "سنوي" : "شهري");

/** The cheapest active plan — where a trial lands when the merchant never picked one. */
export async function getEntryPlan(): Promise<RenewalPlan | null> {
  return prisma.plan.findFirst({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }], select: PLAN_SELECT });
}

/** Price + plan of the store's next period (see `resolveRenewal`). */
export async function getRenewalQuote(store: Parameters<typeof resolveRenewal>[0]) {
  return resolveRenewal(store, store.planSelected ? null : await getEntryPlan());
}

function safeRevalidate(slug: string) {
  try {
    revalidatePath("/dashboard", "layout");
    revalidatePath(`/store/${slug}`, "layout");
  } catch {
    // Called outside a request scope (scripts) — nothing to revalidate.
  }
}

/**
 * Charges one period and moves the end date — the only place a subscription
 * period is paid for. Conditional on the end date and balance it read, so two
 * concurrent callers can never charge the same period twice. Also pins the
 * store to the plan it paid for and refreshes the cached `monthlyPrice`.
 */
async function chargePeriod(store: BillingStore, anchor: Date, now: Date, note: (planName: string) => string) {
  const { plan, price } = await getRenewalQuote(store);
  if (price <= 0 || store.balance < price) return { ok: false as const, price };

  let newEnd = nextPeriodEnd(anchor, store.billingCycle);
  if (newEnd.getTime() <= now.getTime()) newEnd = nextPeriodEnd(now, store.billingCycle);

  const charged = await prisma.$transaction(async (tx) => {
    const res = await tx.store.updateMany({
      where: { id: store.id, subscriptionEndsAt: store.subscriptionEndsAt, balance: { gte: price } },
      data: {
        balance: { decrement: price },
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: newEnd,
        gracePeriodEndsAt: null,
        monthlyPrice: price,
        ...(plan && { planId: plan.id, planName: plan.key, planSelected: true }),
      },
    });
    if (res.count !== 1) return false;

    const fresh = await tx.store.findUniqueOrThrow({ where: { id: store.id }, select: { balance: true } });
    await tx.balanceTransaction.create({
      data: {
        storeId: store.id,
        type: BalanceTransactionType.SUBSCRIPTION_CHARGE,
        amount: -price,
        balanceBefore: fresh.balance + price,
        balanceAfter: fresh.balance,
        note: note(plan ? `باقة ${plan.name} (${cycleWord(store.billingCycle)})` : cycleWord(store.billingCycle)),
      },
    });
    // A trial that rolled into the entry plan is a real plan change — keep the trail.
    if (plan && !store.planSelected) {
      await tx.planAuditLog.create({
        data: {
          storeId: store.id,
          planId: plan.id,
          action: "subscription_selected",
          before: { planId: store.plan?.id ?? null, price: store.monthlyPrice },
          after: { planId: plan.id, billingCycle: store.billingCycle, price },
          note: "أول اشتراك بعد التجربة من غير اختيار باقة — الباقة الأساسية",
        },
      });
    }
    return true;
  });

  if (!charged) return { ok: false as const, price };

  await grantReferralRewardIfEligible(store.id).catch((e) => console.error("[billing] referral", e));
  await trackPaidReferralLevel(store.id).catch((e) => console.error("[billing] referral level", e));
  await recordSalesCommissionsForStore(store.id);
  safeRevalidate(store.slug);
  return { ok: true as const, price, newEnd, plan };
}

/**
 * The one renewal engine. Charges the period price from the balance when the
 * period is over, otherwise walks the store ACTIVE → GRACE_PERIOD → PAST_DUE.
 * Safe to call from anywhere (cron, dashboard layout, top-up callbacks) and
 * concurrently.
 *
 * `includeInactive` lets a fresh top-up activate a store that never started a
 * paid period (INACTIVE) — only from merchant-initiated money events.
 */
export async function renewIfDue(storeId: string, opts: { includeInactive?: boolean; now?: Date } = {}): Promise<RenewalOutcome> {
  const now = opts.now ?? new Date();
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: STORE_SELECT });
  if (!store) return "none";

  const statusOk =
    RENEWABLE.includes(store.subscriptionStatus) || (opts.includeInactive && store.subscriptionStatus === SubscriptionStatus.INACTIVE);
  if (!statusOk) return "none";

  const endsAt = store.subscriptionEndsAt;
  const due = !endsAt || endsAt.getTime() <= now.getTime();
  if (!due) return "none";

  const { price } = await getRenewalQuote(store);
  if (store.autoRenew && price > 0 && store.balance >= price) {
    // Within grace the store kept selling, so the new period continues from the
    // old end date; after that it starts today (no paying for blocked days).
    const graceEnd = endsAt ? addDays(endsAt, DEFAULT_GRACE_PERIOD_DAYS) : null;
    const anchor = endsAt && graceEnd && graceEnd.getTime() > now.getTime() ? endsAt : now;
    const result = await chargePeriod(store, anchor, now, (what) => `تجديد تلقائي — ${what}`);
    if (!result.ok) return "none";

    await createStoreNotification({
      storeId: store.id,
      type: NotificationType.STORE_ACTIVATED,
      title: "اشتراكك اتجدد",
      message: `اتخصم ${formatPiastersAsEgp(result.price)} من رصيدك والاشتراك شغال لحد ${result.newEnd.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}.`,
      href: "/change-plan",
    });
    return "renewed";
  }

  // Can't charge: move along the dunning path.
  if (!endsAt || store.subscriptionStatus === SubscriptionStatus.PAST_DUE || store.subscriptionStatus === SubscriptionStatus.INACTIVE) {
    return "none";
  }

  const graceEnd = store.gracePeriodEndsAt ?? addDays(endsAt, DEFAULT_GRACE_PERIOD_DAYS);
  if (graceEnd.getTime() > now.getTime()) {
    if (store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD) return "none";
    await prisma.store.update({
      where: { id: store.id },
      data: { subscriptionStatus: SubscriptionStatus.GRACE_PERIOD, gracePeriodEndsAt: graceEnd },
    });
    await createStoreNotification({
      storeId: store.id,
      type: NotificationType.SUBSCRIPTION_EXPIRED,
      title: "اشتراكك محتاج تجديد",
      message: store.autoRenew
        ? `رصيدك مش مكفي للتجديد (${formatPiastersAsEgp(price)}). متجرك شغال فترة سماح لحد ${graceEnd.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })} — اشحن قبلها.`
        : `التجديد التلقائي مقفول. متجرك شغال فترة سماح لحد ${graceEnd.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}.`,
      href: "/change-plan",
    });
    safeRevalidate(store.slug);
    return "grace";
  }

  await prisma.store.update({
    where: { id: store.id },
    data: { subscriptionStatus: SubscriptionStatus.PAST_DUE, gracePeriodEndsAt: graceEnd },
  });
  await createStoreNotification({
    storeId: store.id,
    type: NotificationType.STORE_PAST_DUE,
    title: "متجرك اتقفل مؤقتًا",
    message: "فترة السماح خلصت. اشحن رصيدك وجدّد عشان المتجر يرجع يستقبل طلبات.",
    href: "/change-plan",
  });
  safeRevalidate(store.slug);
  return "past_due";
}

export type RenewNowResult =
  | { ok: true; price: number; endsAt: Date; planName: string | null }
  | { ok: false; reason: "not_found" | "canceled" | "short" | "busy"; price?: number; shortfall?: number };

/**
 * Pays one period right now (the "جدّد دلوقتي" / admin "تجديد" buttons). A
 * running period is extended from its end, so paying early never loses days.
 */
export async function renewNow(storeId: string, opts: { note?: string; now?: Date } = {}): Promise<RenewNowResult> {
  const now = opts.now ?? new Date();
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: STORE_SELECT });
  if (!store) return { ok: false, reason: "not_found" };
  if (store.subscriptionStatus === SubscriptionStatus.CANCELED) return { ok: false, reason: "canceled" };

  const anchor = store.subscriptionEndsAt && store.subscriptionEndsAt.getTime() > now.getTime() ? store.subscriptionEndsAt : now;
  const result = await chargePeriod(store, anchor, now, (what) => `${opts.note ?? "تجديد الاشتراك"} — ${what}`);
  if (!result.ok) {
    const shortfall = Math.max(0, result.price - store.balance);
    return shortfall > 0 ? { ok: false, reason: "short", price: result.price, shortfall } : { ok: false, reason: "busy", price: result.price };
  }
  return { ok: true, price: result.price, endsAt: result.newEnd, planName: result.plan?.name ?? null };
}

/** Heads-up 3 days before a renewal the balance can't cover (at most once per period). */
async function warnUpcomingShortfalls(now: Date) {
  const soon = addDays(now, 3);
  const [stores, entryPlan] = await Promise.all([
    prisma.store.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        subscriptionEndsAt: { gt: now, lte: soon },
      },
      select: { id: true, balance: true, monthlyPrice: true, billingCycle: true, planSelected: true, subscriptionEndsAt: true, plan: { select: PLAN_SELECT } },
      take: 500,
    }),
    getEntryPlan(),
  ]);

  let warned = 0;
  for (const s of stores) {
    const { price } = resolveRenewal(s, entryPlan);
    if (s.balance >= price) continue;
    const already = await prisma.notification.count({
      where: { storeId: s.id, type: NotificationType.SUBSCRIPTION_EXPIRING, createdAt: { gte: addDays(now, -4) } },
    });
    if (already) continue;
    await createStoreNotification({
      storeId: s.id,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      title: "التجديد قرّب ورصيدك مش مكفي",
      message: `التجديد يوم ${s.subscriptionEndsAt!.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })} — ناقصك ${formatPiastersAsEgp(price - s.balance)}.`,
      href: `/balance/topup?amount=${Math.ceil((price - s.balance) / 100)}`,
    });
    warned += 1;
  }
  return warned;
}

/** Cron entry point: renews / expires every due store and sends shortfall warnings. */
export async function sweepSubscriptions(now = new Date()) {
  const [due, entryPlan] = await Promise.all([
    prisma.store.findMany({
      where: {
        subscriptionStatus: { in: RENEWABLE },
        OR: [
          { subscriptionStatus: { not: SubscriptionStatus.PAST_DUE }, subscriptionEndsAt: { lte: now } },
          // PAST_DUE stores only come back if the merchant topped up meanwhile.
          { subscriptionStatus: SubscriptionStatus.PAST_DUE, autoRenew: true },
        ],
      },
      select: { id: true, balance: true, monthlyPrice: true, billingCycle: true, planSelected: true, subscriptionStatus: true, plan: { select: PLAN_SELECT } },
      take: 1000,
    }),
    getEntryPlan(),
  ]);

  const counts: Record<RenewalOutcome, number> = { none: 0, renewed: 0, grace: 0, past_due: 0 };
  for (const s of due) {
    if (s.subscriptionStatus === SubscriptionStatus.PAST_DUE && s.balance < resolveRenewal(s, entryPlan).price) continue;
    try {
      counts[await renewIfDue(s.id, { now })] += 1;
    } catch (error) {
      console.error("[renewal] store", s.id, error);
    }
  }

  const warned = await warnUpcomingShortfalls(now).catch((e) => {
    console.error("[renewal] warnings", e);
    return 0;
  });

  return { checked: due.length, ...counts, warned };
}

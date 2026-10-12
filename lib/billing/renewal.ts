import { BalanceTransactionType, NotificationType, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GRACE_PERIOD_DAYS, addDays } from "@/lib/subscriptions";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { grantReferralRewardIfEligible, trackPaidReferralLevel } from "@/lib/referral";
import { recordSalesCommissionsForStore } from "@/lib/sales/engine";
import { nextPeriodEnd } from "./plan-quote";

export type RenewalOutcome = "none" | "renewed" | "grace" | "past_due";

const RENEWABLE: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.PAST_DUE];

function safeRevalidate(slug: string) {
  try {
    revalidatePath("/dashboard", "layout");
    revalidatePath(`/store/${slug}`, "layout");
  } catch {
    // Called outside a request scope (scripts) — nothing to revalidate.
  }
}

/**
 * The one renewal engine. Charges the period price from the balance when the
 * period is over, otherwise walks the store ACTIVE → GRACE_PERIOD → PAST_DUE.
 * Safe to call from anywhere (cron, dashboard layout, top-up callbacks) and
 * concurrently: the charge is a conditional update keyed on the old end date,
 * so two callers can never charge the same period twice.
 *
 * `includeInactive` lets a fresh top-up activate a store that never started a
 * paid period (INACTIVE) — only from merchant-initiated money events.
 */
export async function renewIfDue(storeId: string, opts: { includeInactive?: boolean; now?: Date } = {}): Promise<RenewalOutcome> {
  const now = opts.now ?? new Date();
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      slug: true,
      balance: true,
      monthlyPrice: true,
      billingCycle: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      plan: { select: { name: true } },
    },
  });
  if (!store) return "none";

  const statusOk =
    RENEWABLE.includes(store.subscriptionStatus) || (opts.includeInactive && store.subscriptionStatus === SubscriptionStatus.INACTIVE);
  if (!statusOk) return "none";

  const endsAt = store.subscriptionEndsAt;
  const due = !endsAt || endsAt.getTime() <= now.getTime();
  if (!due) return "none";

  const price = store.monthlyPrice;
  if (store.autoRenew && price > 0 && store.balance >= price) {
    // Within grace the store kept selling, so the new period continues from the
    // old end date; after that it starts today (no paying for blocked days).
    const graceEnd = endsAt ? addDays(endsAt, DEFAULT_GRACE_PERIOD_DAYS) : null;
    const anchor = endsAt && graceEnd && graceEnd.getTime() > now.getTime() ? endsAt : now;
    let newEnd = nextPeriodEnd(anchor, store.billingCycle);
    if (newEnd.getTime() <= now.getTime()) newEnd = nextPeriodEnd(now, store.billingCycle);

    const charged = await prisma.$transaction(async (tx) => {
      const res = await tx.store.updateMany({
        where: { id: store.id, subscriptionEndsAt: endsAt, balance: { gte: price } },
        data: {
          balance: { decrement: price },
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionEndsAt: newEnd,
          gracePeriodEndsAt: null,
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
          note: `تجديد تلقائي — باقة ${store.plan?.name ?? ""} (${store.billingCycle === "YEARLY" ? "سنوي" : "شهري"})`.trim(),
        },
      });
      return true;
    });

    if (!charged) return "none";

    await createStoreNotification({
      storeId: store.id,
      type: NotificationType.STORE_ACTIVATED,
      title: "اشتراكك اتجدد",
      message: `اتخصم ${formatPiastersAsEgp(price)} من رصيدك والاشتراك شغال لحد ${newEnd.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}.`,
      href: "/change-plan",
    });
    await grantReferralRewardIfEligible(store.id).catch((e) => console.error("[renewal] referral", e));
    await trackPaidReferralLevel(store.id).catch((e) => console.error("[renewal] referral level", e));
    await recordSalesCommissionsForStore(store.id);
    safeRevalidate(store.slug);
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

/** Heads-up 3 days before a renewal the balance can't cover (at most once per period). */
async function warnUpcomingShortfalls(now: Date) {
  const soon = addDays(now, 3);
  const stores = await prisma.store.findMany({
    where: {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      autoRenew: true,
      subscriptionEndsAt: { gt: now, lte: soon },
    },
    select: { id: true, balance: true, monthlyPrice: true, subscriptionEndsAt: true },
    take: 500,
  });

  let warned = 0;
  for (const s of stores) {
    if (s.balance >= s.monthlyPrice) continue;
    const already = await prisma.notification.count({
      where: { storeId: s.id, type: NotificationType.SUBSCRIPTION_EXPIRING, createdAt: { gte: addDays(now, -4) } },
    });
    if (already) continue;
    await createStoreNotification({
      storeId: s.id,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      title: "التجديد قرّب ورصيدك مش مكفي",
      message: `التجديد يوم ${s.subscriptionEndsAt!.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })} — ناقصك ${formatPiastersAsEgp(s.monthlyPrice - s.balance)}.`,
      href: `/balance/topup?amount=${Math.ceil((s.monthlyPrice - s.balance) / 100)}`,
    });
    warned += 1;
  }
  return warned;
}

/** Cron entry point: renews / expires every due store and sends shortfall warnings. */
export async function sweepSubscriptions(now = new Date()) {
  const due = await prisma.store.findMany({
    where: {
      subscriptionStatus: { in: RENEWABLE },
      OR: [
        { subscriptionStatus: { not: SubscriptionStatus.PAST_DUE }, subscriptionEndsAt: { lte: now } },
        // PAST_DUE stores only come back if the merchant topped up meanwhile.
        { subscriptionStatus: SubscriptionStatus.PAST_DUE, autoRenew: true },
      ],
    },
    select: { id: true, balance: true, monthlyPrice: true, subscriptionStatus: true },
    take: 1000,
  });

  const counts: Record<RenewalOutcome, number> = { none: 0, renewed: 0, grace: 0, past_due: 0 };
  for (const s of due) {
    if (s.subscriptionStatus === SubscriptionStatus.PAST_DUE && s.balance < s.monthlyPrice) continue;
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

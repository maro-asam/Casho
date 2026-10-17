import { BillingCycle, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { priceForCycle } from "./plan-quote";
import { getEntryPlan } from "./renewal";

const dateAr = (d: Date) => d.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" });

/**
 * Re-derives every store's cached `monthlyPrice` (= price of its next period)
 * from the plans, after an admin edits plan prices/order/visibility. The
 * charge itself always re-reads the plan, so this only keeps screens honest
 * and tells merchants ahead of time. New prices apply from the next renewal;
 * the period already paid for is never touched.
 */
export async function syncStorePricesFromPlans() {
  const [plans, entryPlan] = await Promise.all([
    prisma.plan.findMany({ select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true } }),
    getEntryPlan(),
  ]);

  // [where, new price, plan name] — chosen plans per cycle, then trials (priced at the entry plan).
  const groups: { where: object; price: number; planName: string; notify: boolean }[] = [];
  for (const plan of plans) {
    for (const cycle of [BillingCycle.MONTHLY, BillingCycle.YEARLY]) {
      groups.push({ where: { planId: plan.id, planSelected: true, billingCycle: cycle }, price: priceForCycle(plan, cycle), planName: plan.name, notify: true });
    }
  }
  if (entryPlan) {
    for (const cycle of [BillingCycle.MONTHLY, BillingCycle.YEARLY]) {
      groups.push({ where: { planSelected: false, billingCycle: cycle }, price: priceForCycle(entryPlan, cycle), planName: entryPlan.name, notify: false });
    }
  }

  let updated = 0;
  for (const g of groups) {
    const changed = await prisma.store.findMany({
      where: { ...g.where, monthlyPrice: { not: g.price } },
      select: { id: true, monthlyPrice: true, subscriptionEndsAt: true, subscriptionStatus: true },
    });
    if (changed.length === 0) continue;

    await prisma.store.updateMany({ where: { id: { in: changed.map((s) => s.id) } }, data: { monthlyPrice: g.price } });
    updated += changed.length;

    if (!g.notify) continue;
    for (const s of changed) {
      const when = s.subscriptionEndsAt && s.subscriptionEndsAt > new Date() ? `من التجديد الجاي يوم ${dateAr(s.subscriptionEndsAt)}` : "من التجديد الجاي";
      await createStoreNotification({
        storeId: s.id,
        type: g.price > s.monthlyPrice ? NotificationType.PLAN_UPGRADED : NotificationType.PLAN_DOWNGRADED,
        title: "سعر باقتك اتغيّر",
        message: `سعر باقة ${g.planName} بقى ${formatPiastersAsEgp(g.price)} بدل ${formatPiastersAsEgp(s.monthlyPrice)} — هيتطبق ${when}. الفترة اللي دافعها مش هتتأثر.`,
        href: "/change-plan",
      });
    }
  }
  return { updated };
}

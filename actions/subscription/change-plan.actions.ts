"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { BalanceTransactionType, BillingCycle, NotificationType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { previewPlanChange, type PlanChangePreview } from "@/lib/entitlements";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { grantReferralRewardIfEligible, trackPaidReferralLevel } from "@/lib/referral";
import { recordSalesCommissionsForStore } from "@/lib/sales/engine";
import { quotePlanChange, type PlanQuote } from "@/lib/billing/plan-quote";

const STORE_BILLING_SELECT = {
  id: true,
  slug: true,
  planId: true,
  balance: true,
  monthlyPrice: true,
  billingCycle: true,
  autoRenew: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndDate: true,
  plan: { select: { name: true, sortOrder: true } },
} as const;

async function getOwnedStore(userId: string) {
  return prisma.store.findFirst({ where: { userId }, select: STORE_BILLING_SELECT, orderBy: { createdAt: "asc" } });
}

function parseBillingCycle(value: string): BillingCycle {
  return value === "YEARLY" ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
}

const cycleWord = (cycle: BillingCycle) => (cycle === "YEARLY" ? "سنوي" : "شهري");

export type PreviewPlanChangeResult =
  | { success: true; preview: PlanChangePreview; quote: PlanQuote; balance: number }
  | { success: false; message: string };

/** Feature diff + downgrade overages + exact money effect, for the confirmation dialog. */
export async function PreviewPlanChangeAction(targetPlanId: string, billingCycleInput: string = "MONTHLY"): Promise<PreviewPlanChangeResult> {
  try {
    const userId = await requireUserId();
    const store = await getOwnedStore(userId);
    if (!store) return { success: false, message: "مش لاقيين متجرك" };

    const target = await prisma.plan.findFirst({
      where: { id: targetPlanId, isActive: true },
      select: { id: true, monthlyPrice: true, yearlyPrice: true },
    });
    if (!target) return { success: false, message: "الباقة دي مش متاحة دلوقتي" };

    const preview = await previewPlanChange(store.id, target.id);
    const quote = quotePlanChange(store, target, parseBillingCycle(billingCycleInput));
    return { success: true, preview, quote, balance: store.balance };
  } catch (error) {
    console.error("PreviewPlanChangeAction Error:", error);
    return { success: false, message: "مقدرناش نجهّز تفاصيل التغيير. جرّب تاني." };
  }
}

export type ConfirmPlanChangeResult = {
  success: boolean;
  message: string;
  /** Set when the balance doesn't cover the change — amount to top up, piasters. */
  shortfall?: number;
};

/**
 * Applies a plan change with real money semantics (see lib/billing/plan-quote):
 * trial = free switch, running period = prorated difference now, no running
 * period = full charge + new period. Never deletes data on a downgrade — the
 * entitlement checks just stop new creation above the new limits.
 */
export async function ConfirmPlanChangeAction(targetPlanId: string, billingCycleInput: string): Promise<ConfirmPlanChangeResult> {
  try {
    const userId = await requireUserId();
    const billingCycle = parseBillingCycle(billingCycleInput);

    const target = await prisma.plan.findFirst({
      where: { id: targetPlanId, isActive: true },
      select: { id: true, key: true, name: true, sortOrder: true, monthlyPrice: true, yearlyPrice: true },
    });
    if (!target) return { success: false, message: "الباقة دي مش متاحة دلوقتي" };

    const outcome = await prisma.$transaction(async (tx) => {
      const store = await tx.store.findFirst({ where: { userId }, select: STORE_BILLING_SELECT, orderBy: { createdAt: "asc" } });
      if (!store) return { kind: "error" as const, message: "مش لاقيين متجرك" };

      const now = new Date();
      const quote = quotePlanChange(store, target, billingCycle, now);
      if (quote.mode === "same") return { kind: "same" as const };

      const planData = {
        planId: target.id,
        billingCycle,
        monthlyPrice: quote.price,
        planName: target.key,
        planSelected: true,
      };

      // Not enough balance: a lapsed store still records its choice (so the next
      // top-up activates the right plan); a running period changes nothing.
      if (quote.shortfall > 0) {
        if (quote.mode === "activate") {
          await tx.store.update({ where: { id: store.id }, data: { ...planData, autoRenew: true } });
          return { kind: "saved" as const, store, quote };
        }
        return { kind: "short" as const, quote };
      }

      if (quote.charge !== 0) {
        // Optimistic lock on the exact state the quote was priced from: a
        // concurrent change (double click, two tabs) finds it moved and does
        // nothing — otherwise a downgrade credit (negative charge, always
        // "covered") could be paid out twice.
        const res = await tx.store.updateMany({
          where: {
            id: store.id,
            balance: { gte: quote.charge },
            planId: store.planId,
            billingCycle: store.billingCycle,
            subscriptionEndsAt: store.subscriptionEndsAt,
          },
          data: {
            ...planData,
            balance: { decrement: quote.charge },
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionEndsAt: quote.periodEndsAt,
            gracePeriodEndsAt: null,
            ...(quote.mode === "activate" && { autoRenew: true }),
          },
        });
        if (res.count !== 1) {
          const now = await tx.store.findUnique({ where: { id: store.id }, select: { balance: true } });
          return (now?.balance ?? 0) < quote.charge ? { kind: "short" as const, quote } : { kind: "conflict" as const };
        }

        const fresh = await tx.store.findUniqueOrThrow({ where: { id: store.id }, select: { balance: true } });
        const refund = quote.charge < 0;
        await tx.balanceTransaction.create({
          data: {
            storeId: store.id,
            type: refund ? BalanceTransactionType.REFUND : BalanceTransactionType.SUBSCRIPTION_CHARGE,
            amount: -quote.charge,
            balanceBefore: fresh.balance + quote.charge,
            balanceAfter: fresh.balance,
            note:
              quote.mode === "activate"
                ? `اشتراك باقة ${target.name} (${cycleWord(billingCycle)})`
                : refund
                  ? `الرصيد المتبقي من باقة ${store.plan?.name ?? "السابقة"} بعد التحويل لـ ${target.name}`
                  : `التحويل لباقة ${target.name} (${cycleWord(billingCycle)}) — بعد خصم المتبقي من باقتك`,
          },
        });
      } else {
        await tx.store.update({
          where: { id: store.id },
          data: {
            ...planData,
            ...(quote.mode !== "trial" && {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionEndsAt: quote.periodEndsAt,
              gracePeriodEndsAt: null,
            }),
          },
        });
      }

      const direction = !store.plan ? "selected" : store.planId === target.id && store.billingCycle === billingCycle ? "activated" : target.sortOrder > store.plan.sortOrder ? "upgraded" : target.sortOrder < store.plan.sortOrder ? "downgraded" : "cycle_changed";
      await tx.planAuditLog.create({
        data: {
          actorUserId: userId,
          storeId: store.id,
          planId: target.id,
          action: `subscription_${direction}`,
          before: { planId: store.planId, billingCycle: store.billingCycle, price: store.monthlyPrice },
          after: { planId: target.id, billingCycle, price: quote.price, charge: quote.charge, mode: quote.mode },
        },
      });

      return { kind: "applied" as const, store, quote, direction };
    });

    if (outcome.kind === "error") return { success: false, message: outcome.message };
    if (outcome.kind === "same") return { success: true, message: "إنت مشترك في الباقة دي بالفعل" };
    if (outcome.kind === "conflict") {
      return { success: false, message: "اشتراكك اتغيّر في نفس اللحظة من مكان تاني. حدّث الصفحة وجرّب تاني." };
    }
    if (outcome.kind === "short") {
      return {
        success: false,
        shortfall: outcome.quote.shortfall,
        message: `رصيدك ناقص ${formatPiastersAsEgp(outcome.quote.shortfall)} عشان تنفّذ التغيير ده`,
      };
    }

    const { store, quote } = outcome;
    revalidatePath("/dashboard", "layout");
    revalidateStorefront(store.slug);

    if (outcome.kind === "saved") {
      return {
        success: true,
        shortfall: quote.shortfall,
        message: `اخترنا ${target.name} — اشحن ${formatPiastersAsEgp(quote.shortfall)} والاشتراك هيتفعّل تلقائي`,
      };
    }

    const downgraded = outcome.direction === "downgraded";
    await createStoreNotification({
      storeId: store.id,
      type: downgraded ? NotificationType.PLAN_DOWNGRADED : NotificationType.PLAN_UPGRADED,
      title: "باقتك اتحدثت",
      message: `إنت دلوقتي على باقة ${target.name} (${cycleWord(billingCycle)}).`,
      href: "/change-plan",
    });

    if (quote.charge > 0) {
      await grantReferralRewardIfEligible(store.id).catch((e) => console.error("[plan] referral", e));
      await trackPaidReferralLevel(store.id).catch((e) => console.error("[plan] referral level", e));
    }
    // Charges earn sales commissions; refund credits claw them back.
    if (quote.charge !== 0) await recordSalesCommissionsForStore(store.id);

    const message =
      quote.mode === "trial"
        ? `تمام! إنت على ${target.name} — مفيش أي خصم لحد ما التجربة تخلص`
        : quote.charge > 0
          ? `تم التحويل لـ ${target.name} واتخصم ${formatPiastersAsEgp(quote.charge)}`
          : quote.charge < 0
            ? `تم التحويل لـ ${target.name} ورجعنالك ${formatPiastersAsEgp(-quote.charge)} في رصيدك`
            : `تم التحويل لـ ${target.name}`;
    return { success: true, message };
  } catch (error) {
    console.error("ConfirmPlanChangeAction Error:", error);
    return { success: false, message: "حصلت مشكلة وإحنا بنغيّر الباقة. جرّب تاني." };
  }
}

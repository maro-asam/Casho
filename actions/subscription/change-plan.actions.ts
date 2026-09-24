"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { BillingCycle } from "@prisma/client";
import { previewPlanChange, type PlanChangePreview } from "@/lib/entitlements";
import { createStoreNotification } from "@/lib/notifications/in-app";

async function getOwnedStoreWithPlan(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, planId: true, billingCycle: true },
    orderBy: { createdAt: "asc" },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

function parseBillingCycle(value: string): BillingCycle {
  return value === "YEARLY" ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
}

export type PreviewPlanChangeResult =
  | { success: true; preview: PlanChangePreview }
  | { success: false; message: string };

/** Fetches the feature diff + downgrade overage warning for the confirmation modal (spec sections 13/14). */
export async function PreviewPlanChangeAction(
  targetPlanId: string,
): Promise<PreviewPlanChangeResult> {
  try {
    const userId = await requireUserId();
    const store = await getOwnedStoreWithPlan(userId);

    const preview = await previewPlanChange(store.id, targetPlanId);
    return { success: true, preview };
  } catch (error) {
    console.error("PreviewPlanChangeAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تحضير معاينة الباقة" };
  }
}

export type ConfirmPlanChangeResult = {
  success: boolean;
  message: string;
};

/**
 * The actual plan-switch mutation. Never deletes existing data on a
 * downgrade (spec section 14) — it only changes which plan's limits apply
 * going forward; assertCanUse already blocks further creation once usage
 * exceeds the new plan's limit.
 */
export async function ConfirmPlanChangeAction(
  targetPlanId: string,
  billingCycleInput: string,
): Promise<ConfirmPlanChangeResult> {
  try {
    const userId = await requireUserId();
    const store = await getOwnedStoreWithPlan(userId);
    const billingCycle = parseBillingCycle(billingCycleInput);

    const targetPlan = await prisma.plan.findUnique({
      where: { id: targetPlanId, isActive: true },
    });
    if (!targetPlan) {
      return { success: false, message: "الباقة المطلوبة غير متاحة" };
    }

    const price = billingCycle === BillingCycle.YEARLY ? targetPlan.yearlyPrice : targetPlan.monthlyPrice;
    const direction =
      !store.planId
        ? "initial"
        : store.planId === targetPlan.id && store.billingCycle === billingCycle
          ? "same"
          : "change";

    if (direction === "same") {
      return { success: true, message: "أنت مشترك في هذه الباقة بالفعل" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: {
          planId: targetPlan.id,
          billingCycle,
          monthlyPrice: price,
          planName: targetPlan.key,
          planSelected: true,
        },
      });

      await tx.planAuditLog.create({
        data: {
          actorUserId: userId,
          storeId: store.id,
          planId: targetPlan.id,
          action: direction === "initial" ? "subscription_plan_selected" : "subscription_plan_changed",
          before: { planId: store.planId, billingCycle: store.billingCycle },
          after: { planId: targetPlan.id, billingCycle },
        },
      });
    });

    await createStoreNotification({
      storeId: store.id,
      type: "PLAN_UPGRADED",
      title: "تم تحديث الباقة",
      message: `تم تحديث باقتك إلى ${targetPlan.name} (${billingCycle === "YEARLY" ? "سنوي" : "شهري"}).`,
      href: "/dashboard/change-plan",
    });

    revalidatePath("/dashboard/change-plan");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, message: "تم تحديث الباقة بنجاح" };
  } catch (error) {
    console.error("ConfirmPlanChangeAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تحديث الباقة" };
  }
}

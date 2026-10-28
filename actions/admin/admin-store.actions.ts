"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard.actions";
import { renewIfDue, renewNow, type RenewalOutcome } from "@/lib/billing/renewal";
import { addDays, normalizeBalanceAmount } from "@/lib/subscriptions";
import {
  BalanceTransactionType,
  BillingCycle,
  NotificationType,
  SubscriptionStatus,
} from "@prisma/client";
import { createNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";

type ActionResult = {
  success: boolean;
  message: string;
};

type AdminTopUpBalanceInput = {
  storeId: string;
  amount: number; // بالقروش
  note?: string;
};

type AdminAdjustBalanceInput = {
  storeId: string;
  amount: number; // موجب أو سالب
  note?: string;
};

async function getAdminStoreOrThrow(storeId: string) {
  await requireAdmin();

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
      userId: true,
      name: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return store;
}

function revalidateAdminAndMerchantPaths(storeSlug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeSlug}`);
  revalidatePath("/admin/topup-requests");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/subscription");

  revalidatePath(`/store/${storeSlug}`);
}

export async function adminTopUpStoreBalanceAction({
  storeId,
  amount,
  note,
}: AdminTopUpBalanceInput): Promise<ActionResult> {
  try {
    if (!Number.isInteger(amount) || amount <= 0) {
      return { success: false, message: "اكتب مبلغ صحيح أكبر من صفر" };
    }

    const store = await getAdminStoreOrThrow(storeId);
    const normalizedAmount = normalizeBalanceAmount(amount);

    await prisma.$transaction(async (tx) => {
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore + normalizedAmount;

      await tx.store.update({
        where: { id: store.id },
        data: {
          balance: balanceAfter,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: store.id,
          type: BalanceTransactionType.TOPUP,
          amount: normalizedAmount,
          balanceBefore,
          balanceAfter,
          note: note?.trim() || "شحن رصيد يدوي بواسطة الأدمن",
        },
      });
    });

    // نجرب نجدد الاشتراك لو المتجر كان منتهي وعنده رصيد كفاية
    await adminTryRenewStoreSubscriptionAction(store.id);

    await createNotification({
      storeId: store.id,
      type: NotificationType.TOPUP_APPROVED,
      title: "تمت إضافة رصيد لمتجرك",
      message: `فريق كاشو أضاف ${formatPiastersAsEgp(normalizedAmount)} لرصيد متجرك.`,
      href: "/dashboard/balance",
      data: { amount: normalizedAmount, source: "admin" },
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم شحن الرصيد بنجاح",
    };
  } catch (error) {
    console.error("adminTopUpStoreBalanceAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء شحن الرصيد",
    };
  }
}

export async function adminAdjustStoreBalanceAction({
  storeId,
  amount,
  note,
}: AdminAdjustBalanceInput): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);

    if (!Number.isInteger(amount) || amount === 0) {
      return {
        success: false,
        message: "قيمة التعديل غير صحيحة",
      };
    }

    const newBalance = store.balance + amount;

    if (newBalance < 0) {
      return {
        success: false,
        message: "لا يمكن خصم مبلغ أكبر من الرصيد الحالي",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: {
          balance: newBalance,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: store.id,
          type: BalanceTransactionType.MANUAL_ADJUSTMENT,
          amount,
          balanceBefore: store.balance,
          balanceAfter: newBalance,
          note: note?.trim() || "تعديل يدوي على الرصيد بواسطة الأدمن",
        },
      });
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم تعديل الرصيد بنجاح",
    };
  } catch (error) {
    console.error("adminAdjustStoreBalanceAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تعديل الرصيد",
    };
  }
}

/** Starts a paid period now — the same engine merchants and the cron use. */
export async function adminActivateStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  return adminPayPeriodNow(storeId, "تفعيل الاشتراك (من الإدارة)", "تم تفعيل الاشتراك بنجاح");
}

const ADMIN_RENEWAL_RESULTS: Record<RenewalOutcome, ActionResult> = {
  none: { success: true, message: "مفيش تجديد مستحق دلوقتي" },
  renewed: { success: true, message: "تم تجديد الاشتراك تلقائيًا من الرصيد" },
  past_due: { success: false, message: "الرصيد غير كافٍ للتجديد، والمتجر اتقفل لحد ما يتشحن" },
};

export async function adminTryRenewStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);
    const outcome = await renewIfDue(store.id);
    revalidateAdminAndMerchantPaths(store.slug);
    return ADMIN_RENEWAL_RESULTS[outcome];
  } catch (error) {
    console.error("adminTryRenewStoreSubscriptionAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء محاولة تجديد الاشتراك" };
  }
}

export async function adminRefreshStoreSubscriptionStatusAction(storeId: string): Promise<ActionResult> {
  return adminTryRenewStoreSubscriptionAction(storeId);
}

export async function adminCancelStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        autoRenew: false,
      },
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم إلغاء الاشتراك بنجاح",
    };
  } catch (error) {
    console.error("adminCancelStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء إلغاء الاشتراك",
    };
  }
}

export async function adminResumeStoreSubscriptionAutoRenewAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        autoRenew: true,
        subscriptionStatus:
          store.subscriptionStatus === SubscriptionStatus.CANCELED
            ? SubscriptionStatus.INACTIVE
            : store.subscriptionStatus,
      },
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم تفعيل التجديد التلقائي بنجاح",
    };
  } catch (error) {
    console.error("adminResumeStoreSubscriptionAutoRenewAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تفعيل التجديد التلقائي",
    };
  }
}

/** Pays the next period from the store balance now; a running period is extended from its end. */
export async function adminRenewStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  return adminPayPeriodNow(storeId, "تجديد الاشتراك (من الإدارة)", "تم تجديد الاشتراك وتفعيل المتجر بنجاح");
}

async function adminPayPeriodNow(storeId: string, note: string, okMessage: string): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);
    const result = await renewNow(store.id, { note });
    if (!result.ok) {
      const message =
        result.reason === "short"
          ? `الرصيد مش مكفي — سعر الباقة ${formatPiastersAsEgp(result.price ?? 0)} وناقص ${formatPiastersAsEgp(result.shortfall ?? 0)}`
          : result.reason === "canceled"
            ? "الاشتراك ملغي — فعّل التجديد التلقائي الأول"
            : "حصل تعارض، جرّب تاني";
      return { success: false, message };
    }
    revalidateAdminAndMerchantPaths(store.slug);
    return { success: true, message: `${okMessage} — اتخصم ${formatPiastersAsEgp(result.price)}` };
  } catch (error) {
    console.error("adminPayPeriodNow Error:", error);
    return { success: false, message: "حدث خطأ أثناء تجديد الاشتراك" };
  }
}
const MAX_EXTENSION_DAYS = 366;

/** Free days on top of the current period (or from today if it already ended). No balance is touched. */
export async function adminExtendStoreSubscriptionAction({
  storeId,
  days,
  note,
}: {
  storeId: string;
  days: number;
  note?: string;
}): Promise<ActionResult> {
  try {
    if (!Number.isInteger(days) || days < 1 || days > MAX_EXTENSION_DAYS) {
      return { success: false, message: `عدد الأيام لازم يكون بين ١ و ${MAX_EXTENSION_DAYS}` };
    }

    const admin = await requireAdmin();
    const store = await getAdminStoreOrThrow(storeId);
    const now = new Date();
    const from = store.subscriptionEndsAt && store.subscriptionEndsAt > now ? store.subscriptionEndsAt : now;
    const subscriptionEndsAt = addDays(from, days);

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: { subscriptionStatus: SubscriptionStatus.ACTIVE, subscriptionEndsAt, gracePeriodEndsAt: null },
      });
      await tx.planAuditLog.create({
        data: {
          actorUserId: admin.id,
          storeId: store.id,
          action: "admin_subscription_extended",
          before: { subscriptionStatus: store.subscriptionStatus, subscriptionEndsAt: store.subscriptionEndsAt },
          after: { subscriptionStatus: SubscriptionStatus.ACTIVE, subscriptionEndsAt, days },
          note: note?.trim() || null,
        },
      });
    });

    await createNotification({
      storeId: store.id,
      type: NotificationType.STORE_ACTIVATED,
      title: "اتمد اشتراك متجرك",
      message: `فريق كاشو ضاف ${days} يوم لاشتراكك مجانًا.`,
      href: "/dashboard/balance",
      data: { days, subscriptionEndsAt: subscriptionEndsAt.toISOString() },
    });

    revalidateAdminAndMerchantPaths(store.slug);
    return { success: true, message: `اتمد الاشتراك ${days} يوم` };
  } catch (error) {
    console.error("adminExtendStoreSubscriptionAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء مد الاشتراك" };
  }
}

/**
 * Moves a store to another plan/cycle without charging. The new price applies
 * from the next renewal — same fields the merchant change-plan flow writes.
 */
export async function adminAssignStorePlanAction({
  storeId,
  planId,
  billingCycle,
}: {
  storeId: string;
  planId: string;
  billingCycle: BillingCycle;
}): Promise<ActionResult> {
  try {
    if (billingCycle !== BillingCycle.MONTHLY && billingCycle !== BillingCycle.YEARLY) {
      return { success: false, message: "دورة الدفع غير صحيحة" };
    }

    const admin = await requireAdmin();
    const store = await getAdminStoreOrThrow(storeId);
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true },
    });
    if (!plan) return { success: false, message: "الباقة غير موجودة" };

    const price = billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;
    const before = await prisma.store.findUnique({
      where: { id: store.id },
      select: { planId: true, billingCycle: true, monthlyPrice: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: { planId: plan.id, billingCycle, monthlyPrice: price, planName: plan.key, planSelected: true },
      });
      await tx.planAuditLog.create({
        data: {
          actorUserId: admin.id,
          storeId: store.id,
          planId: plan.id,
          action: "admin_plan_assigned",
          before: before ? { planId: before.planId, billingCycle: before.billingCycle, price: before.monthlyPrice } : undefined,
          after: { planId: plan.id, billingCycle, price },
        },
      });
    });

    revalidateAdminAndMerchantPaths(store.slug);
    return { success: true, message: `المتجر بقى على باقة ${plan.name} من التجديد الجاي` };
  } catch (error) {
    console.error("adminAssignStorePlanAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تغيير الباقة" };
  }
}

/** Grants or revokes the right to hide the "Powered by Casho" footer. */
export async function adminSetPoweredByRemovalAction(storeId: string, enabled: boolean): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);
    await prisma.store.update({
      where: { id: store.id },
      data: enabled
        ? { poweredByRemovalEnabled: true, showPoweredByCasho: false }
        : { poweredByRemovalEnabled: false, showPoweredByCasho: true },
    });
    revalidateAdminAndMerchantPaths(store.slug);
    return { success: true, message: enabled ? "اتشالت علامة Powered by Casho" : "رجعت علامة Powered by Casho" };
  } catch (error) {
    console.error("adminSetPoweredByRemovalAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث العلامة" };
  }
}

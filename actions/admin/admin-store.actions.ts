"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard.actions";
import {
  addDays,
  canChargeMonthlyPlan,
  DEFAULT_GRACE_PERIOD_DAYS,
  getNextSubscriptionEndDate,
  normalizeBalanceAmount,
} from "@/lib/subscriptions";
import {
  BalanceTransactionType,
  SubscriptionStatus,
} from "@prisma/client";

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

export async function adminActivateStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);

    if (
      !canChargeMonthlyPlan({
        balance: store.balance,
        monthlyPrice: store.monthlyPrice,
      })
    ) {
      return {
        success: false,
        message: "الرصيد الحالي لا يكفي لتفعيل الاشتراك",
      };
    }

    await prisma.$transaction(async (tx) => {
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore - store.monthlyPrice;
      const now = new Date();
      const subscriptionEndsAt = getNextSubscriptionEndDate(now);

      await tx.store.update({
        where: { id: store.id },
        data: {
          balance: balanceAfter,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionEndsAt,
          gracePeriodEndsAt: null,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: store.id,
          type: BalanceTransactionType.SUBSCRIPTION_CHARGE,
          amount: -store.monthlyPrice,
          balanceBefore,
          balanceAfter,
          note: "تفعيل أول اشتراك شهري بواسطة الأدمن",
        },
      });
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم تفعيل الاشتراك بنجاح",
    };
  } catch (error) {
    console.error("adminActivateStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تفعيل الاشتراك",
    };
  }
}

export async function adminTryRenewStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);
    const now = new Date();

    if (!store.subscriptionEndsAt) {
      return {
        success: false,
        message: "لا يوجد اشتراك مفعل مسبقًا لهذا المتجر",
      };
    }

    const isExpired = store.subscriptionEndsAt.getTime() <= now.getTime();

    if (!isExpired) {
      return {
        success: true,
        message: "الاشتراك ما زال فعالًا",
      };
    }

    if (
      store.autoRenew &&
      canChargeMonthlyPlan({
        balance: store.balance,
        monthlyPrice: store.monthlyPrice,
      })
    ) {
      await prisma.$transaction(async (tx) => {
        const balanceBefore = store.balance;
        const balanceAfter = balanceBefore - store.monthlyPrice;
        const nextEndDate = getNextSubscriptionEndDate(now);

        await tx.store.update({
          where: { id: store.id },
          data: {
            balance: balanceAfter,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionEndsAt: nextEndDate,
            gracePeriodEndsAt: null,
          },
        });

        await tx.balanceTransaction.create({
          data: {
            storeId: store.id,
            type: BalanceTransactionType.SUBSCRIPTION_CHARGE,
            amount: -store.monthlyPrice,
            balanceBefore,
            balanceAfter,
            note: "تجديد الاشتراك الشهري تلقائيًا بعد إجراء الأدمن",
          },
        });
      });

      revalidateAdminAndMerchantPaths(store.slug);

      return {
        success: true,
        message: "تم تجديد الاشتراك تلقائيًا من الرصيد",
      };
    }

    const graceEndsAt = addDays(now, DEFAULT_GRACE_PERIOD_DAYS);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        gracePeriodEndsAt: graceEndsAt,
      },
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: false,
      message: "الرصيد غير كافٍ، تم إدخال المتجر في فترة السماح",
    };
  } catch (error) {
    console.error("adminTryRenewStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء محاولة تجديد الاشتراك",
    };
  }
}

export async function adminRefreshStoreSubscriptionStatusAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);
    const now = new Date();

    if (!store.subscriptionEndsAt) {
      return {
        success: false,
        message: "المتجر لا يملك اشتراكًا حتى الآن",
      };
    }

    if (
      store.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      store.subscriptionEndsAt.getTime() > now.getTime()
    ) {
      return {
        success: true,
        message: "الاشتراك ما زال نشطًا",
      };
    }

    if (
      store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD &&
      store.gracePeriodEndsAt &&
      store.gracePeriodEndsAt.getTime() <= now.getTime()
    ) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          subscriptionStatus: SubscriptionStatus.PAST_DUE,
        },
      });

      revalidateAdminAndMerchantPaths(store.slug);

      return {
        success: false,
        message: "انتهت فترة السماح وأصبح الاشتراك متأخرًا",
      };
    }

    return await adminTryRenewStoreSubscriptionAction(storeId);
  } catch (error) {
    console.error("adminRefreshStoreSubscriptionStatusAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تحديث حالة الاشتراك",
    };
  }
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

export async function adminRenewStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getAdminStoreOrThrow(storeId);

    if (
      !canChargeMonthlyPlan({
        balance: store.balance,
        monthlyPrice: store.monthlyPrice,
      })
    ) {
      return {
        success: false,
        message: "الرصيد الحالي لا يكفي لتجديد الاشتراك",
      };
    }

    await prisma.$transaction(async (tx) => {
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore - store.monthlyPrice;
      const now = new Date();

      const nextEndDate =
        store.subscriptionEndsAt && store.subscriptionEndsAt.getTime() > now.getTime()
          ? addMonths(store.subscriptionEndsAt, 1)
          : getNextSubscriptionEndDate(now);

      await tx.store.update({
        where: { id: store.id },
        data: {
          balance: balanceAfter,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionEndsAt: nextEndDate,
          gracePeriodEndsAt: null,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: store.id,
          type: BalanceTransactionType.SUBSCRIPTION_CHARGE,
          amount: -store.monthlyPrice,
          balanceBefore,
          balanceAfter,
          note: "تجديد الاشتراك يدويًا بواسطة الأدمن",
        },
      });
    });

    revalidateAdminAndMerchantPaths(store.slug);

    return {
      success: true,
      message: "تم تجديد الاشتراك بنجاح",
    };
  } catch (error) {
    console.error("adminRenewStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تجديد الاشتراك",
    };
  }
}
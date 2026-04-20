"use server";

import { prisma } from "@/lib/prisma";

import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { revalidatePath } from "next/cache";
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
import { addMonths } from "date-fns";
import { requireUserId } from "../auth/require-user-id.actions";

type ActionResult = {
  success: boolean;
  message: string;
};

type TopUpBalanceInput = {
  storeId: string;
  amount: number; // بالقروش
  note?: string;
};

type AdjustBalanceInput = {
  storeId: string;
  amount: number; // موجب أو سالب
  note?: string;
};

async function getOwnedStoreOrThrow(storeId: string) {
  const userId = await requireUserId();

  await MustOwnStore(storeId, userId);

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

export async function TopUpStoreBalanceAction({
  storeId,
  amount,
  note,
}: TopUpBalanceInput): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);
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
          note: note?.trim() || "شحن رصيد يدوي",
        },
      });
    });

    await TryRenewStoreSubscriptionAction(storeId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/subscription");

    return {
      success: true,
      message: "تم شحن الرصيد بنجاح",
    };
  } catch (error) {
    console.error("TopUpStoreBalanceAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء شحن الرصيد",
    };
  }
}

export async function AdjustStoreBalanceAction({
  storeId,
  amount,
  note,
}: AdjustBalanceInput): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);

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
          note: note?.trim() || "تعديل يدوي على الرصيد",
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/subscription");

    return {
      success: true,
      message: "تم تعديل الرصيد بنجاح",
    };
  } catch (error) {
    console.error("AdjustStoreBalanceAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تعديل الرصيد",
    };
  }
}

export async function ActivateStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);

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
          note: "تفعيل أول اشتراك شهري",
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: "تم تفعيل الاشتراك بنجاح",
    };
  } catch (error) {
    console.error("ActivateStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تفعيل الاشتراك",
    };
  }
}

export async function TryRenewStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);
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
            note: "تجديد الاشتراك الشهري تلقائيًا",
          },
        });
      });

      revalidatePath("/dashboard");
      revalidatePath(`/store/${store.slug}`);

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

    revalidatePath("/dashboard");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: false,
      message: "الرصيد غير كافٍ، تم إدخال المتجر في فترة السماح",
    };
  } catch (error) {
    console.error("TryRenewStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء محاولة تجديد الاشتراك",
    };
  }
}

export async function RefreshStoreSubscriptionStatusAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);
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

      revalidatePath("/dashboard");
      revalidatePath(`/store/${store.slug}`);

      return {
        success: false,
        message: "انتهت فترة السماح وأصبح الاشتراك متأخرًا",
      };
    }

    return await TryRenewStoreSubscriptionAction(storeId);
  } catch (error) {
    console.error("RefreshStoreSubscriptionStatusAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تحديث حالة الاشتراك",
    };
  }
}

export async function CancelStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        autoRenew: false,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: "تم إلغاء الاشتراك بنجاح",
    };
  } catch (error) {
    console.error("CancelStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء إلغاء الاشتراك",
    };
  }
}

export async function ResumeStoreSubscriptionAutoRenewAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);

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

    revalidatePath("/dashboard");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: "تم تفعيل التجديد التلقائي بنجاح",
    };
  } catch (error) {
    console.error("ResumeStoreSubscriptionAutoRenewAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تفعيل التجديد التلقائي",
    };
  }
}

export async function RenewStoreSubscriptionAction(
  storeId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        slug: true,
        balance: true,
        monthlyPrice: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        gracePeriodEndsAt: true,
      },
    });

    if (!store) {
      return {
        success: false,
        message: "المتجر غير موجود",
      };
    }

    if (store.balance < store.monthlyPrice) {
      return {
        success: false,
        message: "الرصيد الحالي لا يكفي لتجديد الاشتراك",
      };
    }

    const now = new Date();

    // لو الاشتراك الحالي لسه شغال، هنمد من تاريخ النهاية الحالي
    // غير كده هنبدأ من دلوقتي
    const baseDate =
      store.subscriptionEndsAt &&
      store.subscriptionEndsAt.getTime() > now.getTime()
        ? store.subscriptionEndsAt
        : now;

    const nextSubscriptionEndDate = addMonths(baseDate, 1);

    await prisma.$transaction(async (tx) => {
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore - store.monthlyPrice;

      await tx.store.update({
        where: { id: store.id },
        data: {
          balance: balanceAfter,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionEndsAt: nextSubscriptionEndDate,
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
          note: "تجديد الاشتراك الشهري",
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/subscription");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: "تم تجديد الاشتراك وتفعيل المتجر بنجاح",
    };
  } catch (error) {
    console.error("RenewStoreSubscriptionAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تجديد الاشتراك",
    };
  }
}

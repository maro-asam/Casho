"use server";

import { prisma } from "@/lib/prisma";

import { TrackPurchaseAction } from "@/actions/tracking/tracking.actions";
import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@prisma/client";
import { requireUserId } from "../auth/require-user-id.actions";
import { renewIfDue, renewNow, type RenewalOutcome } from "@/lib/billing/renewal";
import { formatPiastersAsEgp } from "@/lib/notifications/in-app";

type ActionResult = {
  success: boolean;
  message: string;
};

async function getOwnedStoreOrThrow(storeId: string) {
  const userId = await requireUserId();

  // Single query: ownership check + data fetch combined (avoids duplicate round trip)
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId },
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
    throw new Error("غير مصرح لك بالوصول إلى هذا المتجر");
  }

  return store;
}

async function trackSubscriptionPurchase({
  storeId,
  storeSlug,
  storeName,
  monthlyPrice,
}: {
  storeId: string;
  storeSlug: string;
  storeName?: string | null;
  monthlyPrice: number;
}) {
  try {
    await TrackPurchaseAction({
      orderId: `subscription_${Date.now()}`,
      storeId,
      storeSlug,

      total: monthlyPrice,
      currency: "EGP",

      customerEmail: undefined,
      customerPhone: undefined,
      customerFirstName: storeName || undefined,

      items: [
        {
          productId: "monthly_subscription",
          quantity: 1,
          price: monthlyPrice,
        },
      ],
    });
  } catch (error) {
    console.error("trackSubscriptionPurchase Error:", error);
  }
}

/** Starts a paid period now (store never paid, or lapsed). Same engine as renewal. */
export async function ActivateStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  return payPeriodNow(storeId, "تفعيل الاشتراك", "تم تفعيل الاشتراك بنجاح");
}

/** Renewal attempt for an expired period (charges only when due). */
export async function TryRenewStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);
    const outcome = await renewIfDue(store.id);
    revalidatePath("/dashboard");
    return RENEWAL_RESULTS[outcome];
  } catch (error) {
    console.error("TryRenewStoreSubscriptionAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء محاولة تجديد الاشتراك" };
  }
}

export async function RefreshStoreSubscriptionStatusAction(storeId: string): Promise<ActionResult> {
  return TryRenewStoreSubscriptionAction(storeId);
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
    revalidatePath("/dashboard/subscription");
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
    revalidatePath("/dashboard/subscription");
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

/** "جدّد دلوقتي": pays the next period now; a running period is extended from its end. */
export async function RenewStoreSubscriptionAction(storeId: string): Promise<ActionResult> {
  return payPeriodNow(storeId, "تجديد الاشتراك", "تم تجديد الاشتراك وتفعيل المتجر بنجاح");
}

const RENEWAL_RESULTS: Record<RenewalOutcome, ActionResult> = {
  none: { success: true, message: "الاشتراك ما زال فعالًا" },
  renewed: { success: true, message: "تم تجديد الاشتراك تلقائيًا من الرصيد" },
  past_due: { success: false, message: "الرصيد غير كافٍ للتجديد، والمتجر اتقفل لحد ما يتشحن" },
};

async function payPeriodNow(storeId: string, note: string, okMessage: string): Promise<ActionResult> {
  try {
    const store = await getOwnedStoreOrThrow(storeId);
    const result = await renewNow(store.id, { note });
    if (!result.ok) {
      const message =
        result.reason === "short"
          ? `الرصيد الحالي لا يكفي — ناقص ${formatPiastersAsEgp(result.shortfall ?? 0)}`
          : result.reason === "canceled"
            ? "الاشتراك ملغي — فعّل التجديد التلقائي الأول"
            : "حصل تعارض، جرّب تاني";
      return { success: false, message };
    }

    await trackSubscriptionPurchase({ storeId: store.id, storeSlug: store.slug, storeName: store.name, monthlyPrice: result.price });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath(`/store/${store.slug}`);
    return { success: true, message: okMessage };
  } catch (error) {
    console.error("payPeriodNow Error:", error);
    return { success: false, message: "حدث خطأ أثناء تجديد الاشتراك" };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function canStoreUsePlatform(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
    },
  });

  if (!store) return false;

  const now = new Date();

  if (
    store.subscriptionStatus === "ACTIVE" &&
    store.subscriptionEndsAt &&
    store.subscriptionEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  if (
    store.subscriptionStatus === "GRACE_PERIOD" &&
    store.gracePeriodEndsAt &&
    store.gracePeriodEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  return false;
}

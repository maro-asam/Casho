"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@prisma/client";

import { requireUserId } from "../auth/require-user-id.actions";
import { getFreeTrialEndDate } from "@/lib/subscriptions";

export async function ActivateStoreAction() {
  const userId = await requireUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      slug: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const now = new Date();

  const isActive =
    store.subscriptionStatus === SubscriptionStatus.ACTIVE &&
    store.subscriptionEndsAt &&
    store.subscriptionEndsAt.getTime() > now.getTime();

  const isInGracePeriod =
    store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD &&
    store.gracePeriodEndsAt &&
    store.gracePeriodEndsAt.getTime() > now.getTime();

  if (isActive || isInGracePeriod) {
    return {
      success: true,
      message: "المتجر مفعل بالفعل",
    };
  }

  const neverHadSubscriptionBefore = !store.subscriptionEndsAt;

  if (!neverHadSubscriptionBefore) {
    return {
      success: false,
      message: "انتهت الفترة المجانية، من فضلك اشحن الرصيد لتجديد الاشتراك",
    };
  }

  const subscriptionEndsAt = getFreeTrialEndDate(now);

  await prisma.store.update({
    where: { id: store.id },
    data: {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionEndsAt,
      gracePeriodEndsAt: null,
      autoRenew: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath(`/store/${store.slug}`);

  return {
    success: true,
    message: "تم تفعيل المتجر مجانًا لمدة 30 يوم",
  };
}

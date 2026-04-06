import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

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
    store.subscriptionStatus === SubscriptionStatus.ACTIVE &&
    store.subscriptionEndsAt &&
    store.subscriptionEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  if (
    store.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD &&
    store.gracePeriodEndsAt &&
    store.gracePeriodEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  return false;
}
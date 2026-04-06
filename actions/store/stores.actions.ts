"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { requireUserId } from "../auth/require-user-id.actions";

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
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const now = new Date();
  const subscriptionEndsAt = new Date(now);
  subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

  await prisma.store.update({
    where: { id: store.id },
    data: {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionEndsAt,
      gracePeriodEndsAt: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/store/${store.slug}`);

  return {
    success: true,
  };
}

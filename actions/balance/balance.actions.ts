"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";

/**
 * Turns automatic renewal from balance on/off — without touching the
 * subscription status (unlike CancelStoreSubscriptionAction).
 */
export async function SetAutoRenewAction(storeId: string, autoRenew: boolean): Promise<{ ok: boolean; message: string }> {
  const userId = await requireUserId();
  await MustOwnStore(storeId, userId);
  await prisma.store.update({ where: { id: storeId }, data: { autoRenew } });
  revalidatePath("/dashboard/balance");
  return {
    ok: true,
    message: autoRenew ? "التجديد التلقائي شغّال — هنجدد من رصيدك في الميعاد" : "التجديد التلقائي اتقفل — هتجدد بنفسك",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { logger } from "@/lib/logger";

export async function RejectSuggestedOrderAction(
  suggestedOrderId: string,
  reason?: string,
) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return { success: false, error: "المتجر غير موجود" };
  }

  const suggestion = await prisma.suggestedOrder.findFirst({
    where: { id: suggestedOrderId, storeId: store.id },
    select: { id: true, status: true, conversationId: true },
  });

  if (!suggestion) {
    return { success: false, error: "الطلب المقترح غير موجود" };
  }

  if (suggestion.status !== "PENDING") {
    return { success: false, error: "تم مراجعة هذا الطلب مسبقاً" };
  }

  // Merchant feedback: store rejection reason for future AI improvement
  const merchantFeedback = {
    action: "rejected",
    reason: reason ?? null,
    submittedAt: new Date().toISOString(),
  };

  await prisma.$transaction([
    prisma.suggestedOrder.update({
      where: { id: suggestedOrderId },
      data: {
        status:           "REJECTED",
        reviewedAt:       new Date(),
        reviewedByUserId: userId,
        rejectionReason:  reason ?? null,
        merchantEdited:   false,
        merchantFeedback,
      },
    }),
    // Mark conversation as IGNORED — prevents re-analysis
    prisma.instagramConversation.update({
      where: { id: suggestion.conversationId },
      data: { status: "IGNORED" },
    }),
  ]);

  logger.info("[RejectSuggestedOrder] Rejected", {
    suggestedOrderId,
    hasReason: !!reason,
  });

  revalidatePath("/dashboard/suggested-orders");
  revalidatePath("/dashboard/integrations/instagram");

  return { success: true };
}

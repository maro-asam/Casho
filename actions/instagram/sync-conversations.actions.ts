"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { syncConversations } from "@/lib/instagram/sync";

/**
 * Manually trigger a conversation sync for the current merchant's Instagram connection.
 * Fetches latest conversations from Meta API and queues AI jobs for new ones.
 */
export async function SyncInstagramConversationsAction() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return { success: false, error: "المتجر غير موجود" };
  }

  const connection = await prisma.instagramConnection.findUnique({
    where: { storeId: store.id },
    select: { id: true, status: true },
  });

  if (!connection) {
    return { success: false, error: "لا يوجد حساب انستجرام متصل" };
  }

  if (connection.status === "EXPIRED") {
    return { success: false, error: "انتهت صلاحية الربط — يرجى إعادة الاتصال" };
  }

  const { synced, errors } = await syncConversations(connection.id);

  revalidatePath("/dashboard/instagram");
  revalidatePath("/dashboard/suggested-orders");

  return {
    success: true,
    synced,
    errors: errors.length > 0 ? errors : undefined,
  };
}

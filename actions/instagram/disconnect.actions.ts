"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

/**
 * Disconnects the Instagram account for the current merchant's store.
 * Deletes the connection, conversations, messages, and all pending jobs.
 * Does NOT delete suggested orders so the merchant keeps their history.
 */
export async function DisconnectInstagramAction() {
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
    select: { id: true },
  });

  if (!connection) {
    return { success: false, error: "لا يوجد حساب انستجرام متصل" };
  }

  // Delete connection — cascade deletes conversations, messages, and jobs
  await prisma.instagramConnection.delete({
    where: { id: connection.id },
  });

  revalidatePath("/dashboard/instagram");

  return { success: true };
}

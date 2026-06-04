"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function GetTelegramStatusAction() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: {
        select: {
          telegramChatId: true,
          telegramLinkToken: true,
        },
      },
    },
  });
  return {
    linked: !!store?.settings?.telegramChatId,
    chatId: store?.settings?.telegramChatId ?? null,
    linkToken: store?.settings?.telegramLinkToken ?? null,
  };
}

export async function GenerateLinkTokenAction() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) return { success: false };

  const token = randomBytes(5).toString("hex"); // 10-char hex token

  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: { telegramLinkToken: token },
    create: { storeId: store.id, telegramLinkToken: token },
  });

  revalidatePath("/dashboard/telegram");
  return { success: true, token };
}

export async function UnlinkTelegramAction() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) return { success: false, message: "المتجر غير موجود" };

  await prisma.storeSettings.update({
    where: { storeId: store.id },
    data: { telegramChatId: null, telegramLinkToken: null },
  });

  revalidatePath("/dashboard/telegram");
  return { success: true, message: "تم إلغاء ربط تيليجرام" };
}

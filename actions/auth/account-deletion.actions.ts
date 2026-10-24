"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, SupportRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { ACCOUNT_DELETION_TITLE, OPEN_DELETION_STATUSES } from "@/lib/account-deletion";
import { createNotification } from "@/lib/notifications/in-app";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

type ActionResult = { success: boolean; message: string };

const MAX_REASON = 1000;

function findOpenRequest(userId: string) {
  return prisma.supportRequest.findFirst({
    where: { userId, title: ACCOUNT_DELETION_TITLE, status: { in: OPEN_DELETION_STATUSES } },
    select: { id: true },
  });
}

/** Files a deletion request for the admin to review. `confirmEmail` must be the account's email. */
export async function RequestAccountDeletionAction(input: { confirmEmail: string; reason: string }): Promise<ActionResult> {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stores: { select: { id: true, name: true, slug: true, balance: true, subscriptionStatus: true }, take: 1 } },
  });
  if (!user) return { success: false, message: "الحساب مش موجود" };
  if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, message: "البريد اللي كتبته مش مطابق لبريد حسابك" };
  }
  if (await findOpenRequest(userId)) return { success: false, message: "عندك طلب حذف قيد المراجعة بالفعل" };

  const store = user.stores[0] ?? null;
  const reason = input.reason.trim().slice(0, MAX_REASON);
  const message = [
    `التاجر طلب حذف حسابه (${user.email}).`,
    store ? `المتجر: ${store.name} (${store.slug}) · الاشتراك: ${store.subscriptionStatus} · الرصيد: ${store.balance / 100} ج.م` : "مفيش متجر مملوك للحساب.",
    `السبب: ${reason || "مكتبش سبب"}`,
  ].join("\n");

  const request = await prisma.supportRequest.create({
    data: { title: ACCOUNT_DELETION_TITLE, message, userId, storeId: store?.id },
  });

  await createNotification({
    userId,
    storeId: store?.id,
    type: NotificationType.SUPPORT_REQUEST_CREATED,
    title: "استلمنا طلب حذف حسابك",
    message: "فريق كاشو هيراجع الطلب ويتواصل معاك قبل التنفيذ. تقدر تلغيه من الإعدادات.",
    href: "/dashboard/settings#delete-account",
    data: { supportRequestId: request.id },
  });

  try {
    await sendTelegramMessage(`
طلب حذف حساب على Casho
الحساب: ${user.email}
${message}
مراجعة: ${process.env.NEXT_PUBLIC_APP_URL}/admin/users/${userId}
`);
  } catch (error) {
    console.error("Telegram Error:", error);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/support");
  revalidatePath("/admin", "layout");
  return { success: true, message: "تم إرسال طلب الحذف" };
}

/** Withdraws the merchant's open deletion request. */
export async function CancelAccountDeletionAction(): Promise<ActionResult> {
  const userId = await requireUserId();

  const request = await findOpenRequest(userId);
  if (!request) return { success: false, message: "مفيش طلب حذف مفتوح" };

  await prisma.supportRequest.update({ where: { id: request.id }, data: { status: SupportRequestStatus.CLOSED } });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/support");
  revalidatePath("/admin", "layout");
  return { success: true, message: "تم إلغاء طلب الحذف" };
}

"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, SupportRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { createNotification } from "@/lib/notifications/in-app";

type ActionResult = { success: boolean; message: string };

const STATUS_LABELS: Record<SupportRequestStatus, string> = {
  PENDING: "جديد",
  OPENED: "قيد المتابعة",
  RESOLVED: "اتحل",
  CLOSED: "مقفول",
};

export async function setSupportRequestStatusAction(requestId: string, status: string): Promise<ActionResult> {
  await requireAdmin();

  if (!(Object.values(SupportRequestStatus) as string[]).includes(status)) {
    return { success: false, message: "الحالة غير صالحة" };
  }
  const next = status as SupportRequestStatus;

  const request = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    select: { id: true, title: true, status: true, userId: true, storeId: true },
  });
  if (!request) return { success: false, message: "التذكرة مش موجودة" };
  if (request.status === next) return { success: true, message: "الحالة زي ما هي" };

  await prisma.supportRequest.update({ where: { id: request.id }, data: { status: next } });

  // Let the merchant know when their ticket is being handled or is done.
  if (next === SupportRequestStatus.OPENED || next === SupportRequestStatus.RESOLVED) {
    await createNotification({
      userId: request.userId,
      storeId: request.storeId,
      type: NotificationType.SYSTEM,
      title: next === SupportRequestStatus.RESOLVED ? "طلب الدعم اتحل" : "فريق الدعم بيتابع طلبك",
      message: `«${request.title}» — ${STATUS_LABELS[next]}.`,
      href: "/dashboard/support",
      data: { supportRequestId: request.id, status: next },
    });
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard/support");
  return { success: true, message: `بقت «${STATUS_LABELS[next]}»` };
}

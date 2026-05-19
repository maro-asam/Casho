"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { createNotification } from "@/lib/notifications/in-app";

export async function RequestRemovePoweredByAction(storeId: string) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      user: {
        select: {
          email: true,
          phone_number: true,
        },
      },
    },
  });

  if (!store) {
    throw new Error("المتجر غير موجود أو غير مصرح لك");
  }

  const existingRequest = await prisma.serviceRequest.findFirst({
    where: {
      storeId: store.id,
      serviceId: "remove_powered_by_casho",
      status: { in: ["PENDING", "CONTACTED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });

  if (existingRequest) {
    throw new Error("تم إرسال طلب إزالة Powered by Casho بالفعل");
  }

  const request = await prisma.serviceRequest.create({
    data: {
      serviceId: "remove_powered_by_casho",
      serviceTitle: "إزالة Powered by Casho",
      fullName: store.name,
      phone: store.user.phone_number || "غير متوفر",
      whatsapp: store.user.phone_number || undefined,
      storeLink: `/store/${store.slug}`,
      notes: `طلب إزالة عبارة Powered by Casho من المتجر: ${store.name}`,
      status: "PENDING",
      storeId: store.id,
    },
    select: { id: true },
  });

  await createNotification({
    userId,
    storeId: store.id,
    type: NotificationType.SERVICE_REQUEST_CREATED,
    title: "طلب إزالة Powered by Casho اتبعت",
    message: "استلمنا الطلب، وهنراجع تفعيل إزالة العلامة من متجرك.",
    href: "/dashboard/settings",
    data: {
      serviceRequestId: request.id,
      serviceId: "remove_powered_by_casho",
    },
  });

  await sendTelegramMessage(`
Hey Maro, تم استلام طلب جديد لإزالة Powered by Casho من المتجر: ${store.name}.
ادخل: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/admin/service-requests
`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/admin/service-requests");

  return {
    success: true,
    message: "تم إرسال الطلب للإدارة بنجاح",
  };
}

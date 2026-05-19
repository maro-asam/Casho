"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { createNotification } from "@/lib/notifications/in-app";

export async function ApproveRemovePoweredByRequestAction(requestId: string) {
  await requireAdmin();

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      storeId: true,
      serviceId: true,
      status: true,
      store: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("الطلب غير موجود");
  }

  if (!request.storeId || !request.store) {
    throw new Error("الطلب غير مربوط بمتجر");
  }

  if (request.serviceId !== "remove_powered_by_casho") {
    throw new Error("هذا الطلب ليس خاصًا بإزالة Powered by Casho");
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: "COMPLETED",
        handledAt: new Date(),
        adminNote: "تمت الموافقة على إزالة Powered by Casho",
      },
    });

    await tx.store.update({
      where: { id: request.storeId! },
      data: {
        poweredByRemovalEnabled: true,
        showPoweredByCasho: false,
      },
    });
  });

  await createNotification({
    storeId: request.storeId,
    type: NotificationType.POWERED_BY_APPROVED,
    title: "تمت الموافقة على إزالة Powered by Casho",
    message: "تم تفعيل إزالة العلامة من متجرك بنجاح.",
    href: "/dashboard/settings",
    data: {
      serviceRequestId: request.id,
      serviceId: request.serviceId,
    },
  });

  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/stores/${request.store.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/store/${request.store.slug}`);
}

export async function RejectRemovePoweredByRequestAction(requestId: string) {
  await requireAdmin();

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      storeId: true,
      serviceId: true,
      store: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("الطلب غير موجود");
  }

  if (request.serviceId !== "remove_powered_by_casho") {
    throw new Error("هذا الطلب ليس خاصًا بإزالة Powered by Casho");
  }

  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: {
      status: "CANCELED",
      handledAt: new Date(),
      adminNote: "تم رفض طلب إزالة Powered by Casho",
    },
  });

  if (request.storeId) {
    await createNotification({
      storeId: request.storeId,
      type: NotificationType.POWERED_BY_REJECTED,
      title: "تم رفض طلب إزالة Powered by Casho",
      message: "تم رفض الطلب. تقدر تتواصل مع الدعم لو محتاج تفاصيل.",
      href: "/dashboard/settings",
      data: {
        serviceRequestId: request.id,
        serviceId: request.serviceId,
      },
    });
  }

  revalidatePath("/admin/service-requests");
  revalidatePath("/dashboard/notifications");

  if (request.store?.slug) {
    revalidatePath(`/admin/stores/${request.store.slug}`);
  }
}

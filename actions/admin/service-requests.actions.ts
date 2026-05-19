"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, ServiceRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  createNotification,
  serviceRequestStatusLabels,
} from "@/lib/notifications/in-app";

type UpdateServiceRequestStatusState = {
  success?: boolean;
  error?: string;
};

const allowedStatuses: ServiceRequestStatus[] = [
  ServiceRequestStatus.PENDING,
  ServiceRequestStatus.CONTACTED,
  ServiceRequestStatus.IN_PROGRESS,
  ServiceRequestStatus.COMPLETED,
  ServiceRequestStatus.CANCELED,
];

export async function updateServiceRequestStatusAction(
  _prevState: UpdateServiceRequestStatusState | null,
  formData: FormData,
): Promise<UpdateServiceRequestStatusState> {
  await requireAdmin();

  const requestId = formData.get("requestId")?.toString().trim();
  const status = formData.get("status")?.toString().trim() as ServiceRequestStatus;

  if (!requestId) {
    return { error: "معرف الطلب غير موجود" };
  }

  if (!allowedStatuses.includes(status)) {
    return { error: "الحالة غير صالحة" };
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      serviceTitle: true,
      status: true,
      storeId: true,
    },
  });

  if (!request) {
    return { error: "الطلب غير موجود" };
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status },
  });

  if (request.storeId && request.status !== status) {
    await createNotification({
      storeId: request.storeId,
      type: NotificationType.SERVICE_REQUEST_UPDATED,
      title: "تحديث على طلب الخدمة",
      message: `طلب ${request.serviceTitle} أصبح ${serviceRequestStatusLabels[status] ?? status}.`,
      href: "/dashboard/services",
      data: {
        serviceRequestId: request.id,
        previousStatus: request.status,
        status,
      },
    });
  }

  revalidatePath("/admin/service-requests");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/notifications");

  return { success: true };
}

export async function ApproveRemovePoweredByRequestAction(requestId: string) {
  const admin = await requireAdmin();

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      serviceId: true,
      storeId: true,
      status: true,
    },
  });

  if (!request) {
    throw new Error("الطلب غير موجود");
  }

  if (!request.storeId) {
    throw new Error("الطلب غير مربوط بمتجر");
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: "COMPLETED",
        handledAt: new Date(),
        handledById: admin.id,
        adminNote: "تمت الموافقة على إزالة Powered by Casho",
      },
    });

    if (request.serviceId === "remove_powered_by_casho") {
      await tx.store.update({
        where: { id: request.storeId! },
        data: {
          poweredByRemovalEnabled: true,
          showPoweredByCasho: false,
        },
      });
    }
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
  revalidatePath("/admin/stores");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
}

export async function RejectRemovePoweredByRequestAction(
  requestId: string,
  adminNote?: string,
) {
  const admin = await requireAdmin();

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      storeId: true,
      serviceId: true,
    },
  });

  if (!request) {
    throw new Error("الطلب غير موجود");
  }

  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: {
      status: "CANCELED",
      handledAt: new Date(),
      handledById: admin.id,
      adminNote: adminNote || "تم رفض الطلب",
    },
  });

  if (request.storeId) {
    await createNotification({
      storeId: request.storeId,
      type: NotificationType.POWERED_BY_REJECTED,
      title: "تم رفض طلب إزالة Powered by Casho",
      message: adminNote || "تم رفض الطلب. تقدر تتواصل مع الدعم لو محتاج تفاصيل.",
      href: "/dashboard/settings",
      data: {
        serviceRequestId: request.id,
        serviceId: request.serviceId,
      },
    });
  }

  revalidatePath("/admin/service-requests");
  revalidatePath("/dashboard/notifications");
}

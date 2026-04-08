"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { ServiceRequestStatus } from "@/lib/generated/prisma/enums";

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
  const status = formData
    .get("status")
    ?.toString()
    .trim() as ServiceRequestStatus;

  if (!requestId) {
    return {
      error: "معرف الطلب غير موجود",
    };
  }

  if (!allowedStatuses.includes(status)) {
    return {
      error: "الحالة غير صالحة",
    };
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });

  if (!request) {
    return {
      error: "الطلب غير موجود",
    };
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status },
  });

  revalidatePath("/admin/service-requests");

  return {
    success: true,
  };
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        where: { id: request.storeId },
        data: {
          poweredByRemovalEnabled: true,
          showPoweredByCasho: false,
        },
      });
    }
  });

  revalidatePath("/admin/service-requests");
  revalidatePath("/admin/stores");
  revalidatePath("/dashboard");
}

export async function RejectRemovePoweredByRequestAction(
  requestId: string,
  adminNote?: string,
) {
  const admin = await requireAdmin();

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
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

  revalidatePath("/admin/service-requests");
}

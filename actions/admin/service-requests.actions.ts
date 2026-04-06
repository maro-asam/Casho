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
  const status = formData.get("status")?.toString().trim() as ServiceRequestStatus;

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
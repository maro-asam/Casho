import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationDb = typeof prisma | Prisma.TransactionClient;

export type CreateNotificationInput = {
  userId?: string | null;
  storeId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  data?: Prisma.InputJsonValue | null;
};

export function formatPiastersAsEgp(amountInPiasters: number) {
  const amount = amountInPiasters / 100;

  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: amountInPiasters % 100 === 0 ? 0 : 2,
  }).format(amount);
}

export const orderStatusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  PAID: "مدفوع",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELED: "ملغي",
};

export const serviceRequestStatusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONTACTED: "تم التواصل",
  IN_PROGRESS: "جاري التنفيذ",
  COMPLETED: "مكتمل",
  CANCELED: "ملغي",
};

export async function createNotification(
  input: CreateNotificationInput,
  db: NotificationDb = prisma,
) {
  if (!input.userId && !input.storeId) {
    return null;
  }

  try {
    let resolvedUserId = input.userId ?? null;

    if (!resolvedUserId && input.storeId) {
      const storeOwner = await db.store.findUnique({
        where: { id: input.storeId },
        select: { userId: true },
      });

      resolvedUserId = storeOwner?.userId ?? null;
    }

    return await db.notification.create({
      data: {
        userId: resolvedUserId,
        storeId: input.storeId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
        ...(input.data === undefined || input.data === null
          ? {}
          : { data: input.data }),
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("createNotification Error:", {
      type: input.type,
      userId: input.userId ?? null,
      storeId: input.storeId ?? null,
      error,
    });

    return null;
  }
}

export async function createStoreNotification(input: Omit<CreateNotificationInput, "userId">) {
  return createNotification(input);
}

export async function createUserNotification(input: Omit<CreateNotificationInput, "storeId">) {
  return createNotification(input);
}

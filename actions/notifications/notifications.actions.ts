"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  data: Prisma.JsonValue | null;
  createdAt: string;
  readAt: string | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string | null;
  data: Prisma.JsonValue | null;
  createdAt: Date;
  readAt: Date | null;
};

function serializeNotification(notification: NotificationRow): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href,
    data: notification.data,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

async function getNotificationScope() {
  const userId = await requireUserId();
  const stores = await prisma.store.findMany({
    where: { userId },
    select: { id: true },
  });

  return {
    userId,
    storeIds: stores.map((store) => store.id),
  };
}

function buildScopeWhere(userId: string, storeIds: string[], notificationId?: string) {
  const OR: Prisma.NotificationWhereInput[] = [{ userId }];

  if (storeIds.length > 0) {
    OR.push({ storeId: { in: storeIds } });
  }

  return {
    ...(notificationId ? { id: notificationId } : {}),
    OR,
  } satisfies Prisma.NotificationWhereInput;
}

export async function GetNotificationsAction(limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const { userId, storeIds } = await getNotificationScope();
  const where = buildScopeWhere(userId, storeIds);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        href: true,
        data: true,
        createdAt: true,
        readAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        ...where,
        readAt: null,
      },
    }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
  };
}

export async function GetUnreadNotificationsCountAction() {
  const { userId, storeIds } = await getNotificationScope();
  const where = buildScopeWhere(userId, storeIds);

  return prisma.notification.count({
    where: {
      ...where,
      readAt: null,
    },
  });
}

export async function MarkNotificationAsReadAction(notificationId: string) {
  const id = notificationId.trim();

  if (!id) {
    return { success: false, message: "الإشعار غير موجود" };
  }

  const { userId, storeIds } = await getNotificationScope();
  const existing = await prisma.notification.findFirst({
    where: buildScopeWhere(userId, storeIds, id),
    select: { id: true, readAt: true },
  });

  if (!existing) {
    return { success: false, message: "الإشعار غير موجود" };
  }

  if (!existing.readAt) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  return { success: true };
}

export async function MarkAllNotificationsAsReadAction() {
  const { userId, storeIds } = await getNotificationScope();
  const where = buildScopeWhere(userId, storeIds);

  await prisma.notification.updateMany({
    where: {
      ...where,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  return { success: true };
}

export async function DeleteNotificationAction(notificationId: string) {
  const id = notificationId.trim();

  if (!id) {
    return { success: false, message: "الإشعار غير موجود" };
  }

  const { userId, storeIds } = await getNotificationScope();
  const existing = await prisma.notification.findFirst({
    where: buildScopeWhere(userId, storeIds, id),
    select: { id: true },
  });

  if (!existing) {
    return { success: false, message: "الإشعار غير موجود" };
  }

  await prisma.notification.delete({ where: { id: existing.id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  return { success: true };
}

export async function DeleteReadNotificationsAction() {
  const { userId, storeIds } = await getNotificationScope();
  const where = buildScopeWhere(userId, storeIds);

  await prisma.notification.deleteMany({
    where: {
      ...where,
      readAt: { not: null },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  return { success: true };
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

export async function GetCustomerTimelineAction(customerId: string, page = 1) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const PAGE = 30;
  const [events, total] = await Promise.all([
    prisma.customerTimeline.findMany({
      where: { customerId, storeId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    prisma.customerTimeline.count({ where: { customerId, storeId } }),
  ]);

  return { events, total, totalPages: Math.ceil(total / PAGE) };
}

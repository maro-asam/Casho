import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NavBadges } from "@/app/(merchant)/_components/main/dashboard-nav";

/** The sidebar's live counts. Orders = the "pending" tab on the orders page, so the numbers match. */
export async function countNavBadges(storeId: string): Promise<NavBadges> {
  const pendingOrders = await prisma.order.count({ where: { storeId, status: OrderStatus.PENDING } });
  return { "/orders": pendingOrders };
}

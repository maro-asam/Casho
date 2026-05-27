"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

const ABANDONED_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours

export type AbandonedCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    images: string[];
    slug: string;
  };
};

export type AbandonedCart = {
  sessionId: string;
  items: AbandonedCartItem[];
  total: number;
  abandonedAt: Date;
  itemCount: number;
};

export async function GetAbandonedCartsAction(): Promise<{
  carts: AbandonedCart[];
  totalValue: number;
  totalCarts: number;
}> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { carts: [], totalValue: 0, totalCarts: 0 };

  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);

  const [orderedSessions, cartItems] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id },
      select: { guestSessionId: true },
    }),
    prisma.cartItem.findMany({
      where: {
        storeId: store.id,
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        guestSessionId: true,
        productId: true,
        quantity: true,
        createdAt: true,
        product: {
          select: {
            name: true,
            price: true,
            images: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const orderedSet = new Set(orderedSessions.map((o) => o.guestSessionId));

  const bySession = new Map<
    string,
    { items: AbandonedCartItem[]; oldestAt: Date }
  >();

  for (const item of cartItems) {
    if (orderedSet.has(item.guestSessionId)) continue;

    if (!bySession.has(item.guestSessionId)) {
      bySession.set(item.guestSessionId, { items: [], oldestAt: item.createdAt });
    }

    const entry = bySession.get(item.guestSessionId)!;
    entry.items.push({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    });

    if (item.createdAt < entry.oldestAt) {
      entry.oldestAt = item.createdAt;
    }
  }

  const carts: AbandonedCart[] = Array.from(bySession.entries()).map(
    ([sessionId, { items, oldestAt }]) => {
      const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      return {
        sessionId,
        items,
        total,
        abandonedAt: oldestAt,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    },
  );

  carts.sort((a, b) => b.abandonedAt.getTime() - a.abandonedAt.getTime());

  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  return { carts, totalValue, totalCarts: carts.length };
}

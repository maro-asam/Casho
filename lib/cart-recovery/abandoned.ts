import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** A cart counts as abandoned once nothing happened in it for this long. */
export const ABANDONED_AFTER_MS = 60 * 60 * 1000;

export const newRecoveryToken = () => randomBytes(12).toString("base64url");

export type RecoveryStatus = "new" | "contacted" | "recovered" | "unreachable";

export type AbandonedCartRow = {
  /** guestSessionId — the merchant-side key. */
  key: string;
  status: RecoveryStatus;
  fullName: string | null;
  phone: string | null;
  items: { productId: string; name: string; slug: string; image: string | null; quantity: number; price: number }[];
  itemCount: number;
  /** Piasters. */
  value: number;
  lastActivityAt: Date;
  contactedAt: Date | null;
  contactCount: number;
  convertedAt: Date | null;
  orderId: string | null;
};

function effectivePrice(price: number, wholesale: unknown, qty: number) {
  const tiers = wholesale as { minQty: number; maxQty?: number; price: number }[] | null;
  if (!Array.isArray(tiers)) return price;
  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tiers[i];
    if (qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty)) return t.price;
  }
  return price;
}

/**
 * Open carts idle for ABANDONED_AFTER_MS (within `days`), merged with their
 * contact/recovery record, plus carts that came back and bought.
 */
export async function loadAbandonedCarts(storeId: string, days: number): Promise<AbandonedCartRow[]> {
  const since = new Date(Date.now() - days * 86400_000);
  const idleBefore = new Date(Date.now() - ABANDONED_AFTER_MS);

  const [items, recoveries] = await Promise.all([
    prisma.cartItem.findMany({
      where: { storeId, createdAt: { gte: since } },
      select: {
        guestSessionId: true,
        quantity: true,
        createdAt: true,
        product: { select: { id: true, name: true, slug: true, image: true, price: true, wholesaleOptions: true, isActive: true } },
      },
    }),
    prisma.cartRecovery.findMany({
      where: { storeId, OR: [{ updatedAt: { gte: since } }, { convertedAt: { gte: since } }] },
    }),
  ]);

  const recoveryBySession = new Map(recoveries.map((r) => [r.guestSessionId, r]));
  const bySession = new Map<string, typeof items>();
  for (const item of items) {
    const list = bySession.get(item.guestSessionId) ?? [];
    list.push(item);
    bySession.set(item.guestSessionId, list);
  }

  const rows: AbandonedCartRow[] = [];

  for (const [session, list] of bySession) {
    const last = list.reduce((max, i) => (i.createdAt > max ? i.createdAt : max), list[0].createdAt);
    const rec = recoveryBySession.get(session);
    // Activity = the customer touching the cart (not the merchant contacting them).
    const lastActivity = last;
    if (lastActivity > idleBefore) continue; // still shopping
    if (rec?.dismissedAt && rec.dismissedAt >= last) continue;

    const lines = list.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      slug: i.product.slug,
      image: i.product.image || null,
      quantity: i.quantity,
      price: Math.round(effectivePrice(i.product.price, i.product.wholesaleOptions, i.quantity) * 100),
    }));
    rows.push({
      key: session,
      status: rec?.contactedAt ? "contacted" : rec?.phone ? "new" : "unreachable",
      fullName: rec?.fullName ?? null,
      phone: rec?.phone ?? null,
      items: lines,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      value: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      lastActivityAt: lastActivity,
      contactedAt: rec?.contactedAt ?? null,
      contactCount: rec?.contactCount ?? 0,
      convertedAt: null,
      orderId: null,
    });
  }

  // Came back and bought after we reached out.
  for (const rec of recoveries) {
    if (!rec.convertedAt || !rec.contactedAt || rec.convertedAt < since) continue;
    rows.push({
      key: rec.guestSessionId,
      status: "recovered",
      fullName: rec.fullName,
      phone: rec.phone,
      items: [],
      itemCount: 0,
      value: rec.orderTotal ?? 0,
      lastActivityAt: rec.convertedAt,
      contactedAt: rec.contactedAt,
      contactCount: rec.contactCount,
      convertedAt: rec.convertedAt,
      orderId: rec.orderId,
    });
  }

  return rows.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
}

/** Called after an order is placed: closes the loop on any recovery for that session. */
export async function markCartConverted(storeId: string, guestSessionId: string, order: { id: string; total: number; fullName: string; phone: string }) {
  try {
    await prisma.cartRecovery.updateMany({
      where: { storeId, OR: [{ guestSessionId }, { restoredSessionId: guestSessionId }], convertedAt: null },
      data: { convertedAt: new Date(), orderId: order.id, orderTotal: order.total, fullName: order.fullName, phone: order.phone },
    });
  } catch (error) {
    console.error("markCartConverted:", error);
  }
}

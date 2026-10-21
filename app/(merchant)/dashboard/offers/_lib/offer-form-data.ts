import { prisma } from "@/lib/prisma";
import type { EditableOffer } from "../_components/offer-form";

const PRODUCT_SELECT = { id: true, name: true, image: true, price: true, isActive: true } as const;

export async function loadOfferStore(userId: string) {
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

/** The offer as the form edits it, plus its real performance (non-canceled orders). */
export async function loadEditableOffer(storeId: string, offerId: string): Promise<EditableOffer | null> {
  const offer = await prisma.productOffer.findFirst({
    where: { id: offerId, storeId },
    include: { offerProduct: { select: PRODUCT_SELECT } },
  });
  if (!offer) return null;

  const [triggerProducts, sales] = await Promise.all([
    offer.triggerProductIds.length
      ? prisma.product.findMany({ where: { id: { in: offer.triggerProductIds }, storeId }, select: PRODUCT_SELECT })
      : Promise.resolve([]),
    prisma.$queryRaw<{ revenue: bigint | null; orders: bigint }[]>`
      SELECT SUM(oi."price" * oi."quantity")::bigint AS revenue, COUNT(DISTINCT oi."orderId")::bigint AS orders
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE oi."offerId" = ${offer.id} AND o."status" <> 'CANCELED'`,
  ]);

  return {
    id: offer.id,
    type: offer.type,
    name: offer.name,
    headline: offer.headline,
    isActive: offer.isActive,
    priority: offer.priority,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    offerProduct: offer.offerProduct,
    triggers: offer.triggerProductIds.flatMap((id) => triggerProducts.find((p) => p.id === id) ?? []),
    stats: {
      views: offer.views,
      accepts: offer.accepts,
      revenue: Number(sales[0]?.revenue ?? 0),
      orders: Number(sales[0]?.orders ?? 0),
    },
  };
}

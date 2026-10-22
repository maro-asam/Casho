// Loads the offers a shopper can see: after adding a product (OfferHost) and
// under the cart (CartOffers). Server-only; themes never call it directly.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { defaultHeadline, offerDiscountLabel, offerUnitPrice, rankOffers, type OfferType } from "./offer-pricing";

export type StorefrontOffer = {
  id: string;
  type: OfferType;
  headline: string;
  discountLabel: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    /** EGP per piece before / after the offer. */
    price: number;
    offerPrice: number;
    sizes: string[];
    colors: string[];
  };
};

export type ProductOffers = { upsell: StorefrontOffer | null; downsell: StorefrontOffer | null; crossSells: StorefrontOffer[] };

const OFFER_ROW_SELECT = {
  id: true,
  type: true,
  headline: true,
  priority: true,
  triggerProductIds: true,
  discountType: true,
  discountValue: true,
  offerProduct: { select: { id: true, name: true, slug: true, image: true, price: true, sizes: true, colors: true } },
} satisfies Prisma.ProductOfferSelect;

type OfferRow = Prisma.ProductOfferGetPayload<{ select: typeof OFFER_ROW_SELECT }>;

function toStorefrontOffer(row: OfferRow): StorefrontOffer {
  const p = row.offerProduct;
  return {
    id: row.id,
    type: row.type,
    headline: row.headline?.trim() || defaultHeadline(row.type),
    discountLabel: offerDiscountLabel(row),
    product: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image || "/images/product-placeholder.png",
      price: p.price,
      offerPrice: offerUnitPrice(p.price, row),
      sizes: p.sizes,
      colors: p.colors,
    },
  };
}

/** Live offers triggered by any of `productIds`, offering a sellable product not in `excludeProductIds`. */
async function liveOffers(storeId: string, productIds: string[], excludeProductIds: string[], types?: OfferType[]) {
  const rows = await prisma.productOffer.findMany({
    where: {
      storeId,
      isActive: true,
      ...(types && { type: { in: types } }),
      OR: [{ triggerProductIds: { isEmpty: true } }, { triggerProductIds: { hasSome: productIds } }],
      offerProductId: { notIn: [...productIds, ...excludeProductIds] },
      offerProduct: { isActive: true, OR: [{ stock: { gt: 0 } }, { isDigital: true }] },
    },
    select: OFFER_ROW_SELECT,
    take: 30,
  });
  return rankOffers(rows);
}

/** One product just went into the cart: its best upsell, the downsell behind it, and cross-sells. */
export async function getProductOffers(storeId: string, productId: string, cartProductIds: string[]): Promise<ProductOffers> {
  const ranked = await liveOffers(storeId, [productId], cartProductIds);
  const crossSells: StorefrontOffer[] = [];
  for (const row of ranked) {
    if (row.type !== "CROSS_SELL" || crossSells.some((o) => o.product.id === row.offerProduct.id)) continue;
    crossSells.push(toStorefrontOffer(row));
    if (crossSells.length === 3) break;
  }
  const upsell = ranked.find((r) => r.type === "UPSELL");
  const downsell = ranked.find((r) => r.type === "DOWNSELL" && r.offerProduct.id !== upsell?.offerProduct.id);
  return {
    upsell: upsell ? toStorefrontOffer(upsell) : null,
    downsell: downsell ? toStorefrontOffer(downsell) : null,
    crossSells,
  };
}

/** "Complete your order" under the cart: cross-sells for what's already in it. */
export async function getCartCrossSells(storeId: string, cartProductIds: string[], limit = 4): Promise<StorefrontOffer[]> {
  if (cartProductIds.length === 0) return [];
  const ranked = await liveOffers(storeId, cartProductIds, [], ["CROSS_SELL"]);
  const out: StorefrontOffer[] = [];
  for (const row of ranked) {
    if (out.some((o) => o.product.id === row.offerProduct.id)) continue;
    out.push(toStorefrontOffer(row));
    if (out.length === limit) break;
  }
  return out;
}

/** Cheap check so stores without offers don't mount the offer UI at all. */
export async function storeHasLiveOffers(storeId: string) {
  return (await prisma.productOffer.count({ where: { storeId, isActive: true }, take: 1 })) > 0;
}

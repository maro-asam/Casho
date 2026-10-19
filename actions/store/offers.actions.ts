"use server";

// Storefront side of upsell / cross-sell / downsell offers. The offer UI
// (OfferHost, CartOffers) calls these; prices are always re-derived here and
// again at checkout — the browser never sends a price.

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { MustSession, ReadSession } from "../auth/auth-helpers.actions";
import { queueStoreServerEvent } from "@/lib/pixels/server";
import { offerMatches, offerUnitPrice } from "@/lib/offers/offer-pricing";
import { getProductOffers, type ProductOffers } from "@/lib/offers/storefront-offers";

const NO_OFFERS: ProductOffers = { upsell: null, downsell: null, crossSells: [] };

async function storeBySlug(storeSlug: string) {
  return prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
}

/** Offers to show right after `productId` was added to the cart. */
export async function GetProductOffersAction(storeSlug: string, productId: string): Promise<ProductOffers> {
  const store = await storeBySlug(storeSlug);
  if (!store || typeof productId !== "string") return NO_OFFERS;

  const { guestSessionId } = await ReadSession();
  const inCart = guestSessionId
    ? await prisma.cartItem.findMany({ where: { guestSessionId, storeId: store.id }, select: { productId: true } })
    : [];
  const cartProductIds = [...new Set(inCart.map((i) => i.productId))].filter((id) => id !== productId);

  return getProductOffers(store.id, productId, cartProductIds).catch(() => NO_OFFERS);
}

/** Counts impressions (the "views" behind each offer's accept rate). */
export async function TrackOfferViewsAction(storeSlug: string, offerIds: string[]) {
  const ids = Array.isArray(offerIds) ? offerIds.filter((id) => typeof id === "string").slice(0, 10) : [];
  if (!ids.length) return;
  const store = await storeBySlug(storeSlug);
  if (!store) return;
  await prisma.productOffer
    .updateMany({ where: { id: { in: ids }, storeId: store.id }, data: { views: { increment: 1 } } })
    .catch(() => null);
}

type AcceptInput = {
  /** For an upsell: the product being upgraded (removed from the cart). */
  triggerProductId?: string | null;
  /** For an upsell: how many pieces to upgrade. Cross-sells and downsells add one. */
  quantity?: number;
  features?: Record<string, string>;
};

export async function AcceptOfferAction(storeSlug: string, offerId: string, input: AcceptInput = {}) {
  const { guestSessionId } = await MustSession();
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true, slug: true } });
  if (!store) return { success: false as const, message: "المتجر مش موجود" };

  const offer = await prisma.productOffer.findFirst({
    where: { id: offerId, storeId: store.id, isActive: true },
    select: {
      id: true,
      type: true,
      offerProductId: true,
      triggerProductIds: true,
      discountType: true,
      discountValue: true,
      offerProduct: { select: { id: true, name: true, price: true, stock: true, isActive: true, sizes: true, colors: true } },
    },
  });
  if (!offer || !offer.offerProduct.isActive) return { success: false as const, message: "العرض ده خلص" };
  const product = offer.offerProduct;

  // Options: required when the product has them, and must be real values.
  const features: Record<string, string> = {};
  if (product.sizes.length) {
    if (!input.features?.size || !product.sizes.includes(input.features.size)) return { success: false as const, message: "اختار المقاس" };
    features.size = input.features.size;
  }
  if (product.colors.length) {
    if (!input.features?.color || !product.colors.includes(input.features.color)) return { success: false as const, message: "اختار اللون" };
    features.color = input.features.color;
  }
  const selectedFeatures = Object.keys(features).length ? features : null;

  const triggerProductId =
    offer.type === "UPSELL" && input.triggerProductId && offerMatches(offer, input.triggerProductId) ? input.triggerProductId : null;
  if (offer.type === "UPSELL" && !triggerProductId) return { success: false as const, message: "العرض ده مش للمنتج ده" };
  const qty = offer.type === "UPSELL" ? Math.min(20, Math.max(1, Math.floor(Number(input.quantity) || 1))) : 1;

  const inCart = await prisma.cartItem.aggregate({
    where: { guestSessionId, storeId: store.id, productId: product.id },
    _sum: { quantity: true },
  });
  if ((inCart._sum.quantity ?? 0) + qty > product.stock) {
    return { success: false as const, message: "الكمية المتاحة من المنتج ده خلصت" };
  }

  await prisma.$transaction(async (tx) => {
    if (triggerProductId) {
      // Upgrade = the upsell replaces the pieces just added (newest lines first).
      const lines = await tx.cartItem.findMany({
        where: { guestSessionId, storeId: store.id, productId: triggerProductId, offerId: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, quantity: true },
      });
      let left = qty;
      for (const line of lines) {
        if (left <= 0) break;
        if (line.quantity <= left) {
          await tx.cartItem.delete({ where: { id: line.id } });
          left -= line.quantity;
        } else {
          await tx.cartItem.update({ where: { id: line.id }, data: { quantity: { decrement: left } } });
          left = 0;
        }
      }
    }

    const sameLine = (
      await tx.cartItem.findMany({
        where: { guestSessionId, storeId: store.id, productId: product.id, offerId: offer.id },
        select: { id: true, selectedFeatures: true },
      })
    ).find((l) => JSON.stringify(l.selectedFeatures ?? null) === JSON.stringify(selectedFeatures));

    if (sameLine && offer.type === "UPSELL") {
      await tx.cartItem.update({ where: { id: sameLine.id }, data: { quantity: { increment: qty } } });
    } else if (!sameLine) {
      await tx.cartItem.create({
        data: {
          guestSessionId,
          storeId: store.id,
          productId: product.id,
          quantity: qty,
          offerId: offer.id,
          ...(selectedFeatures ? { selectedFeatures } : {}),
        },
      });
    }

    await tx.productOffer.update({ where: { id: offer.id }, data: { accepts: { increment: 1 } } });
  });

  revalidatePath(`/store/${storeSlug}`);
  revalidatePath(`/store/${storeSlug}/cart`);

  const price = offerUnitPrice(product.price, offer);
  const added = {
    eventId: `atc_${crypto.randomUUID()}`,
    productId: product.id,
    name: product.name,
    price,
    quantity: qty,
    fromOffer: true,
  };
  await queueStoreServerEvent({
    storeId: store.id,
    eventName: "AddToCart",
    payload: {
      eventId: added.eventId,
      value: price * qty,
      currency: "EGP",
      contents: [{ id: product.id, quantity: qty, price, name: product.name }],
    },
  });

  return { success: true as const, message: offer.type === "UPSELL" ? "اتطوّر اختيارك" : "اتضاف للسلة", added };
}

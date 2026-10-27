"use server";

// Merchant side of upsell / cross-sell / downsell offers (dashboard: /offers).

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";
import { isOfferType, type OfferDiscountType, type OfferType } from "@/lib/offers/offer-pricing";

export type OfferMutationResult = { ok: true; id: string } | { ok: false; message: string };

export type OfferInput = {
  type: OfferType;
  name: string;
  headline?: string | null;
  offerProductId: string;
  /** Empty = any product (cross-sell / downsell only). */
  triggerProductIds: string[];
  discountType: OfferDiscountType;
  /** Percent, or pounds off each piece for FIXED. */
  discountValue: number;
  priority?: number;
  isActive?: boolean;
};

export type OfferProductOption = { id: string; name: string; image: string; price: number; isActive: boolean };

const MAX_TRIGGERS = 50;

async function ownedStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

function revalidateOffers(storeSlug: string) {
  revalidatePath("/dashboard/offers");
  revalidateStorefront(storeSlug);
}

async function validate(storeId: string, input: OfferInput) {
  if (!isOfferType(input.type)) return { error: "اختار نوع العرض." } as const;

  const name = String(input.name ?? "").trim().slice(0, 80);
  if (name.length < 2) return { error: "اكتب اسم للعرض (عشان تعرفه في اللوحة)." } as const;
  const headline = String(input.headline ?? "").trim().slice(0, 120) || null;

  const triggerProductIds = [...new Set((Array.isArray(input.triggerProductIds) ? input.triggerProductIds : []).filter((id) => typeof id === "string"))];
  if (triggerProductIds.length > MAX_TRIGGERS) return { error: `أقصى عدد ${MAX_TRIGGERS} منتج يظهر عليهم العرض.` } as const;
  if (input.type === "UPSELL" && triggerProductIds.length === 0) {
    return { error: "الـ Upsell بيبدّل منتج بمنتج — اختار المنتجات اللي هيظهر عليها." } as const;
  }
  if (triggerProductIds.includes(input.offerProductId)) return { error: "المنتج المعروض مينفعش يكون من المنتجات اللي بتشغّل العرض." } as const;

  const offerProduct = await prisma.product.findFirst({
    where: { id: String(input.offerProductId ?? ""), storeId },
    select: { id: true, price: true },
  });
  if (!offerProduct) return { error: "اختار المنتج اللي هيتعرض." } as const;

  if (triggerProductIds.length) {
    const found = await prisma.product.count({ where: { id: { in: triggerProductIds }, storeId } });
    if (found !== triggerProductIds.length) return { error: "في منتجات مختارة مش موجودة في متجرك." } as const;
  }

  const discountType: OfferDiscountType =
    input.discountType === "PERCENTAGE" || input.discountType === "FIXED" ? input.discountType : "NONE";
  const value = Number(input.discountValue);
  let discountValue = 0;
  if (discountType !== "NONE") {
    if (!Number.isFinite(value) || value <= 0) return { error: "اكتب قيمة الخصم، أو اختار من غير خصم." } as const;
    if (discountType === "PERCENTAGE" && value >= 100) return { error: "النسبة لازم تكون أقل من ١٠٠٪." } as const;
    if (discountType === "FIXED" && value >= offerProduct.price) return { error: "الخصم أكبر من سعر المنتج — كده هيبقى ببلاش." } as const;
    discountValue = Math.round(value * 100) / 100;
  }

  const priority = Math.max(0, Math.min(100, Math.floor(Number(input.priority) || 0)));

  return {
    data: {
      type: input.type,
      name,
      headline,
      offerProductId: offerProduct.id,
      triggerProductIds,
      discountType,
      discountValue,
      priority,
    },
  } as const;
}

export async function SaveOfferAction(offerId: string | null, input: OfferInput): Promise<OfferMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  const existing = offerId
    ? await prisma.productOffer.findFirst({ where: { id: offerId, storeId: store.id }, select: { id: true } })
    : null;
  if (offerId && !existing) return { ok: false, message: "العرض مش موجود." };

  const parsed = await validate(store.id, input);
  if ("error" in parsed) return { ok: false, message: parsed.error! };

  try {
    const saved = existing
      ? await prisma.productOffer.update({
          where: { id: existing.id },
          data: { ...parsed.data, ...(typeof input.isActive === "boolean" && { isActive: input.isActive }) },
          select: { id: true },
        })
      : await prisma.productOffer.create({
          data: { ...parsed.data, storeId: store.id, isActive: input.isActive ?? true },
          select: { id: true },
        });
    revalidateOffers(store.slug);
    return { ok: true, id: saved.id };
  } catch (error) {
    console.error("SaveOfferAction error:", error);
    return { ok: false, message: "مقدرناش نحفظ العرض. جرّب تاني." };
  }
}

export async function SetOfferActiveAction(offerId: string, isActive: boolean): Promise<OfferMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  const updated = await prisma.productOffer.updateMany({ where: { id: offerId, storeId: store.id }, data: { isActive: Boolean(isActive) } });
  if (updated.count !== 1) return { ok: false, message: "العرض مش موجود." };
  revalidateOffers(store.slug);
  return { ok: true, id: offerId };
}

/** Orders keep their lines and prices; only the link to the offer (its stats) goes. */
export async function DeleteOfferAction(offerId: string): Promise<OfferMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  const deleted = await prisma.productOffer.deleteMany({ where: { id: offerId, storeId: store.id } });
  if (deleted.count !== 1) return { ok: false, message: "العرض مش موجود." };
  revalidateOffers(store.slug);
  return { ok: true, id: offerId };
}

export async function SearchOfferProductsAction(query: string): Promise<OfferProductOption[]> {
  const store = await ownedStore();
  if (!store) return [];
  const q = String(query ?? "").trim().slice(0, 80);
  return prisma.product.findMany({
    where: {
      storeId: store.id,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: { id: true, name: true, image: true, price: true, isActive: true },
  });
}

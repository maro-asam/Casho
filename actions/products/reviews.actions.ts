"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

export type ReviewMutationResult =
  | { ok: true; id: string }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "LIMIT" | "FAILED"; message: string };

export type ReviewInput = {
  productId: string;
  customerName: string;
  customerAvatar?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  /** YYYY-MM-DD */
  reviewDate?: string | null;
  /**
   * The order this review came from. The only way to get the "verified
   * purchase" badge — it must be a real order of this store containing this product.
   */
  orderId?: string | null;
  /** Edit only: drop an existing verified badge. */
  removeVerified?: boolean;
};

export type ReviewOrderOption = { id: string; fullName: string; createdAt: string };

const MAX_PER_PRODUCT = 50;

async function ownedStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

function revalidateReviews(storeSlug: string, productSlug?: string) {
  revalidatePath("/dashboard/reviews");
  if (productSlug) revalidatePath(`/store/${storeSlug}/products/${productSlug}`);
}

function validate(input: ReviewInput) {
  const customerName = String(input.customerName ?? "").trim();
  const content = String(input.content ?? "").trim();
  const title = String(input.title ?? "").trim() || null;
  const customerAvatar = String(input.customerAvatar ?? "").trim() || null;
  const rating = Math.round(Number(input.rating));

  if (customerName.length < 2) return { error: "اكتب اسم العميل (حرفين على الأقل)." } as const;
  if (customerName.length > 60) return { error: "اسم العميل طويل." } as const;
  if (!(rating >= 1 && rating <= 5)) return { error: "اختار التقييم من ١ لـ ٥ نجوم." } as const;
  if (content.length < 10) return { error: "نص المراجعة قصير (١٠ حروف على الأقل)." } as const;
  if (content.length > 2000) return { error: "نص المراجعة طويل (٢٠٠٠ حرف بالكتير)." } as const;
  if (title && title.length > 100) return { error: "العنوان طويل." } as const;
  if (customerAvatar && !/^https?:\/\/\S+$/i.test(customerAvatar)) return { error: "رابط صورة العميل مش صحيح." } as const;

  let reviewDate = new Date();
  if (input.reviewDate) {
    reviewDate = new Date(`${input.reviewDate}T12:00:00+02:00`);
    if (Number.isNaN(reviewDate.getTime())) return { error: "التاريخ مش صحيح." } as const;
    if (reviewDate.getTime() > Date.now() + 86400_000) return { error: "تاريخ المراجعة مينفعش يكون في المستقبل." } as const;
  }

  return { data: { customerName, content, title, customerAvatar, rating, reviewDate } } as const;
}

/** A real, non-canceled order of this store that contains the product. */
async function findVerifyingOrder(storeId: string, productId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, storeId, status: { not: "CANCELED" }, items: { some: { productId } } },
    select: { id: true, createdAt: true },
  });
}

export async function SaveReviewAction(reviewId: string | null, input: ReviewInput): Promise<ReviewMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };

  const existing = reviewId
    ? await prisma.productReview.findFirst({
        where: { id: reviewId, storeId: store.id },
        select: { id: true, productId: true, verifiedPurchase: true },
      })
    : null;
  if (reviewId && !existing) return { ok: false, code: "NOT_FOUND", message: "المراجعة مش موجودة." };

  const productId = existing?.productId ?? String(input.productId ?? "");
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: store.id }, select: { id: true, slug: true } });
  if (!product) return { ok: false, code: "INVALID", message: "اختار منتج من منتجاتك." };

  const parsed = validate(input);
  if ("error" in parsed) return { ok: false, code: "INVALID", message: parsed.error! };
  const data = { ...parsed.data };

  let verifiedPurchase = existing?.verifiedPurchase ?? false;
  if (input.removeVerified) verifiedPurchase = false;
  if (input.orderId) {
    const order = await findVerifyingOrder(store.id, product.id, input.orderId);
    if (!order) return { ok: false, code: "INVALID", message: "الطلب ده مش فيه المنتج ده أو اتلغى." };
    if (data.reviewDate < order.createdAt) data.reviewDate = order.createdAt; // can't review before buying
    verifiedPurchase = true;
  }

  if (!existing) {
    const count = await prisma.productReview.count({ where: { productId: product.id, storeId: store.id } });
    if (count >= MAX_PER_PRODUCT) {
      return { ok: false, code: "LIMIT", message: `وصلت للحد الأقصى (${MAX_PER_PRODUCT} مراجعة) للمنتج ده.` };
    }
  }

  try {
    const saved = existing
      ? await prisma.productReview.update({ where: { id: existing.id }, data: { ...data, verifiedPurchase }, select: { id: true } })
      : await prisma.productReview.create({
          data: { ...data, verifiedPurchase, productId: product.id, storeId: store.id },
          select: { id: true },
        });
    revalidateReviews(store.slug, product.slug);
    return { ok: true, id: saved.id };
  } catch (error) {
    console.error("SaveReviewAction error:", error);
    return { ok: false, code: "FAILED", message: "مقدرناش نحفظ المراجعة. جرّب تاني." };
  }
}

export async function DeleteReviewAction(reviewId: string): Promise<ReviewMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };

  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, storeId: store.id },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!review) return { ok: false, code: "NOT_FOUND", message: "المراجعة مش موجودة." };

  await prisma.productReview.delete({ where: { id: review.id } });
  revalidateReviews(store.slug, review.product.slug);
  return { ok: true, id: review.id };
}

/** Recent real orders containing the product — to link a review to its purchase. */
export async function GetReviewOrderOptionsAction(productId: string): Promise<ReviewOrderOption[]> {
  const store = await ownedStore();
  if (!store || typeof productId !== "string") return [];
  const orders = await prisma.order.findMany({
    where: { storeId: store.id, status: { not: "CANCELED" }, items: { some: { productId } } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, fullName: true, createdAt: true },
  });
  return orders.map((o) => ({ id: o.id, fullName: o.fullName, createdAt: o.createdAt.toISOString() }));
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

export type ReviewFormState = {
  success: boolean;
  message: string;
  warnings?: string[];
  errors?: Partial<Record<string, string[]>>;
};

async function getAntiAbuseWarnings(
  storeId: string,
  productId: string,
  rating: number,
  content: string,
  customerName: string,
  reviewDate: Date,
  excludeReviewId?: string,
): Promise<string[]> {
  const warnings: string[] = [];

  const existing = await prisma.productReview.findMany({
    where: {
      productId,
      storeId,
      ...(excludeReviewId ? { NOT: { id: excludeReviewId } } : {}),
    },
    select: {
      rating: true,
      content: true,
      customerName: true,
      reviewDate: true,
    },
  });

  const allRatings = [...existing.map((r) => r.rating), rating];
  const fiveStarCount = allRatings.filter((r) => r === 5).length;
  const pctFiveStars = (fiveStarCount / allRatings.length) * 100;

  if (allRatings.length >= 2 && allRatings.every((r) => r === 5)) {
    warnings.push("جميع المراجعات بتقييم 5 نجوم — سيبدو مريباً للعملاء");
  } else if (allRatings.length >= 3 && pctFiveStars > 80) {
    warnings.push(
      `${Math.round(pctFiveStars)}% من المراجعات بتقييم 5 نجوم — يُنصح بتنويع التقييمات`,
    );
  }

  const sameNameCount = existing.filter(
    (r) =>
      r.customerName.trim().toLowerCase() ===
      customerName.trim().toLowerCase(),
  ).length;
  if (sameNameCount >= 2) {
    warnings.push(
      `الاسم "${customerName}" مكرر أكثر من مرتين — قد يبدو غير طبيعي`,
    );
  }

  const normalizedContent = content.trim().toLowerCase();
  const hasDuplicateContent = existing.some(
    (r) => r.content.trim().toLowerCase() === normalizedContent,
  );
  if (hasDuplicateContent) {
    warnings.push("محتوى هذه المراجعة مطابق لمراجعة موجودة مسبقاً");
  }

  if (existing.length >= 3) {
    const allDates = [...existing.map((r) => r.reviewDate), reviewDate];
    const min = Math.min(...allDates.map((d) => d.getTime()));
    const max = Math.max(...allDates.map((d) => d.getTime()));
    const spanDays = (max - min) / (1000 * 60 * 60 * 24);
    if (spanDays < 7) {
      warnings.push(
        "تواريخ المراجعات متقاربة جداً — يُنصح بتوزيعها على فترة زمنية أطول",
      );
    }
  }

  return warnings;
}

function parseReviewFormData(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerAvatar =
    String(formData.get("customerAvatar") ?? "").trim() || null;
  const rating = Number(formData.get("rating") ?? "0");
  const title = String(formData.get("title") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const verifiedPurchase = formData.get("verifiedPurchase") === "true";
  const reviewDateRaw = String(formData.get("reviewDate") ?? "").trim();
  return { customerName, customerAvatar, rating, title, content, verifiedPurchase, reviewDateRaw };
}

function validateReviewFields(fields: ReturnType<typeof parseReviewFormData>): string | null {
  const { customerName, rating, content, reviewDateRaw } = fields;
  if (!customerName || customerName.length < 2)
    return "اسم العميل قصير جداً (2 أحرف على الأقل)";
  if (customerName.length > 60) return "اسم العميل طويل جداً";
  if (!rating || rating < 1 || rating > 5)
    return "التقييم يجب أن يكون من 1 إلى 5 نجوم";
  if (!content || content.length < 20)
    return "المراجعة قصيرة جداً (20 حرف على الأقل)";
  if (content.length > 2000) return "المراجعة طويلة جداً (الحد الأقصى 2000 حرف)";
  if (reviewDateRaw && isNaN(new Date(reviewDateRaw).getTime()))
    return "تاريخ المراجعة غير صحيح";
  return null;
}

export async function CreateReviewAction(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const userId = await requireUserId();

  try {
    const productId = String(formData.get("productId") ?? "").trim();
    if (!productId) return { success: false, message: "المنتج مطلوب" };

    const fields = parseReviewFormData(formData);
    const validationError = validateReviewFields(fields);
    if (validationError) return { success: false, message: validationError };

    const { customerName, customerAvatar, rating, title, content, verifiedPurchase, reviewDateRaw } = fields;
    const reviewDate = reviewDateRaw ? new Date(reviewDateRaw) : new Date();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!store) return { success: false, message: "المتجر غير موجود" };

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true },
    });
    if (!product) return { success: false, message: "المنتج غير موجود أو لا ينتمي لمتجرك" };

    const reviewCount = await prisma.productReview.count({
      where: { productId, storeId: store.id },
    });
    if (reviewCount >= 50) {
      return {
        success: false,
        message: "وصلت للحد الأقصى من المراجعات لهذا المنتج (50 مراجعة)",
      };
    }

    const warnings = await getAntiAbuseWarnings(
      store.id,
      productId,
      rating,
      content,
      customerName,
      reviewDate,
    );

    await prisma.productReview.create({
      data: {
        productId,
        storeId: store.id,
        customerName,
        customerAvatar,
        rating,
        title,
        content,
        verifiedPurchase,
        reviewDate,
      },
    });

    revalidatePath("/dashboard/reviews");

    return {
      success: true,
      message: "تم إضافة المراجعة بنجاح",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error("CreateReviewAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء إضافة المراجعة" };
  }
}

export async function UpdateReviewAction(
  reviewId: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const userId = await requireUserId();

  try {
    const fields = parseReviewFormData(formData);
    const validationError = validateReviewFields(fields);
    if (validationError) return { success: false, message: validationError };

    const { customerName, customerAvatar, rating, title, content, verifiedPurchase, reviewDateRaw } = fields;
    const reviewDate = reviewDateRaw ? new Date(reviewDateRaw) : new Date();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!store) return { success: false, message: "المتجر غير موجود" };

    const review = await prisma.productReview.findFirst({
      where: { id: reviewId, storeId: store.id },
      select: { id: true, productId: true },
    });
    if (!review) return { success: false, message: "المراجعة غير موجودة" };

    const warnings = await getAntiAbuseWarnings(
      store.id,
      review.productId,
      rating,
      content,
      customerName,
      reviewDate,
      reviewId,
    );

    await prisma.productReview.update({
      where: { id: reviewId },
      data: { customerName, customerAvatar, rating, title, content, verifiedPurchase, reviewDate },
    });

    revalidatePath("/dashboard/reviews");

    return {
      success: true,
      message: "تم تعديل المراجعة بنجاح",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error("UpdateReviewAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تعديل المراجعة" };
  }
}

export async function DeleteReviewAction(reviewId: string): Promise<void> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("Store not found");

  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, storeId: store.id },
    select: { id: true },
  });
  if (!review) throw new Error("Review not found");

  await prisma.productReview.delete({ where: { id: review.id } });

  revalidatePath("/dashboard/reviews");
}

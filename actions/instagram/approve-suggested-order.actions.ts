"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { logger } from "@/lib/logger";

type ApproveInput = {
  suggestedOrderId: string;
  // Merchant-confirmed fields (may differ from AI extraction)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    suggestedItemId: string;
    matchedProductId: string;
    quantity: number;
    unitPrice: number; // piasters
  }>;
};

export async function ApproveSuggestedOrderAction(input: ApproveInput) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return { success: false, error: "المتجر غير موجود" };
  }

  // Verify the suggestion belongs to this store
  const suggestion = await prisma.suggestedOrder.findFirst({
    where: { id: input.suggestedOrderId, storeId: store.id },
    select: {
      id: true,
      status: true,
      // For merchantEdited detection: compare AI values vs submitted values
      customerName:    true,
      customerPhone:   true,
      customerAddress: true,
    },
  });

  if (!suggestion) {
    return { success: false, error: "الطلب المقترح غير موجود" };
  }

  if (suggestion.status !== "PENDING") {
    return { success: false, error: "تم مراجعة هذا الطلب مسبقاً" };
  }

  if (input.items.length === 0) {
    return { success: false, error: "يجب إضافة منتج واحد على الأقل" };
  }

  // Idempotency guard: if a real order already exists for this suggestion, don't create another
  const guestSessionId = `ig-${input.suggestedOrderId}`;
  const existingOrder = await prisma.order.findFirst({
    where: { guestSessionId, storeId: store.id },
    select: { id: true },
  });

  if (existingOrder) {
    logger.warn("[ApproveSuggestedOrder] Duplicate approval detected — returning existing order", {
      suggestedOrderId: input.suggestedOrderId,
      existingOrderId: existingOrder.id,
    });
    revalidatePath("/dashboard/suggested-orders");
    revalidatePath("/dashboard/orders");
    return { success: true, orderId: existingOrder.id };
  }

  // Validate all items reference products in this store
  for (const item of input.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.matchedProductId, storeId: store.id },
      select: { id: true },
    });
    if (!product) {
      return { success: false, error: "أحد المنتجات غير موجود في متجرك" };
    }
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // Detect whether the merchant changed any AI-extracted fields
  const merchantEdited =
    input.customerName    !== (suggestion.customerName    ?? "") ||
    input.customerPhone   !== (suggestion.customerPhone   ?? "") ||
    input.customerAddress !== (suggestion.customerAddress ?? "");

  // Capture merchant feedback for future AI improvement
  const merchantFeedback = merchantEdited
    ? {
        editedFields: {
          customerName:    input.customerName    !== (suggestion.customerName    ?? ""),
          customerPhone:   input.customerPhone   !== (suggestion.customerPhone   ?? ""),
          customerAddress: input.customerAddress !== (suggestion.customerAddress ?? ""),
        },
        submittedAt: new Date().toISOString(),
      }
    : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the real Order
      const order = await tx.order.create({
        data: {
          storeId:       store.id,
          guestSessionId,
          status:        "PENDING",
          paymentMethod: "instagram",
          fullName:      input.customerName,
          phone:         input.customerPhone,
          address:       input.customerAddress,
          subtotal,
          shipping:      0,
          discount:      0,
          total:         subtotal,
          items: {
            create: input.items.map((item) => ({
              productId: item.matchedProductId,
              quantity:  item.quantity,
              price:     item.unitPrice,
            })),
          },
        },
        select: { id: true },
      });

      // Update SuggestedOrder → APPROVED, capture merchant feedback
      await tx.suggestedOrder.update({
        where: { id: input.suggestedOrderId },
        data: {
          status:           "APPROVED",
          orderId:          order.id,
          reviewedAt:       new Date(),
          reviewedByUserId: userId,
          merchantEdited,
          merchantFeedback: merchantFeedback ?? undefined,
        },
      });

      // Update item-level confirmed values
      for (const item of input.items) {
        await tx.suggestedOrderItem.update({
          where: { id: item.suggestedItemId },
          data: {
            matchedProductId: item.matchedProductId,
            unitPrice:        item.unitPrice,
            aiQuantity:       item.quantity,
          },
        });
      }

      return order;
    });

    logger.info("[ApproveSuggestedOrder] Approved", {
      suggestedOrderId: input.suggestedOrderId,
      orderId: result.id,
      merchantEdited,
    });

    await createNotification({
      storeId: store.id,
      type:    "NEW_ORDER",
      title:   "تم إنشاء طلب جديد ✅",
      message: "تم تحويل الطلب المقترح من انستجرام إلى طلب حقيقي",
      href:    `/dashboard/orders/${result.id}`,
    });

    revalidatePath("/dashboard/suggested-orders");
    revalidatePath("/dashboard/orders");

    return { success: true, orderId: result.id };
  } catch (err) {
    logger.error("[ApproveSuggestedOrder] Failed", {
      suggestedOrderId: input.suggestedOrderId,
      err: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "حدث خطأ أثناء إنشاء الطلب" };
  }
}

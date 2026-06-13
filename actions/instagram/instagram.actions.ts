"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { buildAuthorizationUrl } from "@/lib/instagram/oauth";
import { syncConversations } from "@/lib/instagram/sync";
import { logger } from "@/lib/logger";
import { SuggestedOrderStatus } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────

export type SuggestedOrderListItem = {
  id: string;
  confidence: number;
  status: SuggestedOrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  aiNotes: string | null;
  createdAt: Date;
  expiresAt: Date;
  itemCount: number;
  firstProductName: string | null;
  conversationId: string;
};

export type SuggestedOrderDetail = {
  id: string;
  confidence: number;
  status: SuggestedOrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  aiNotes: string | null;
  orderId: string | null;
  createdAt: Date;
  expiresAt: Date;
  items: Array<{
    id: string;
    aiProductName: string;
    aiVariant: string | null;
    aiQuantity: number;
    unitPrice: number | null;
    matchedProductId: string | null;
    matchedProduct: { id: string; name: string; price: number; image: string } | null;
  }>;
  conversation: {
    id: string;
    customerIgName: string | null;
    customerIgUsername: string | null;
    messages: Array<{
      id: string;
      isFromBusiness: boolean;
      content: string | null;
      messageType: string;
      sentAt: Date;
    }>;
  };
};

// ─── OAuth ─────────────────────────────────────────────────────────────────

export async function ConnectInstagramAction() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return redirect("/dashboard");
  }

  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const authUrl = buildAuthorizationUrl(state);
  redirect(authUrl);
}

export async function DisconnectInstagramAction() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { success: false, error: "المتجر غير موجود" };

  const connection = await prisma.instagramConnection.findUnique({
    where: { storeId: store.id },
    select: { id: true },
  });

  if (!connection) return { success: false, error: "لا يوجد حساب انستجرام متصل" };

  await prisma.instagramConnection.delete({ where: { id: connection.id } });

  revalidatePath("/dashboard/instagram");
  return { success: true };
}

// ─── Sync ───────────────────────────────────────────────────────────────────

export async function SyncInstagramConversationsAction() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { success: false, error: "المتجر غير موجود" };

  const connection = await prisma.instagramConnection.findUnique({
    where: { storeId: store.id },
    select: { id: true, status: true },
  });

  if (!connection) return { success: false, error: "لا يوجد حساب انستجرام متصل" };

  if (connection.status === "EXPIRED") {
    return { success: false, error: "انتهت صلاحية الربط — يرجى إعادة الاتصال" };
  }

  const { synced, errors } = await syncConversations(connection.id);

  revalidatePath("/dashboard/instagram");
  revalidatePath("/dashboard/suggested-orders");

  return { success: true, synced, errors: errors.length > 0 ? errors : undefined };
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export async function GetInstagramStatsAction() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return null;

  const [connection, totalConversations, pendingCount, approvedCount] =
    await Promise.all([
      prisma.instagramConnection.findUnique({
        where: { storeId: store.id },
        select: {
          id: true,
          igUsername: true,
          igPageName: true,
          status: true,
          webhookVerified: true,
          lastSyncAt: true,
          tokenExpiresAt: true,
        },
      }),
      prisma.instagramConversation.count({ where: { storeId: store.id } }),
      prisma.suggestedOrder.count({ where: { storeId: store.id, status: "PENDING" } }),
      prisma.suggestedOrder.count({ where: { storeId: store.id, status: "APPROVED" } }),
    ]);

  return { connection, totalConversations, pendingCount, approvedCount };
}

// ─── Suggested Orders ────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export async function GetSuggestedOrdersAction(params?: {
  status?: SuggestedOrderStatus;
  page?: number;
}) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { orders: [], total: 0, totalPages: 0 };

  const page = Math.max(1, params?.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;
  const where = {
    storeId: store.id,
    ...(params?.status ? { status: params.status } : {}),
  };

  const [total, raw] = await Promise.all([
    prisma.suggestedOrder.count({ where }),
    prisma.suggestedOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        confidence: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        aiNotes: true,
        createdAt: true,
        expiresAt: true,
        conversationId: true,
        items: { take: 1, select: { aiProductName: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const orders: SuggestedOrderListItem[] = raw.map((o) => ({
    id: o.id,
    confidence: o.confidence,
    status: o.status,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    aiNotes: o.aiNotes,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
    itemCount: o._count.items,
    firstProductName: o.items[0]?.aiProductName ?? null,
    conversationId: o.conversationId,
  }));

  return { orders, total, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function GetSuggestedOrderDetailAction(
  suggestedOrderId: string,
): Promise<SuggestedOrderDetail | null> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return null;

  const order = await prisma.suggestedOrder.findFirst({
    where: { id: suggestedOrderId, storeId: store.id },
    select: {
      id: true,
      confidence: true,
      status: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      aiNotes: true,
      orderId: true,
      createdAt: true,
      expiresAt: true,
      items: {
        select: {
          id: true,
          aiProductName: true,
          aiVariant: true,
          aiQuantity: true,
          unitPrice: true,
          matchedProductId: true,
          matchedProduct: {
            select: { id: true, name: true, price: true, image: true },
          },
        },
      },
      conversation: {
        select: {
          id: true,
          customerIgName: true,
          customerIgUsername: true,
          messages: {
            orderBy: { sentAt: "asc" },
            select: {
              id: true,
              isFromBusiness: true,
              content: true,
              messageType: true,
              sentAt: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;
  return order as SuggestedOrderDetail;
}

// ─── Approve / Reject ────────────────────────────────────────────────────────

type ApproveInput = {
  suggestedOrderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    suggestedItemId: string;
    matchedProductId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export async function ApproveSuggestedOrderAction(input: ApproveInput) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { success: false, error: "المتجر غير موجود" };

  const suggestion = await prisma.suggestedOrder.findFirst({
    where: { id: input.suggestedOrderId, storeId: store.id },
    select: {
      id: true,
      status: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
    },
  });

  if (!suggestion) return { success: false, error: "الطلب المقترح غير موجود" };
  if (suggestion.status !== "PENDING") return { success: false, error: "تم مراجعة هذا الطلب مسبقاً" };
  if (input.items.length === 0) return { success: false, error: "يجب إضافة منتج واحد على الأقل" };

  const guestSessionId = `ig-${input.suggestedOrderId}`;
  const existingOrder = await prisma.order.findFirst({
    where: { guestSessionId, storeId: store.id },
    select: { id: true },
  });

  if (existingOrder) {
    logger.warn("[ApproveSuggestedOrder] Duplicate approval detected", {
      suggestedOrderId: input.suggestedOrderId,
      existingOrderId: existingOrder.id,
    });
    revalidatePath("/dashboard/suggested-orders");
    revalidatePath("/dashboard/orders");
    return { success: true, orderId: existingOrder.id };
  }

  for (const item of input.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.matchedProductId, storeId: store.id },
      select: { id: true },
    });
    if (!product) return { success: false, error: "أحد المنتجات غير موجود في متجرك" };
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const merchantEdited =
    input.customerName !== (suggestion.customerName ?? "") ||
    input.customerPhone !== (suggestion.customerPhone ?? "") ||
    input.customerAddress !== (suggestion.customerAddress ?? "");

  const merchantFeedback = merchantEdited
    ? {
        editedFields: {
          customerName: input.customerName !== (suggestion.customerName ?? ""),
          customerPhone: input.customerPhone !== (suggestion.customerPhone ?? ""),
          customerAddress: input.customerAddress !== (suggestion.customerAddress ?? ""),
        },
        submittedAt: new Date().toISOString(),
      }
    : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          guestSessionId,
          status: "PENDING",
          paymentMethod: "instagram",
          fullName: input.customerName,
          phone: input.customerPhone,
          address: input.customerAddress,
          subtotal,
          shipping: 0,
          discount: 0,
          total: subtotal,
          items: {
            create: input.items.map((item) => ({
              productId: item.matchedProductId,
              quantity: item.quantity,
              price: item.unitPrice,
            })),
          },
        },
        select: { id: true },
      });

      await tx.suggestedOrder.update({
        where: { id: input.suggestedOrderId },
        data: {
          status: "APPROVED",
          orderId: order.id,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
          merchantEdited,
          merchantFeedback: merchantFeedback ?? undefined,
        },
      });

      for (const item of input.items) {
        await tx.suggestedOrderItem.update({
          where: { id: item.suggestedItemId },
          data: {
            matchedProductId: item.matchedProductId,
            unitPrice: item.unitPrice,
            aiQuantity: item.quantity,
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
      type: "NEW_ORDER",
      title: "تم إنشاء طلب جديد ✅",
      message: "تم تحويل الطلب المقترح من انستجرام إلى طلب حقيقي",
      href: `/dashboard/orders/${result.id}`,
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

export async function RejectSuggestedOrderAction(
  suggestedOrderId: string,
  reason?: string,
) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) return { success: false, error: "المتجر غير موجود" };

  const suggestion = await prisma.suggestedOrder.findFirst({
    where: { id: suggestedOrderId, storeId: store.id },
    select: { id: true, status: true, conversationId: true },
  });

  if (!suggestion) return { success: false, error: "الطلب المقترح غير موجود" };
  if (suggestion.status !== "PENDING") return { success: false, error: "تم مراجعة هذا الطلب مسبقاً" };

  const merchantFeedback = {
    action: "rejected",
    reason: reason ?? null,
    submittedAt: new Date().toISOString(),
  };

  await prisma.$transaction([
    prisma.suggestedOrder.update({
      where: { id: suggestedOrderId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedByUserId: userId,
        rejectionReason: reason ?? null,
        merchantEdited: false,
        merchantFeedback,
      },
    }),
    prisma.instagramConversation.update({
      where: { id: suggestion.conversationId },
      data: { status: "IGNORED" },
    }),
  ]);

  logger.info("[RejectSuggestedOrder] Rejected", { suggestedOrderId, hasReason: !!reason });

  revalidatePath("/dashboard/suggested-orders");
  revalidatePath("/dashboard/integrations/instagram");

  return { success: true };
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { SuggestedOrderStatus } from "@prisma/client";

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
  // rawAiResponse is intentionally omitted — internal/admin only (contains AI reasoning)
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

  const page   = Math.max(1, params?.page ?? 1);
  const skip   = (page - 1) * PAGE_SIZE;
  const statusFilter = params?.status;

  const where = {
    storeId: store.id,
    ...(statusFilter ? { status: statusFilter } : {}),
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
        items: {
          take: 1,
          select: { aiProductName: true },
        },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const orders: SuggestedOrderListItem[] = raw.map((o) => ({
    id:               o.id,
    confidence:       o.confidence,
    status:           o.status,
    customerName:     o.customerName,
    customerPhone:    o.customerPhone,
    customerAddress:  o.customerAddress,
    aiNotes:          o.aiNotes,
    createdAt:        o.createdAt,
    expiresAt:        o.expiresAt,
    itemCount:        o._count.items,
    firstProductName: o.items[0]?.aiProductName ?? null,
    conversationId:   o.conversationId,
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
      // rawAiResponse deliberately excluded — kept internal (admin only)
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

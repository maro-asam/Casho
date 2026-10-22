// Order confirmation over WhatsApp: the customer gets a link (sent by the
// merchant from their own WhatsApp, or automatically through Twilio) and
// confirms or cancels the order there. The link is signed with an HMAC of the
// order id, so nothing is stored and it can't be guessed for other orders.
//
// Env: INTERNAL_API_SECRET (or CRON_SECRET) signs the links.

import { createHmac, timingSafeEqual } from "crypto";
import { NotificationType, OrderConfirmationStatus, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { adjustStockForOrderStatus } from "@/lib/inventory/order-stock";
import { createNotification } from "@/lib/notifications/in-app";
import { announceNewOrder } from "@/lib/store/order-announce";
import { storeBaseUrl } from "@/lib/seo/store-seo";

function secret() {
  return process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || null;
}

function sign(orderId: string, key: string) {
  return createHmac("sha256", key).update(`order-confirm:${orderId}`).digest("base64url").slice(0, 24);
}

export function verifyOrderConfirmToken(orderId: string, token: string | undefined | null) {
  const key = secret();
  if (!key || !token) return false;
  const expected = Buffer.from(sign(orderId, key));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Null when no signing secret is configured — callers hide the feature. */
export function orderConfirmUrl(
  store: { slug: string; customDomain?: string | null; customDomainStatus?: string | null },
  orderId: string,
) {
  const key = secret();
  if (!key) return null;
  return `${storeBaseUrl(store)}/order/${orderId}/approve?t=${sign(orderId, key)}`;
}

/** Still worth asking: not shipped, not paid, not canceled, not yet confirmed. */
export function canAskToConfirm(order: { status: OrderStatus; confirmationStatus: OrderConfirmationStatus; source?: string }) {
  return (
    order.status === OrderStatus.PENDING &&
    order.confirmationStatus !== OrderConfirmationStatus.CONFIRMED &&
    order.source !== "POS"
  );
}

export type CustomerAnswer = "confirm" | "cancel";

/** Applies the customer's answer. Returns false when the order can no longer change. */
export async function applyCustomerAnswer(orderId: string, answer: CustomerAnswer) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, storeId: true, fullName: true, total: true, status: true, confirmationStatus: true, store: { select: { userId: true } } },
  });
  if (!order || order.status !== OrderStatus.PENDING) return false;

  if (answer === "confirm") {
    // Conditional, so a double tap confirms (and notifies) once.
    const res = await prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING, confirmationStatus: { not: OrderConfirmationStatus.CONFIRMED } },
      data: { confirmationStatus: OrderConfirmationStatus.CONFIRMED, confirmedAt: new Date() },
    });
    if (res.count !== 1) return true;
    if (order.confirmationStatus === OrderConfirmationStatus.PENDING) {
      // It was held back waiting for the phone code — the link counts the same.
      await announceNewOrder(orderId);
    } else {
      await createNotification({
        storeId: order.storeId,
        userId: order.store.userId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: "العميل أكّد الطلب",
        message: `${order.fullName} أكّد طلبه من واتساب — جهّزه للشحن.`,
        href: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, confirmedBy: "whatsapp" },
      });
    }
    return true;
  }

  const canceled = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING, paidAt: null },
      data: { status: OrderStatus.CANCELED, riskSignals: { push: "العميل لغى الطلب من رابط التأكيد على واتساب" } },
    });
    if (res.count !== 1) return false;
    await adjustStockForOrderStatus(tx, { storeId: order.storeId, orderId, direction: "restock" });
    return true;
  });
  if (!canceled) return false;

  await createNotification({
    storeId: order.storeId,
    userId: order.store.userId,
    type: NotificationType.ORDER_STATUS_CHANGED,
    title: "العميل لغى الطلب",
    message: `${order.fullName} لغى طلبه من رابط التأكيد على واتساب، والمخزون رجع.`,
    href: `/dashboard/orders/${order.id}`,
    data: { orderId: order.id, previousStatus: order.status, status: OrderStatus.CANCELED, total: order.total },
  });
  return true;
}

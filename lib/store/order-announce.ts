// Tells the merchant (and their ad pixels) about a new online order. Called
// right after checkout — or, when the customer has to confirm their phone
// first, only once they do, so fake orders never ping the merchant.

import { NotificationType, OrderRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { sendWhatsAppOrderNotification } from "@/lib/notifications/whatsapp";
import { escapeTelegramMarkdown, sendTelegramMarkdown } from "@/lib/notifications/telegram";
import { queueStoreServerEvent } from "@/lib/pixels/server";
import { purchaseEventId } from "@/lib/pixels/shared";

const RISK_LABEL: Partial<Record<OrderRiskLevel, string>> = {
  HIGH: "⚠️ رقم عالي الخطورة",
  MEDIUM: "⚠️ رقم محتاج انتباه",
};

export async function announceNewOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      storeId: true,
      fullName: true,
      phone: true,
      address: true,
      total: true,
      paymentMethod: true,
      riskLevel: true,
      riskSignals: true,
      items: { select: { productId: true, quantity: true, price: true, product: { select: { name: true } } } },
      store: {
        select: { userId: true, name: true, settings: { select: { whatsappNumber: true, telegramChatId: true } } },
      },
    },
  });
  if (!order) return;

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const risk = order.riskLevel ? RISK_LABEL[order.riskLevel] : undefined;
  const riskLine = risk ? `${risk}: ${order.riskSignals[0] ?? ""}` : null;

  // Ad pixels: a cash/manual order is a purchase now; a card order only once
  // Kashier confirms the payment (see the Kashier callback).
  if (order.paymentMethod !== "kashier") {
    await queueStoreServerEvent({
      storeId: order.storeId,
      eventName: "Purchase",
      payload: {
        eventId: purchaseEventId(order.id),
        value: order.total / 100,
        currency: "EGP",
        orderId: order.id,
        contents: order.items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
          price: item.price / 100,
          name: item.product.name,
        })),
      },
      customer: { phone: order.phone, fullName: order.fullName },
    });
  }

  await createNotification({
    storeId: order.storeId,
    userId: order.store.userId,
    type: NotificationType.NEW_ORDER,
    title: risk ? `طلب جديد — ${risk.replace("⚠️ ", "")}` : "طلب جديد وصل",
    message: `وصلك طلب جديد من ${order.fullName} بقيمة ${formatPiastersAsEgp(order.total)}.${risk && order.riskSignals[0] ? ` ${order.riskSignals[0]}` : ""}`,
    href: `/dashboard/orders/${order.id}`,
    data: {
      orderId: order.id,
      storeId: order.storeId,
      customerName: order.fullName,
      customerPhone: order.phone,
      paymentMethod: order.paymentMethod,
      total: order.total,
      riskLevel: order.riskLevel,
    },
  });

  const whatsappNumber = order.store.settings?.whatsappNumber;
  if (whatsappNumber) {
    sendWhatsAppOrderNotification(whatsappNumber, {
      id: order.id,
      customerName: order.fullName,
      customerPhone: order.phone,
      address: order.address,
      total: order.total,
      paymentMethod: order.paymentMethod,
      itemCount,
      storeName: order.store.name,
    });
  }

  const telegramChatId = order.store.settings?.telegramChatId;
  if (telegramChatId) {
    const paymentLabel = order.paymentMethod === "cash_on_delivery" ? "كاش عند الاستلام" : order.paymentMethod;
    const msg =
      `🛒 *طلب جديد!*\n\n` +
      (riskLine ? `${escapeTelegramMarkdown(riskLine)}\n\n` : "") +
      `👤 ${escapeTelegramMarkdown(order.fullName)}\n` +
      `📞 ${escapeTelegramMarkdown(order.phone)}\n` +
      `🏠 ${escapeTelegramMarkdown(order.address)}\n` +
      `💰 ${formatPiastersAsEgp(order.total)}\n` +
      `💳 ${escapeTelegramMarkdown(paymentLabel)}\n` +
      `📦 ${itemCount} قطعة\n\n` +
      `🔗 #${order.id.slice(-6).toUpperCase()}`;
    sendTelegramMarkdown(telegramChatId, msg);
  }
}

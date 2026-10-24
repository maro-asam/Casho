/**
 * What happens once a payment gateway tells us how a payment ended — shared by
 * every provider's callback (Paymob, and the retired Kashier one). Every write
 * is conditional, so replayed or concurrent callbacks change nothing twice.
 */
import { BalanceTransactionType, NotificationType, OrderStatus, TopupRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { applyBalanceChangeTx } from "@/lib/balance";
import { renewIfDue } from "@/lib/billing/renewal";
import { adjustStockForOrderStatus } from "@/lib/inventory/order-stock";
import { createNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { queueOrderPaidEmail } from "@/lib/notifications/email/order-emails";
import { queueStoreServerEvent } from "@/lib/pixels/server";
import { purchaseEventId } from "@/lib/pixels/shared";
import { prisma } from "@/lib/prisma";

// ─── Storefront orders ───────────────────────────────────────────────────────

export async function settleOrderPayment(input: {
  orderId: string;
  paid: boolean;
  paymentStatus: string;
  paymentReference: string | null;
  /** Storefront URL, for the ad-pixel purchase event. */
  eventSourceUrl: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      storeId: true,
      total: true,
      status: true,
      phone: true,
      fullName: true,
      items: { select: { productId: true, quantity: true, price: true, product: { select: { name: true } } } },
      store: { select: { slug: true } },
    },
  });
  if (!order) return;

  const { paymentStatus, paymentReference } = input;

  if (input.paid && order.status !== OrderStatus.PAID) {
    const newlyPaid = await prisma.$transaction(async (tx) => {
      const marked = await tx.order.updateMany({
        where: { id: order.id, status: { in: [OrderStatus.PENDING, OrderStatus.CANCELED] } },
        data: { status: OrderStatus.PAID, paymentStatus, paymentReference, paidAt: new Date() },
      });
      if (marked.count === 0) {
        // Already shipped/delivered — just record the payment.
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus, paymentReference, paidAt: new Date() } });
      } else if (order.status === OrderStatus.CANCELED) {
        // Paid after its stock was released (failed attempt / expired) — take it again.
        await adjustStockForOrderStatus(tx, { storeId: order.storeId, orderId: order.id, direction: "take" });
      }
      return marked.count === 1;
    });

    // Ad pixels: an online order becomes a purchase only now, once.
    if (newlyPaid) {
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
        eventSourceUrl: input.eventSourceUrl,
      });
      queueOrderPaidEmail(order.id);
    }
  } else if (!input.paid) {
    await prisma.$transaction(async (tx) => {
      // A failed online payment gives its stock back; otherwise every declined
      // card would keep those pieces locked forever.
      const canceled = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING, paidAt: null },
        data: { status: OrderStatus.CANCELED, paymentStatus, paymentReference },
      });
      if (canceled.count === 1) {
        await adjustStockForOrderStatus(tx, { storeId: order.storeId, orderId: order.id, direction: "restock" });
      } else if (order.status !== OrderStatus.PAID) {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus, paymentReference } });
      }
    });
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/store/${order.store.slug}/order/${order.id}`);
}

// ─── Balance top-ups ─────────────────────────────────────────────────────────

/**
 * Credits (or rejects) an online top-up. A success that arrives after a failed
 * attempt on the same top-up still credits — the customer can retry on the
 * gateway's page — but never twice.
 */
export async function settleTopupPayment(input: {
  topupRequestId: string;
  paid: boolean;
  paymentReference: string | null;
  /** Shown to the merchant, e.g. "Paymob". */
  providerLabel: string;
}): Promise<"credited" | "already" | "failed" | "missing"> {
  const topup = await prisma.topupRequest.findUnique({
    where: { id: input.topupRequestId },
    select: { id: true, amount: true, status: true, storeId: true, store: { select: { userId: true } } },
  });
  if (!topup) return "missing";
  if (topup.status === TopupRequestStatus.APPROVED) return "already";

  if (!input.paid) {
    await prisma.topupRequest.updateMany({
      where: { id: topup.id, status: TopupRequestStatus.PENDING },
      data: { status: TopupRequestStatus.REJECTED, note: `فشل الدفع عبر ${input.providerLabel}`, transferRef: input.paymentReference },
    });
    return "failed";
  }

  // Claim + credit in one transaction: a replayed or concurrent callback finds
  // the request already APPROVED and credits nothing.
  const credited = await prisma.$transaction(async (tx) => {
    const claimed = await tx.topupRequest.updateMany({
      where: { id: topup.id, status: { in: [TopupRequestStatus.PENDING, TopupRequestStatus.REJECTED] } },
      data: { status: TopupRequestStatus.APPROVED, note: null, transferRef: input.paymentReference },
    });
    if (claimed.count === 0) return false;

    await applyBalanceChangeTx(tx, {
      storeId: topup.storeId,
      amount: topup.amount,
      type: BalanceTransactionType.TOPUP,
      note: `شحن رصيد عبر ${input.providerLabel} — مرجع: ${input.paymentReference ?? topup.id}`,
      reference: topup.id,
    });
    return true;
  });
  if (!credited) return "already";

  await renewIfDue(topup.storeId, { includeInactive: true }).catch((e) => console.error("[topup] renewal", e));

  await createNotification({
    storeId: topup.storeId,
    userId: topup.store.userId,
    type: NotificationType.TOPUP_APPROVED,
    title: "تمت إضافة الرصيد بنجاح",
    message: `تمت إضافة ${formatPiastersAsEgp(topup.amount)} لرصيد متجرك عبر ${input.providerLabel}.`,
    href: "/dashboard/balance",
    data: { topupRequestId: topup.id, amount: topup.amount },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard/balance/topup");
  revalidatePath("/dashboard/notifications");
  return "credited";
}

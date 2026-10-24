/**
 * Paymob callbacks for storefront orders paid on the merchant's own account.
 *  - POST: server-to-server "transaction processed" webhook (the source of truth).
 *  - GET:  the shopper's browser coming back from the checkout.
 * The order id travels as Paymob's merchant_order_id; the HMAC is checked with
 * that store's own secret.
 */
import { NextRequest, NextResponse } from "next/server";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { transactionFromRedirect, transactionFromWebhook, verifyPaymobHmac, type PaymobTransaction } from "@/lib/paymob";
import { settleOrderPayment } from "@/lib/payments/settle";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";

type Outcome = "success" | "failed" | "invalid" | "pending";

async function settle(tx: PaymobTransaction | null, hmac: string | null): Promise<{ outcome: Outcome; order?: { id: string; slug: string } }> {
  if (!tx?.merchantOrderId) return { outcome: "invalid" };

  const order = await prisma.order.findUnique({
    where: { id: tx.merchantOrderId },
    select: {
      id: true,
      total: true,
      store: { select: { slug: true, storePaymentSettings: { select: { paymobHmacSecretEncrypted: true } } } },
    },
  });
  if (!order) return { outcome: "invalid" };
  const ref = { id: order.id, slug: order.store.slug };

  const encrypted = order.store.storePaymentSettings?.paymobHmacSecretEncrypted;
  let valid = false;
  try {
    valid = !!encrypted && verifyPaymobHmac(tx, hmac, decryptSecret(encrypted));
  } catch (error) {
    console.error("[paymob order] could not decrypt HMAC secret", error);
  }
  if (!valid) {
    console.error("[paymob order] invalid hmac", { orderId: order.id, transactionId: tx.id });
    return { outcome: "invalid", order: ref };
  }
  if (tx.amountCents !== order.total || tx.currency !== "EGP") {
    console.error("[paymob order] amount mismatch", { orderId: order.id, expected: order.total, received: tx.amountCents });
    return { outcome: "invalid", order: ref };
  }
  // Kiosk-style payments report pending first; the final webhook settles them.
  if (tx.pending && !tx.success) return { outcome: "pending", order: ref };

  await settleOrderPayment({
    orderId: order.id,
    paid: tx.success,
    paymentStatus: tx.success ? "PAID" : "FAILED",
    paymentReference: tx.id,
    eventSourceUrl: buildStoreUrl(order.store.slug),
  });
  return { outcome: tx.success ? "success" : "failed", order: ref };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { outcome } = await settle(transactionFromWebhook(body), req.nextUrl.searchParams.get("hmac"));
  // 200 even for "invalid": a retry wouldn't change the answer.
  return NextResponse.json({ received: true, outcome });
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  const { outcome, order } = await settle(transactionFromRedirect(query), query.get("hmac"));
  if (!order) return NextResponse.redirect(new URL("/?payment=order-not-found", process.env.NEXT_PUBLIC_APP_URL || "https://casho.store"));

  const path = outcome === "success" ? `/order/${order.id}/success` : `/order/${order.id}`;
  const url = new URL(buildStoreUrl(order.slug, path));
  url.searchParams.set("payment", outcome);
  return NextResponse.redirect(url);
}

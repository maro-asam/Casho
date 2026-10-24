/**
 * Paymob callbacks for balance top-ups on Casho's own account.
 *  - POST: server-to-server "transaction processed" webhook (the source of truth).
 *  - GET:  the merchant's browser coming back from the checkout.
 * Both verify Paymob's HMAC and settle idempotently, whichever lands first.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  getPlatformPaymobCredentials,
  paymobCallbackBaseUrl,
  transactionFromRedirect,
  transactionFromWebhook,
  verifyPaymobHmac,
  type PaymobTransaction,
} from "@/lib/paymob";
import { settleTopupPayment } from "@/lib/payments/settle";
import { prisma } from "@/lib/prisma";

type Outcome = "success" | "failed" | "invalid" | "pending";

async function settle(tx: PaymobTransaction | null, hmac: string | null): Promise<Outcome> {
  const creds = getPlatformPaymobCredentials();
  if (!tx?.merchantOrderId || !creds) return "invalid";
  if (!verifyPaymobHmac(tx, hmac, creds.hmacSecret)) {
    console.error("[paymob topup] invalid hmac", { transactionId: tx.id });
    return "invalid";
  }

  const topup = await prisma.topupRequest.findUnique({ where: { id: tx.merchantOrderId }, select: { amount: true } });
  if (!topup) return "invalid";
  if (tx.amountCents !== topup.amount || tx.currency !== "EGP") {
    console.error("[paymob topup] amount mismatch", { topupRequestId: tx.merchantOrderId, expected: topup.amount, received: tx.amountCents });
    return "invalid";
  }
  // Kiosk-style payments report pending first; the final webhook settles them.
  if (tx.pending && !tx.success) return "pending";

  const result = await settleTopupPayment({
    topupRequestId: tx.merchantOrderId,
    paid: tx.success,
    paymentReference: tx.id,
    providerLabel: "Paymob",
  });
  return result === "credited" || result === "already" ? "success" : result === "failed" ? "failed" : "invalid";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const outcome = await settle(transactionFromWebhook(body), req.nextUrl.searchParams.get("hmac"));
  // 200 even for "invalid": a retry wouldn't change the answer.
  return NextResponse.json({ received: true, outcome });
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  const outcome = await settle(transactionFromRedirect(query), query.get("hmac"));
  const base = paymobCallbackBaseUrl();
  const target = outcome === "failed" ? "/dashboard/balance/topup" : "/dashboard/balance";
  // A pending payment shows as "under review" on the balance page until the webhook lands.
  return NextResponse.redirect(`${base}${target}?topup=${outcome === "pending" ? "success" : outcome}`);
}

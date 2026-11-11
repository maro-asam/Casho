/**
 * TEMP — Paymob callbacks for plans bought straight from the landing page's
 * pricing cards (Casho's own account). See lib/payments/plan-checkout.ts.
 *  - POST: server-to-server "transaction processed" webhook (the source of truth).
 *  - GET:  the payer's browser coming back from the checkout.
 * Both verify Paymob's HMAC and settle idempotently, whichever lands first.
 */
import { NextRequest, NextResponse } from "next/server";

import { transactionFromRedirect, transactionFromWebhook } from "@/lib/paymob";
import { marketingBaseUrl, settlePlanCheckout } from "@/lib/payments/plan-checkout";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { outcome } = await settlePlanCheckout(transactionFromWebhook(body), req.nextUrl.searchParams.get("hmac"));
  // 200 even for "invalid": a retry wouldn't change the answer.
  return NextResponse.json({ received: true, outcome });
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  const { outcome, planKey } = await settlePlanCheckout(transactionFromRedirect(query), query.get("hmac"));
  const params = new URLSearchParams({ status: outcome });
  if (planKey) params.set("plan", planKey);
  return NextResponse.redirect(`${marketingBaseUrl()}/payment-status?${params.toString()}`);
}

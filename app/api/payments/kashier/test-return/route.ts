/**
 * Return URL for the merchant's "try a payment" button on /payment-methods.
 * A valid signature (checked with the store's saved API key) proves the
 * Merchant ID + key pair works end to end. Nothing is recorded as an order.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import { isKashierPaid, verifyMerchantKashierCallbackSignature } from "@/lib/kashier-merchant";

function back(req: NextRequest, result: "ok" | "declined" | "invalid") {
  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
  return NextResponse.redirect(`${base}/dashboard/payment-methods?kashier_test=${result}`);
}

async function handler(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  if (req.method === "POST") {
    const form = await req.formData().catch(() => null);
    form?.forEach((value, key) => params.set(key, String(value)));
  }

  const match = /^kt_(.+)_\d+$/.exec(params.get("merchantOrderId") ?? "");
  if (!match) return back(req, "invalid");

  const settings = await prisma.storePaymentSettings.findUnique({
    where: { storeId: match[1] },
    select: { kashierApiKeyEncrypted: true },
  });
  if (!settings?.kashierApiKeyEncrypted) return back(req, "invalid");

  let valid = false;
  try {
    valid = verifyMerchantKashierCallbackSignature(params, decryptSecret(settings.kashierApiKeyEncrypted));
  } catch (error) {
    console.error("[kashier test-return]", error);
  }
  if (!valid) return back(req, "invalid");

  return back(req, isKashierPaid(params) ? "ok" : "declined");
}

export const GET = handler;
export const POST = handler;

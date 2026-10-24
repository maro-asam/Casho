/**
 * Kashier is retired (Paymob replaced it) — new top-ups go through Paymob.
 * This route only stays so top-ups already in flight still settle.
 */
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  verifyKashierCallbackSignature,
  isKashierPaid,
  kashierAmountToPiasters,
} from "@/lib/kashier";
import { settleTopupPayment } from "@/lib/payments/settle";

async function extractParams(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);

  if (req.method !== "POST") return params;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (body) {
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
    }
    return params;
  }

  const formData = await req.formData().catch(() => null);
  if (formData) {
    formData.forEach((value, key) => {
      params.set(key, String(value));
    });
  }

  return params;
}

function getDashboardUrl(req: NextRequest) {
  const appUrl = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin
  ).replace(/\/$/, "");

  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  try {
    const u = new URL(appUrl);
    if (u.hostname === rootDomain) {
      return `${u.protocol}//app.${rootDomain}`;
    }
  } catch {
    // fall through
  }
  return appUrl;
}

async function handleTopupCallback(req: NextRequest) {
  const params = await extractParams(req);
  const appUrl = getDashboardUrl(req);

  const merchantOrderId = params.get("merchantOrderId");

  if (!merchantOrderId) {
    return NextResponse.redirect(`${appUrl}/dashboard/balance/topup?topup=invalid`);
  }

  const topupRequest = await prisma.topupRequest.findUnique({
    where: { id: merchantOrderId },
    select: { id: true, amount: true },
  });

  if (!topupRequest) {
    return NextResponse.redirect(`${appUrl}/dashboard/balance/topup?topup=invalid`);
  }

  const isValidSignature = verifyKashierCallbackSignature(params);

  if (!isValidSignature) {
    console.error("Invalid Kashier topup signature", {
      topupRequestId: topupRequest.id,
      params: Object.fromEntries(params.entries()),
    });
    return NextResponse.redirect(`${appUrl}/dashboard/balance?topup=invalid`);
  }

  const callbackAmount = kashierAmountToPiasters(params.get("amount"));

  if (callbackAmount !== null && callbackAmount !== topupRequest.amount) {
    console.error("Kashier topup amount mismatch", {
      topupRequestId: topupRequest.id,
      expected: topupRequest.amount,
      received: callbackAmount,
    });
    return NextResponse.redirect(`${appUrl}/dashboard/balance?topup=invalid`);
  }

  const result = await settleTopupPayment({
    topupRequestId: topupRequest.id,
    paid: isKashierPaid(params),
    paymentReference: params.get("transactionId") || params.get("orderReference") || params.get("merchantOrderId"),
    providerLabel: "Kashier",
  });

  return result === "failed"
    ? NextResponse.redirect(`${appUrl}/dashboard/balance/topup?topup=failed`)
    : NextResponse.redirect(`${appUrl}/dashboard/balance?topup=success`);
}

export async function GET(req: NextRequest) {
  return handleTopupCallback(req);
}

export async function POST(req: NextRequest) {
  return handleTopupCallback(req);
}

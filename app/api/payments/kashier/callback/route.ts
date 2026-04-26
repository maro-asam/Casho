import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import {
  isKashierPaid,
  kashierAmountToPiasters,
  verifyMerchantKashierCallbackSignature,
} from "@/lib/kashier-merchant";
import { verifyKashierCallbackSignature as verifyGlobalKashierCallbackSignature } from "@/lib/kashier";

async function extractParams(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);

  if (req.method !== "POST") return params;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

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

function getAppUrl(req: NextRequest) {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin
  ).replace(/\/$/, "");
}

function buildOrderUrl(input: {
  req: NextRequest;
  storeSlug: string;
  orderId: string;
  payment: "success" | "failed" | "invalid";
}) {
  const url = new URL(
    `/store/${input.storeSlug}/order/${input.orderId}`,
    getAppUrl(input.req),
  );

  url.searchParams.set("payment", input.payment);

  return url;
}

function buildHomeUrl(req: NextRequest, reason: string) {
  const url = new URL("/", getAppUrl(req));
  url.searchParams.set("payment", reason);
  return url;
}

async function isValidKashierSignature(input: {
  params: URLSearchParams;
  encryptedApiKey?: string | null;
}) {
  if (input.encryptedApiKey) {
    try {
      const paymentApiKey = decryptSecret(input.encryptedApiKey);

      return verifyMerchantKashierCallbackSignature(
        input.params,
        paymentApiKey,
      );
    } catch (error) {
      console.error("Could not decrypt Kashier API key", error);
      return false;
    }
  }

  return verifyGlobalKashierCallbackSignature(input.params);
}

async function handleKashierCallback(req: NextRequest) {
  const params = await extractParams(req);

  const merchantOrderId = params.get("merchantOrderId");

  if (!merchantOrderId) {
    return NextResponse.redirect(buildHomeUrl(req, "missing-order"));
  }

  const order = await prisma.order.findUnique({
    where: { id: merchantOrderId },
    select: {
      id: true,
      total: true,
      status: true,
      store: {
        select: {
          slug: true,
          storePaymentSettings: {
            select: {
              kashierApiKeyEncrypted: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.redirect(buildHomeUrl(req, "order-not-found"));
  }

  const invalidUrl = buildOrderUrl({
    req,
    storeSlug: order.store.slug,
    orderId: order.id,
    payment: "invalid",
  });

  const isValidSignature = await isValidKashierSignature({
    params,
    encryptedApiKey: order.store.storePaymentSettings?.kashierApiKeyEncrypted,
  });

  if (!isValidSignature) {
    console.error("Invalid Kashier signature", {
      orderId: order.id,
      params: Object.fromEntries(params.entries()),
    });

    return NextResponse.redirect(invalidUrl);
  }

  const callbackAmount = kashierAmountToPiasters(params.get("amount"));

  if (callbackAmount !== null && callbackAmount !== order.total) {
    console.error("Kashier amount mismatch", {
      orderId: order.id,
      expected: order.total,
      received: callbackAmount,
    });

    return NextResponse.redirect(invalidUrl);
  }

  const paid = isKashierPaid(params);

  const paymentStatus =
    params.get("paymentStatus") ||
    params.get("status") ||
    (paid ? "PAID" : "FAILED");

  const paymentReference =
    params.get("transactionId") ||
    params.get("orderReference") ||
    params.get("merchantOrderId") ||
    params.get("orderId");

  if (paid && order.status !== OrderStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paymentStatus,
        paymentReference,
        paidAt: new Date(),
      },
    });
  } else if (!paid) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        paymentReference,
      },
    });
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/store/${order.store.slug}/order/${order.id}`);

  return NextResponse.redirect(
    buildOrderUrl({
      req,
      storeSlug: order.store.slug,
      orderId: order.id,
      payment: paid ? "success" : "failed",
    }),
  );
}

export async function GET(req: NextRequest) {
  return handleKashierCallback(req);
}

export async function POST(req: NextRequest) {
  return handleKashierCallback(req);
}
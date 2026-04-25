import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  isKashierPaid,
  kashierAmountToPiasters,
  verifyKashierCallbackSignature,
} from "@/lib/kashier";

async function extractParams(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);

  if (req.method !== "POST") {
    return params;
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (body) {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value !== "undefined" && value !== null) {
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

function buildOrderUrl(input: {
  req: NextRequest;
  storeSlug: string;
  orderId: string;
  payment: "success" | "failed" | "invalid";
}) {
  // @ts-expect-error nextUrl doesn't have origin
  const appUrl = process.env.APP_URL || req.nextUrl.origin;

  const url = new URL(
    `/store/${input.storeSlug}/order/${input.orderId}`,
    appUrl,
  );
  url.searchParams.set("payment", input.payment);

  return url;
}

async function handleKashierCallback(req: NextRequest) {
  const params = await extractParams(req);

  const merchantOrderId =
    params.get("merchantOrderId") || params.get("orderId");

  if (!merchantOrderId) {
    const url = new URL("/", process.env.APP_URL || req.nextUrl.origin);
    url.searchParams.set("payment", "missing-order");

    return NextResponse.redirect(url);
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
        },
      },
    },
  });

  if (!order) {
    const url = new URL("/", process.env.APP_URL || req.nextUrl.origin);
    url.searchParams.set("payment", "order-not-found");

    return NextResponse.redirect(url);
  }

  const invalidUrl = buildOrderUrl({
    req,
    storeSlug: order.store.slug,
    orderId: order.id,
    payment: "invalid",
  });

  const isValidSignature = verifyKashierCallbackSignature(params);

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

  if (paid && order.status !== OrderStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/store/${order.store.slug}/order/${order.id}`);
  }

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

import { NextRequest, NextResponse } from "next/server";
import { BalanceTransactionType, NotificationType, TopupRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { applyBalanceChange } from "@/lib/balance";
import {
  verifyKashierCallbackSignature,
  isKashierPaid,
  kashierAmountToPiasters,
} from "@/lib/kashier";
import { TryRenewStoreSubscriptionAction } from "@/actions/subscription/subscription.actions";
import {
  createNotification,
  formatPiastersAsEgp,
} from "@/lib/notifications/in-app";

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
    select: {
      id: true,
      amount: true,
      status: true,
      storeId: true,
      store: {
        select: {
          id: true,
          userId: true,
          name: true,
        },
      },
    },
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

  // Idempotency — لو الـ callback وصل أكتر من مرة
  if (topupRequest.status !== TopupRequestStatus.PENDING) {
    const paid = topupRequest.status === TopupRequestStatus.APPROVED;
    return NextResponse.redirect(
      `${appUrl}/dashboard/balance?topup=${paid ? "success" : "failed"}`,
    );
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

  const paid = isKashierPaid(params);
  const paymentReference =
    params.get("transactionId") ||
    params.get("orderReference") ||
    params.get("merchantOrderId");

  if (paid) {
    await prisma.$transaction(async (tx) => {
      await tx.topupRequest.update({
        where: { id: topupRequest.id },
        data: {
          status: TopupRequestStatus.APPROVED,
          transferRef: paymentReference,
        },
      });
    });

    await applyBalanceChange({
      storeId: topupRequest.storeId,
      amount: topupRequest.amount,
      type: BalanceTransactionType.TOPUP,
      note: `شحن رصيد عبر Kashier — مرجع: ${paymentReference ?? topupRequest.id}`,
    });

    await TryRenewStoreSubscriptionAction(topupRequest.storeId);

    await createNotification({
      storeId: topupRequest.storeId,
      userId: topupRequest.store.userId,
      type: NotificationType.TOPUP_APPROVED,
      title: "تمت إضافة الرصيد بنجاح",
      message: `تمت إضافة ${formatPiastersAsEgp(topupRequest.amount)} لرصيد متجرك عبر Kashier.`,
      href: "/dashboard/balance",
      data: {
        topupRequestId: topupRequest.id,
        amount: topupRequest.amount,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/topup");
    revalidatePath("/dashboard/notifications");

    return NextResponse.redirect(`${appUrl}/dashboard/balance?topup=success`);
  }

  await prisma.topupRequest.update({
    where: { id: topupRequest.id },
    data: {
      status: TopupRequestStatus.REJECTED,
      note: "فشل الدفع عبر Kashier",
      transferRef: paymentReference,
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/balance/topup?topup=failed`);
}

export async function GET(req: NextRequest) {
  return handleTopupCallback(req);
}

export async function POST(req: NextRequest) {
  return handleTopupCallback(req);
}

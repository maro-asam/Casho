"use server";

import {
  NotificationType,
  TopupMethod,
  TopupRequestStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import {
  createNotification,
  formatPiastersAsEgp,
} from "@/lib/notifications/in-app";
import { createKashierTopupHppUrl } from "@/lib/kashier";

type CreateTopupRequestInput = {
  storeId: string;
  amount: number; // بالقروش
  method: TopupMethod;
  note?: string;
  transferRef?: string;
  receiptImage?: string;
};

type ActionResult = {
  success: boolean;
  message: string;
};

const methodLabels: Record<TopupMethod, string> = {
  INSTAPAY: "إنستا باي",
  VODAFONE_CASH: "فودافون كاش",
  BANK_TRANSFER: "تحويل بنكي",
  KASHIER: "Kashier",
};

function isValidTopupAmount(amount: number) {
  return Number.isInteger(amount) && amount >= 1000; // أقل حاجة 10 جنيه
}

export async function CreateTopupRequestAction({
  storeId,
  amount,
  method,
  note,
  transferRef,
  receiptImage,
}: CreateTopupRequestInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!isValidTopupAmount(amount)) {
      return {
        success: false,
        message: "قيمة الشحن غير صحيحة",
      };
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!store) {
      return {
        success: false,
        message: "المتجر غير موجود",
      };
    }

    const topupRequest = await prisma.topupRequest.create({
      data: {
        storeId,
        amount,
        method,
        status: TopupRequestStatus.PENDING,
        note: note?.trim() || null,
        transferRef: transferRef?.trim() || null,
        receiptImage: receiptImage?.trim() || null,
      },
      select: { id: true },
    });

    await createNotification({
      storeId,
      type: NotificationType.TOPUP_REQUEST_CREATED,
      title: "طلب شحن الرصيد اتبعت",
      message: `طلب شحن بقيمة ${formatPiastersAsEgp(amount)} قيد المراجعة.`,
      href: "/dashboard/balance",
      data: {
        topupRequestId: topupRequest.id,
        amount,
        method,
      },
    });

    await sendTelegramMessage(`
طلب شحن جديد على Casho
المتجر: ${store.name}
المبلغ: ${amount / 100} جنيه
طريقة الدفع: ${methodLabels[method] ?? method}
رقم المرجع: ${transferRef ?? "غير مضاف"}
ملاحظات: ${note ?? "لا يوجد"}
راجع الطلب: ${process.env.NEXT_PUBLIC_APP_URL}/admin/topup-requests
`);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/topup");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/admin/topup-requests");

    return {
      success: true,
      message: "تم إرسال طلب الشحن بنجاح وبانتظار المراجعة",
    };
  } catch (error) {
    console.error("CreateTopupRequestAction Error:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء إنشاء طلب الشحن",
    };
  }
}

export async function InitiateKashierTopupAction(
  storeId: string,
  amountInPiasters: number,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!isValidTopupAmount(amountInPiasters)) {
      return { success: false, message: "قيمة الشحن غير صحيحة" };
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    const topupRequest = await prisma.topupRequest.create({
      data: {
        storeId,
        amount: amountInPiasters,
        method: TopupMethod.KASHIER,
        status: TopupRequestStatus.PENDING,
      },
      select: { id: true },
    });

    const rawAppUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL
    )?.replace(/\/$/, "");

    if (!rawAppUrl) {
      throw new Error("APP_URL is required for Kashier topup");
    }

    const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
    let callbackBaseUrl = rawAppUrl;
    try {
      const u = new URL(rawAppUrl);
      if (u.hostname === rootDomain) {
        callbackBaseUrl = `${u.protocol}//app.${rootDomain}`;
      }
    } catch {
      // fall through
    }

    const checkoutUrl = createKashierTopupHppUrl({
      orderId: topupRequest.id,
      amountInPiasters,
      merchantRedirect: `${callbackBaseUrl}/api/payments/kashier/topup-callback`,
      metaData: {
        storeId: store.id,
        storeName: store.name,
        type: "topup",
      },
    });

    redirect(checkoutUrl);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error;
    }
    console.error("InitiateKashierTopupAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء بدء عملية الدفع" };
  }
}

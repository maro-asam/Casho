"use server";

import { prisma } from "@/lib/prisma";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import {
  TopupMethod,
  TopupRequestStatus,
  BalanceTransactionType,
} from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { applyBalanceChange } from "@/lib/balance";
import { requireUserId } from "../auth/require-user-id.actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

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

    await prisma.topupRequest.create({
      data: {
        storeId,
        amount,
        method,
        status: TopupRequestStatus.PENDING,
        note: note?.trim() || null,
        transferRef: transferRef?.trim() || null,
        receiptImage: receiptImage?.trim() || null,
      },
    });

    const methodLabels: Record<string, string> = {
      INSTAPAY: "إنستا باي",
      VODAFONE_CASH: "فودافون كاش",
      BANK_TRANSFARE: "تحويل بنكي",
      orange_cash: "أورنج كاش",
      etisalat_cash: "اتصالات كاش",
    };

    await sendTelegramMessage(`
💵 طلب شحن جديد على Casho

🏪 المتجر: ${store.name}
💰 المبلغ: ${amount / 100} جنيه
💳 طريقة الدفع: ${methodLabels[method] ?? method}
🧾 رقم المرجع: ${transferRef ?? "غير مضاف"}
📝 ملاحظات: ${note ?? "لا يوجد"}

📂 راجع الطلب:
https://yourdomain.com/admin/topup-requests
`);

    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/topup");
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

export async function ApproveTopupRequestAction(
  requestId: string,
): Promise<ActionResult> {
  try {
    const request = await prisma.topupRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        amount: true,
        status: true,
        storeId: true,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "طلب الشحن غير موجود",
      };
    }

    if (request.status !== TopupRequestStatus.PENDING) {
      return {
        success: false,
        message: "تم التعامل مع طلب الشحن بالفعل",
      };
    }

    await applyBalanceChange({
      storeId: request.storeId,
      amount: request.amount,
      type: BalanceTransactionType.TOPUP,
      note: "شحن رصيد بعد مراجعة طلب الشحن",
    });

    await prisma.topupRequest.update({
      where: { id: request.id },
      data: {
        status: TopupRequestStatus.APPROVED,
      },
    });

    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/topup");
    revalidatePath("/admin/topup-requests");

    return {
      success: true,
      message: "تمت الموافقة على طلب الشحن وإضافة الرصيد",
    };
  } catch (error) {
    console.error("ApproveTopupRequestAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء الموافقة على طلب الشحن",
    };
  }
}

export async function RejectTopupRequestAction(
  requestId: string,
): Promise<ActionResult> {
  try {
    const request = await prisma.topupRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "طلب الشحن غير موجود",
      };
    }

    if (request.status !== TopupRequestStatus.PENDING) {
      return {
        success: false,
        message: "تم التعامل مع طلب الشحن بالفعل",
      };
    }

    await prisma.topupRequest.update({
      where: { id: request.id },
      data: {
        status: TopupRequestStatus.REJECTED,
      },
    });

    revalidatePath("/admin/topup-requests");
    revalidatePath("/dashboard/balance/topup");

    return {
      success: true,
      message: "تم رفض طلب الشحن",
    };
  } catch (error) {
    console.error("RejectTopupRequestAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء رفض طلب الشحن",
    };
  }
}

export async function ApplyApprovedTopupRequestAction(
  requestId: string,
): Promise<ActionResult> {
  try {
    const request = await prisma.topupRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        amount: true,
        status: true,
        note: true,
        transferRef: true,
        storeId: true,
        store: {
          select: {
            id: true,
            slug: true,
            balance: true,
          },
        },
      },
    });

    if (!request) {
      return {
        success: false,
        message: "طلب الشحن غير موجود",
      };
    }

    if (request.status !== TopupRequestStatus.APPROVED) {
      return {
        success: false,
        message: "لازم الطلب يكون Approved الأول",
      };
    }

    const alreadyApplied = await prisma.balanceTransaction.findFirst({
      where: {
        storeId: request.storeId,
        type: BalanceTransactionType.TOPUP,
        reference: request.id,
      },
      select: {
        id: true,
      },
    });

    if (alreadyApplied) {
      return {
        success: false,
        message: "تمت إضافة هذا الشحن مسبقًا",
      };
    }

    const balanceBefore = request.store.balance;
    const balanceAfter = balanceBefore + request.amount;

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: request.storeId },
        data: {
          balance: balanceAfter,
        },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: request.storeId,
          type: BalanceTransactionType.TOPUP,
          amount: request.amount,
          balanceBefore,
          balanceAfter,
          note: request.note?.trim() || "شحن رصيد بعد الموافقة على طلب الشحن",
          reference: request.id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/topup");
    revalidatePath(`/store/${request.store.slug}`);

    return {
      success: true,
      message: "تمت إضافة الرصيد بنجاح",
    };
  } catch (error) {
    console.error("ApplyApprovedTopupRequestAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء إضافة الرصيد",
    };
  }
}

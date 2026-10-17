"use server";

import { revalidatePath } from "next/cache";
import {
  BalanceTransactionType,
  NotificationType,
  TopupRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { renewIfDue } from "@/lib/billing/renewal";
import {
  createNotification,
  formatPiastersAsEgp,
} from "@/lib/notifications/in-app";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function approveTopupRequestAction(
  topupRequestId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const topupRequest = await prisma.topupRequest.findUnique({
      where: { id: topupRequestId },
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
            name: true,
            balance: true,
          },
        },
      },
    });

    if (!topupRequest) {
      return {
        success: false,
        message: "طلب الشحن غير موجود",
      };
    }

    if (topupRequest.status !== TopupRequestStatus.PENDING) {
      return {
        success: false,
        message: "لا يمكن اعتماد هذا الطلب لأنه ليس معلقًا",
      };
    }

    const applied = await prisma.$transaction(async (tx) => {
      // Claim the request first: a concurrent approval (double click, Telegram
      // bot) finds it no longer PENDING and credits nothing.
      const claimed = await tx.topupRequest.updateMany({
        where: { id: topupRequest.id, status: TopupRequestStatus.PENDING },
        data: { status: TopupRequestStatus.APPROVED },
      });
      if (claimed.count === 0) return false;

      // Atomic increment — the balance read above may already be stale.
      const { balance: balanceAfter } = await tx.store.update({
        where: { id: topupRequest.storeId },
        data: { balance: { increment: topupRequest.amount } },
        select: { balance: true },
      });
      const balanceBefore = balanceAfter - topupRequest.amount;

      await tx.balanceTransaction.create({
        data: {
          storeId: topupRequest.storeId,
          type: BalanceTransactionType.TOPUP,
          amount: topupRequest.amount,
          balanceBefore,
          balanceAfter,
          note:
            topupRequest.note?.trim() ||
            "شحن رصيد من خلال طلب شحن تمت مراجعته من الأدمن",
          reference: topupRequest.transferRef || topupRequest.id,
        },
      });

      return true;
    });

    if (!applied) {
      return { success: false, message: "الطلب ده اتراجع بالفعل" };
    }

    await renewIfDue(topupRequest.storeId, { includeInactive: true }).catch((e) => console.error("[topup] renewal", e));

    await createNotification({
      storeId: topupRequest.storeId,
      type: NotificationType.TOPUP_APPROVED,
      title: "تم اعتماد طلب الشحن",
      message: `تمت إضافة ${formatPiastersAsEgp(topupRequest.amount)} لرصيد متجرك.`,
      href: "/dashboard/balance",
      data: {
        topupRequestId: topupRequest.id,
        amount: topupRequest.amount,
      },
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/subscription");
    revalidatePath("/dashboard/notifications");

    return {
      success: true,
      message: "تم اعتماد طلب الشحن وإضافة الرصيد بنجاح",
    };
  } catch (error) {
    console.error("approveTopupRequestAction Error:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء اعتماد طلب الشحن",
    };
  }
}

export async function rejectTopupRequestAction(
  topupRequestId: string,
  reason?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const topupRequest = await prisma.topupRequest.findUnique({
      where: { id: topupRequestId },
      select: {
        id: true,
        amount: true,
        status: true,
        storeId: true,
      },
    });

    if (!topupRequest) {
      return {
        success: false,
        message: "طلب الشحن غير موجود",
      };
    }

    if (topupRequest.status !== TopupRequestStatus.PENDING) {
      return {
        success: false,
        message: "لا يمكن رفض هذا الطلب لأنه ليس معلقًا",
      };
    }

    const claimed = await prisma.topupRequest.updateMany({
      where: { id: topupRequest.id, status: TopupRequestStatus.PENDING },
      data: { status: TopupRequestStatus.REJECTED },
    });
    if (claimed.count === 0) {
      return { success: false, message: "الطلب ده اتراجع بالفعل" };
    }

    const trimmedReason = reason?.trim().slice(0, 300);

    await createNotification({
      storeId: topupRequest.storeId,
      type: NotificationType.TOPUP_REJECTED,
      title: "تم رفض طلب الشحن",
      message: trimmedReason
        ? `طلب شحن ${formatPiastersAsEgp(topupRequest.amount)} اترفض: ${trimmedReason}`
        : `طلب شحن ${formatPiastersAsEgp(topupRequest.amount)} اترفض. راجع بيانات التحويل أو تواصل مع الدعم.`,
      href: "/dashboard/balance",
      data: {
        topupRequestId: topupRequest.id,
        amount: topupRequest.amount,
        ...(trimmedReason && { reason: trimmedReason }),
      },
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard/notifications");

    return {
      success: true,
      message: "تم رفض طلب الشحن",
    };
  } catch (error) {
    console.error("rejectTopupRequestAction Error:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء رفض طلب الشحن",
    };
  }
}

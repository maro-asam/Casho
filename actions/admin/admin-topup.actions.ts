"use server";

import { revalidatePath } from "next/cache";
import {
  BalanceTransactionType,
  NotificationType,
  TopupRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { TryRenewStoreSubscriptionAction } from "@/actions/subscription/subscription.actions";
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

    await prisma.$transaction(async (tx) => {
      const balanceBefore = topupRequest.store.balance;
      const balanceAfter = balanceBefore + topupRequest.amount;

      await tx.store.update({
        where: { id: topupRequest.storeId },
        data: { balance: balanceAfter },
      });

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

      await tx.topupRequest.update({
        where: { id: topupRequest.id },
        data: { status: TopupRequestStatus.APPROVED },
      });
    });

    await TryRenewStoreSubscriptionAction(topupRequest.storeId);

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

    revalidatePath("/admin");
    revalidatePath("/admin/topup-requests");
    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${topupRequest.storeId}`);
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

    await prisma.topupRequest.update({
      where: { id: topupRequest.id },
      data: { status: TopupRequestStatus.REJECTED },
    });

    await createNotification({
      storeId: topupRequest.storeId,
      type: NotificationType.TOPUP_REJECTED,
      title: "تم رفض طلب الشحن",
      message: `طلب شحن ${formatPiastersAsEgp(topupRequest.amount)} اترفض. راجع بيانات التحويل أو تواصل مع الدعم.`,
      href: "/dashboard/balance",
      data: {
        topupRequestId: topupRequest.id,
        amount: topupRequest.amount,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/topup-requests");
    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${topupRequest.storeId}`);
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

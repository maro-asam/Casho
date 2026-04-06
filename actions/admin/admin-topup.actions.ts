"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { BalanceTransactionType, TopupRequestStatus } from "@/lib/generated/prisma/enums";
import { requireAdmin } from "./admin-guard.actions";
import { TryRenewStoreSubscriptionAction } from "../subscription/subscription.actions";

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
        data: {
          balance: balanceAfter,
        },
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
        data: {
          status: TopupRequestStatus.APPROVED,
        },
      });
    });

    // محاولة تجديد الاشتراك تلقائيًا لو المتجر منتهي
    await TryRenewStoreSubscriptionAction(topupRequest.storeId);

    revalidatePath("/admin");
    revalidatePath("/admin/topup-requests");
    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${topupRequest.storeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/subscription");

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
      data: {
        status: TopupRequestStatus.REJECTED,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/topup-requests");
    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${topupRequest.storeId}`);

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
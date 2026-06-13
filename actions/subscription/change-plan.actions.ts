"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { PLAN_PRICES, type PlanKey } from "@/lib/subscriptions";

export type ChangePlanFormState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    plan?: string;
  };
};

function isValidPlan(plan: string): plan is PlanKey {
  return plan === "SUPER";
}

export async function UpdateStorePlanAction(
  _prevState: ChangePlanFormState,
  formData: FormData,
): Promise<ChangePlanFormState> {
  try {
    const userId = await requireUserId();

    const plan = String(formData.get("plan") || "");
    const autoRenew = String(formData.get("autoRenew")) === "true";

    if (!isValidPlan(plan)) {
      return {
        success: false,
        message: "البيانات غير صحيحة",
        fieldErrors: {
          plan: "من فضلك اختر باقة صحيحة",
        },
      };
    }

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        monthlyPrice: PLAN_PRICES[plan],
        planName: plan,
        autoRenew,
        planSelected: true,
      },
    });

    revalidatePath("/dashboard/change-plan");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, message: "تم تحديث الباقة بنجاح" };
  } catch (error) {
    console.error("UpdateStorePlanAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تحديث الباقة" };
  }
}

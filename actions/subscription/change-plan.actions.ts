"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export type PlanKey = "STARTER" | "GROWTH" | "PRO" | "CUSTOM";

export type ChangePlanFormState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    plan?: string;
  };
};

const PLAN_PRICES: Record<PlanKey, number> = {
  STARTER: 29900,
  GROWTH: 49900,
  PRO: 99900,
  CUSTOM: 0,
};

function isValidPlan(plan: string): plan is PlanKey {
  return plan === "STARTER" || plan === "GROWTH" || plan === "PRO";
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
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!store) {
      return {
        success: false,
        message: "المتجر غير موجود",
      };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        monthlyPrice: PLAN_PRICES[plan],
        autoRenew,
      },
    });

    revalidatePath("/dashboard/change-plan");
    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "تم تحديث الباقة بنجاح",
    };
  } catch (error) {
    console.error("UpdateStorePlanAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء تحديث الباقة",
    };
  }
}

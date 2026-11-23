"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { prisma } from "@/lib/prisma";
import { isStoreCurrency } from "@/lib/store/currency";
import { revalidateStorefront } from "@/lib/store/storefront-cache";

/**
 * The currency the storefront shows prices in (lib/store/currency.ts). Only
 * the display changes — prices keep their numbers — so it's applied live.
 */
export async function UpdateStoreCurrencyAction(input: { storeId: string; currency: string }): Promise<{ success: boolean; message: string }> {
  if (typeof input?.storeId !== "string" || !isStoreCurrency(input.currency)) {
    return { success: false, message: "عملة غير مدعومة" };
  }
  try {
    const userId = await requireUserId();
    const store = await MustOwnStore(input.storeId, userId);
    await prisma.storeSettings.upsert({
      where: { storeId: store.id },
      create: { storeId: store.id, storeCurrency: input.currency },
      update: { storeCurrency: input.currency },
    });
    revalidateStorefront(store.slug);
    revalidatePath("/dashboard/settings");
    return { success: true, message: "عملة المتجر اتغيرت" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/dashboard/runtime";
import { requireUserId } from "./require-user-id.actions";

/** Saves the signed-in user's dashboard language ("ar" | "en"). */
export async function UpdateDashboardLocaleAction(locale: string) {
  if (!isLocale(locale)) return { success: false as const, error: "لغة غير مدعومة" };
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { locale } });
  revalidatePath("/", "layout");
  return { success: true as const };
}

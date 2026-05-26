"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";

const schema = z.object({
  storeId: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
});

export async function UpdateStoreColorsAction(input: {
  storeId: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  try {
    const userId = await requireUserId();

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: "ألوان غير صالحة" };
    }

    const { storeId, primaryColor, secondaryColor } = parsed.data;

    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { primaryColor, secondaryColor },
      create: { storeId, primaryColor, secondaryColor },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

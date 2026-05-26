"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { ARABIC_FONTS } from "@/constants/arabic-fonts";

const VALID_FONT_IDS = Object.keys(ARABIC_FONTS);

const schema = z.object({
  storeId: z.string().min(1),
  fontId: z.string().refine((v) => VALID_FONT_IDS.includes(v), "خط غير صالح"),
});

export async function UpdateStoreFontAction(input: {
  storeId: string;
  fontId: string;
}) {
  try {
    const userId = await requireUserId();

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: "خط غير صالح" };
    }

    const { storeId, fontId } = parsed.data;

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
      update: { fontId },
      create: { storeId, fontId },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, message: "تم حفظ الخط بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

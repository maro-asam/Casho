"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { conversionConfigSchema, readConversionConfig, type ConversionConfig } from "@/lib/conversion/conversion-config";

export type ConversionResult = { ok: true } | { ok: false; message: string };

/** Saves one widget's settings (whatsapp / purchaseToasts) without touching the other. */
export async function UpdateConversionConfigAction<K extends keyof ConversionConfig>(
  storeId: string,
  key: K,
  value: ConversionConfig[K],
): Promise<ConversionResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const settings = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { conversionConfig: true },
  });
  const current = readConversionConfig(settings?.conversionConfig);

  const parsed = conversionConfigSchema.safeParse({ ...current, [key]: value });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "في بيانات مش صحيحة." };

  await prisma.storeSettings.upsert({
    where: { storeId },
    update: { conversionConfig: parsed.data },
    create: { storeId, conversionConfig: parsed.data },
  });

  revalidatePath("/dashboard/customization");
  revalidateStorefront(store.slug);
  return { ok: true };
}

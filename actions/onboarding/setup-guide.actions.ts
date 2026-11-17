"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { mutateAppearance } from "@/lib/studio/mutate";

// Quick steps the dashboard's setup checklist ("جهّز متجرك للبيع") does in
// place, without sending the merchant to another page. The store is always the
// signed-in owner's (same lookup as the dashboard overview).

type Result = { success: boolean; message: string };

async function ownStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

const logoSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => /^https:\/\//.test(v), "اللوجو غير صالح");

/** Sets the logo live (and on an open Studio draft), like the Studio's identity panel. */
export async function SaveSetupLogoAction(url: unknown): Promise<Result> {
  const parsed = logoSchema.safeParse(url);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "اللوجو غير صالح" };
  try {
    const store = await ownStore();
    if (!store) return { success: false, message: "لم يتم العثور على المتجر" };
    await mutateAppearance(store.id, (a) => ({ ...a, logo: parsed.data }));
    revalidatePath("/dashboard");
    return { success: true, message: "اللوجو اتحط على متجرك" };
  } catch (error) {
    console.error("SaveSetupLogoAction error:", error);
    return { success: false, message: "مقدرناش نحفظ اللوجو، جرّب تاني" };
  }
}

const whatsappSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^\+?\d{8,15}$/.test(v), "اكتب الرقم أرقام بس، زي 01012345678");

/** The number customers reach the store on (footer, order confirmations, WhatsApp button). */
export async function SaveSetupWhatsappAction(number: unknown): Promise<Result> {
  const parsed = whatsappSchema.safeParse(typeof number === "string" ? number : "");
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "رقم الواتساب مش صحيح" };
  try {
    const store = await ownStore();
    if (!store) return { success: false, message: "لم يتم العثور على المتجر" };
    await prisma.storeSettings.upsert({
      where: { storeId: store.id },
      update: { whatsappNumber: parsed.data },
      create: { storeId: store.id, whatsappNumber: parsed.data },
    });
    revalidateStorefront(store.slug);
    revalidatePath("/dashboard");
    return { success: true, message: "رقم الواتساب اتحفظ" };
  } catch (error) {
    console.error("SaveSetupWhatsappAction error:", error);
    return { success: false, message: "مقدرناش نحفظ الرقم، جرّب تاني" };
  }
}

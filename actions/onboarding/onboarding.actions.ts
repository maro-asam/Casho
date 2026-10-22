"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { getThemePreset, isThemePresetId, type ThemePresetId } from "@/constants/store-themes";
import { mutateAppearance } from "@/lib/studio/mutate";
import { clearDemoData, seedDemoData } from "@/lib/demo-data/seed";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

const handle = z.string().trim().max(255).optional().default("");

const onboardingSchema = z.object({
  themeId: z.string().refine(isThemePresetId, "الثيم غير صالح"),
  logo: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || /^https:\/\//.test(v), "اللوجو غير صالح")
    .optional()
    .default(""),
  storeLanguage: z.enum(["ar", "en"]),
  whatsappNumber: z
    .string()
    .trim()
    .refine((v) => !v || /^\+?\d{8,15}$/.test(v.replace(/[\s-]/g, "")), "رقم الواتساب مش صحيح")
    .optional()
    .default(""),
  instagram: handle,
  facebook: handle,
  tiktok: handle,
  cashOnDelivery: z.boolean(),
  vodafoneCash: z
    .string()
    .trim()
    .refine((v) => !v || /^01[0125]\d{8}$/.test(v.replace(/\s/g, "")), "رقم فودافون كاش لازم يكون ١١ رقم")
    .optional()
    .default(""),
  instapay: z.string().trim().max(100, "عنوان InstaPay طويل أوي").optional().default(""),
  /** EGP, 0 = free shipping. */
  shippingPrice: z.number().int().min(0).max(100000),
  start: z.enum(["demo", "empty", "import"]),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;

export type CompleteOnboardingResult =
  | { success: true; storeUrl: string; seeded: { products: number; orders: number } | null }
  | { success: false; message: string };

export async function CompleteOnboardingAction(input: OnboardingInput): Promise<CompleteOnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "راجع البيانات" };
  const data = parsed.data;
  const themeId = data.themeId as ThemePresetId;

  try {
    const userId = await requireUserId();
    const store = await prisma.store.findFirst({
      where: { userId },
      select: {
        id: true,
        slug: true,
        onboardingCompleted: true,
        user: { select: { businessType: true } },
        storePaymentSettings: { select: { manualPaymentDetails: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!store) return { success: false, message: "لم يتم العثور على المتجر" };

    const storeUrl = buildStoreUrl(store.slug);
    if (store.onboardingCompleted) return { success: true, storeUrl, seeded: null };

    // Look: theme preset + logo + language, through the same path the Studio uses.
    await mutateAppearance(store.id, (a) => ({
      ...a,
      themeConfig: { presetId: themeId, ...(a.themeConfig.sectionContent ? { sectionContent: a.themeConfig.sectionContent } : {}) },
      navbarVariant: getThemePreset(themeId).layout.navbar,
      logo: data.logo || a.logo,
      storeLanguage: data.storeLanguage,
    }));

    // Contact + shipping.
    const contact = {
      whatsappNumber: data.whatsappNumber.replace(/[\s-]/g, "") || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      tiktok: data.tiktok || null,
      shippingPrice: data.shippingPrice,
    };
    await prisma.storeSettings.update({ where: { storeId: store.id }, data: contact });

    // Payments — same shape the payment-methods page writes.
    const vodafone = data.vodafoneCash.replace(/\s/g, "");
    const enabled = [
      ...(data.cashOnDelivery ? ["cash_on_delivery"] : []),
      ...(vodafone ? ["vodafone_cash"] : []),
      ...(data.instapay ? ["instapay"] : []),
    ];
    if (!enabled.length) enabled.push("cash_on_delivery");
    const previous = (store.storePaymentSettings?.manualPaymentDetails ?? {}) as Record<string, string>;
    const details = { ...previous, ...(vodafone && { vodafone_cash: vodafone }), ...(data.instapay && { instapay: data.instapay }) };
    const payments = {
      enabledPaymentMethods: enabled,
      manualPaymentDetails: details,
      cashOnDeliveryEnabled: enabled.includes("cash_on_delivery"),
      vodafoneCashEnabled: Boolean(vodafone),
      vodafoneCashNumber: vodafone || null,
      instapayEnabled: Boolean(data.instapay),
      instapayAddress: data.instapay || null,
    };
    await prisma.$transaction([
      prisma.store.update({ where: { id: store.id }, data: { paymentMethods: enabled } }),
      prisma.storePaymentSettings.upsert({
        where: { storeId: store.id },
        update: payments,
        create: { storeId: store.id, ...payments },
      }),
    ]);

    // Sample catalog before the store is marked done, so a failure can be retried.
    const seeded = data.start === "demo" ? await seedDemoData(store.id, store.user.businessType) : null;

    await prisma.store.update({
      where: { id: store.id },
      data: {
        businessCategory: store.user.businessType || undefined,
        onboardingCompleted: true,
        planSelected: true,
      },
    });

    return { success: true, storeUrl, seeded: seeded && { products: seeded.products, orders: seeded.orders } };
  } catch (error) {
    console.error("CompleteOnboardingAction error:", error);
    return { success: false, message: "حدث خطأ أثناء إكمال الإعداد، حاول مرة أخرى" };
  }
}

export async function ClearDemoDataAction(): Promise<{ success: boolean; message: string }> {
  try {
    const userId = await requireUserId();
    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!store) return { success: false, message: "لم يتم العثور على المتجر" };

    const result = await clearDemoData(store.id);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: result.kept
        ? `اتمسحت البيانات التجريبية — ${result.kept} منتج اتخفى بدل ما يتمسح لأنه مستخدم في طلبات حقيقية`
        : "اتمسحت البيانات التجريبية، متجرك فاضي ومستني منتجاتك",
    };
  } catch (error) {
    console.error("ClearDemoDataAction error:", error);
    return { success: false, message: "مقدرناش نمسح البيانات التجريبية، جرّب تاني" };
  }
}

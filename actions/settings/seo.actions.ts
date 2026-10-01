"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} لازم يكون أقل من ${max} حرف`).optional().default("");

const seoSchema = z.object({
  seoTitle: optionalText(70, "العنوان"),
  seoDescription: optionalText(170, "الوصف"),
  ogTitle: optionalText(90, "عنوان المشاركة"),
  ogDescription: optionalText(200, "وصف المشاركة"),
  ogImage: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "رابط صورة المشاركة مش صحيح"),
  /** Accepts the raw code or the whole <meta …> tag Google gives you. */
  googleSiteVerification: z.string().trim().max(400).optional().default(""),
  isIndexed: z.boolean(),
});

export type SeoInput = z.input<typeof seoSchema>;
export type SeoSaveResult = { ok: true; verification: string | null } | { ok: false; message: string; field?: string };

/** `<meta name="google-site-verification" content="abc" />` → "abc". */
function extractVerification(raw: string) {
  if (!raw) return null;
  const fromTag = raw.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
  const code = (fromTag ?? raw).trim();
  return /^[A-Za-z0-9_-]{10,100}$/.test(code) ? code : undefined;
}

export async function SaveStoreSeoAction(storeId: string, input: SeoInput): Promise<SeoSaveResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: issue?.message ?? "في بيانات مش صحيحة", field: issue?.path[0]?.toString() };
  }
  const data = parsed.data;

  const verification = extractVerification(data.googleSiteVerification);
  if (verification === undefined) {
    return {
      ok: false,
      field: "googleSiteVerification",
      message: "كود التحقق مش واضح — الصق الـ meta tag اللي جوجل اداهولك كامل.",
    };
  }

  const values = {
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    ogTitle: data.ogTitle || null,
    ogDescription: data.ogDescription || null,
    ogImage: data.ogImage || null,
    googleSiteVerification: verification,
    isIndexed: data.isIndexed,
  };

  await prisma.storeSettings.upsert({
    where: { storeId },
    update: values,
    create: { storeId, ...values },
  });

  revalidatePath("/dashboard/seo");
  revalidatePath(`/store/${store.slug}`, "layout");
  return { ok: true, verification };
}

"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { encryptSecret } from "@/lib/secrets";
import { FEATURE_KEYS, hasFeature } from "@/lib/entitlements";
import { normalizePixelId, PIXEL_ID_PATTERNS, type PixelPlatform } from "@/lib/pixels/shared";
import { loadServerTargets, readPixelRequestContext, sendStoreServerEvent, type ServerEventResult } from "@/lib/pixels/server";

const pixelId = (platform: PixelPlatform, message: string) =>
  z
    .string()
    .optional()
    .default("")
    .transform((v) => normalizePixelId(platform, v))
    .refine((v) => !v || PIXEL_ID_PATTERNS[platform].test(v), message);

const testCode = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => !v || /^[A-Za-z0-9_-]{1,50}$/.test(v), "كود الاختبار مش صحيح");

/** Undefined / empty = keep the saved token. */
const token = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => !v || /^\S{20,600}$/.test(v), "التوكن مش صحيح — انسخه كامل من غير مسافات");

const pixelsSchema = z.object({
  metaPixelId: pixelId("meta", "Meta Pixel ID لازم يكون أرقام بس (من 10 لـ 20 رقم)"),
  tiktokPixelId: pixelId("tiktok", "TikTok Pixel ID مش صحيح — بيبقى حروف وأرقام زي C4ABCD1234EFGH567890"),
  snapPixelId: pixelId("snap", "Snap Pixel ID مش صحيح — بيبقى بالشكل ده: 1a2b3c4d-1234-5678-9abc-1a2b3c4d5e6f"),
  metaTestEventCode: testCode,
  tiktokTestEventCode: testCode,
  metaCapiToken: token,
  tiktokAccessToken: token,
  clearMetaCapiToken: z.boolean().optional().default(false),
  clearTiktokAccessToken: z.boolean().optional().default(false),
});

export type PixelsInput = z.input<typeof pixelsSchema>;
export type PixelsSaveResult = { ok: true } | { ok: false; message: string; field?: string };

export async function SaveStorePixelsAction(storeId: string, input: PixelsInput): Promise<PixelsSaveResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const parsed = pixelsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: issue?.message ?? "في بيانات مش صحيحة", field: issue?.path[0]?.toString() };
  }
  const data = parsed.data;

  // Server-side tracking is a plan feature; browser pixels work on every plan.
  if ((data.metaCapiToken || data.tiktokAccessToken) && !(await hasFeature(store.id, FEATURE_KEYS.META_CAPI))) {
    return { ok: false, message: "التتبع من السيرفر (Conversions API) مش متاح في باقتك. رقّي باقتك عشان تفعّله." };
  }

  const values = {
    metaPixelId: data.metaPixelId || null,
    tiktokPixelId: data.tiktokPixelId || null,
    snapPixelId: data.snapPixelId || null,
    metaTestEventCode: data.metaTestEventCode || null,
    tiktokTestEventCode: data.tiktokTestEventCode || null,
    ...(data.metaCapiToken && { metaCapiTokenEnc: encryptSecret(data.metaCapiToken) }),
    ...(data.clearMetaCapiToken && { metaCapiTokenEnc: null }),
    ...(data.tiktokAccessToken && { tiktokAccessTokenEnc: encryptSecret(data.tiktokAccessToken) }),
    ...(data.clearTiktokAccessToken && { tiktokAccessTokenEnc: null }),
  };

  await prisma.storePixelSettings.upsert({
    where: { storeId: store.id },
    update: values,
    create: { storeId: store.id, ...values },
  });

  revalidatePath("/dashboard/pixels");
  revalidateStorefront(store.slug);
  return { ok: true };
}

export type PixelTestResult = { ok: true; results: ServerEventResult } | { ok: false; message: string };

/** Sends one ViewContent through each configured conversion API and reports what the platform said. */
export async function SendTestPixelEventAction(storeId: string): Promise<PixelTestResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  if (!(await hasFeature(store.id, FEATURE_KEYS.META_CAPI))) {
    return { ok: false, message: "التتبع من السيرفر مش متاح في باقتك." };
  }
  const targets = await loadServerTargets(store.id, { skipPlanCheck: true });
  if (!targets) return { ok: false, message: "احفظ Pixel ID والتوكن الأول." };

  const ctx = await readPixelRequestContext();
  const results = await sendStoreServerEvent(
    {
      storeId: store.id,
      eventName: "ViewContent",
      payload: {
        eventId: `test_${crypto.randomUUID()}`,
        value: 1,
        currency: "EGP",
        contents: [{ id: "casho-test", quantity: 1, price: 1, name: "Casho test event" }],
      },
      eventSourceUrl: ctx.url ?? undefined,
    },
    ctx,
    targets,
  );
  return { ok: true, results };
}

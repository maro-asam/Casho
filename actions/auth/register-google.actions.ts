"use server";

import { SubscriptionStatus } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { verifyPendingGoogleAuth } from "@/lib/auth/pending-google-auth";
import { normalizeStoreSlug } from "@/lib/store/slug";
import { getFreeTrialEndDate } from "@/lib/subscriptions";
import { getFieldErrors } from "@/lib/zod";
import { z } from "zod";
import type { ActionState } from "./auth.types";

const PENDING_COOKIE = "pendingGoogleAuth";

const completeGoogleSchema = z.object({
  storeName: z.string().min(2, "اسم المتجر قصير جداً"),
  country: z.string().min(1, "اختر البلد"),
  businessType: z.string().min(1, "اختر نوع النشاط"),
});

export type CompleteGoogleState = ActionState<{
  storeName?: string;
  country?: string;
  businessType?: string;
}>;

async function getAvailableSlug(tx: typeof prisma, baseSlug: string) {
  const existing = await tx.store.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });
  if (!existing) return baseSlug;
  for (let i = 0; i < 10; i++) {
    const candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const c = await tx.store.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!c) return candidate;
  }
  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function RegisterGoogleAction(
  _prevState: CompleteGoogleState | null,
  formData: FormData,
): Promise<CompleteGoogleState> {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(PENDING_COOKIE)?.value;

  if (!pendingToken) {
    return { error: "انتهت صلاحية جلسة Google، ابدأ من جديد" };
  }

  const googleData = verifyPendingGoogleAuth(pendingToken);
  if (!googleData) {
    return { error: "بيانات Google غير صالحة، ابدأ من جديد" };
  }

  const rawData = {
    storeName: formData.get("storeName")?.toString() ?? "",
    country: formData.get("country")?.toString() ?? "",
    businessType: formData.get("businessType")?.toString() ?? "",
  };

  const parsed = completeGoogleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "يرجى مراجعة البيانات", fieldErrors: getFieldErrors(parsed.error) };
  }

  const { storeName, country, businessType } = parsed.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleData.googleId }, { email: googleData.email }] },
      select: { id: true },
    });

    if (existingUser) {
      await createUserSession(existingUser.id);
      return { success: true, message: "تم تسجيل الدخول" };
    }

    const baseSlug = normalizeStoreSlug(storeName);
    if (!baseSlug) {
      return { error: "اسم المتجر غير صالح", fieldErrors: { storeName: "اكتب اسم متجر صالح" } };
    }

    const freeTrialEndsAt = getFreeTrialEndDate();

    const created = await prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const slug = await getAvailableSlug(tx, baseSlug);
      return tx.user.create({
        data: {
          email: googleData.email,
          name: googleData.name || null,
          googleId: googleData.googleId,
          country,
          businessType,
          stores: {
            create: {
              name: storeName.trim(),
              slug,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionEndsAt: freeTrialEndsAt,
              balance: 0,
              autoRenew: true,
              planSelected: false,
            },
          },
        },
        select: { id: true },
      });
    });

    cookieStore.delete(PENDING_COOKIE);
    await createUserSession(created.id);

    return { success: true, message: "تم إنشاء الحساب بنجاح" };
  } catch (err: unknown) {
    console.error("RegisterGoogleAction error:", err);
    return { error: "حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى" };
  }
}

"use server";

import { getEntryPlan } from "@/lib/billing/renewal";
import { SubscriptionStatus } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { verifyPendingGoogleAuth } from "@/lib/auth/pending-google-auth";
import { normalizeStoreSlug } from "@/lib/store/slug";
import { getFreeTrialEndDate } from "@/lib/subscriptions";
import { getDefaultTrialPlanId } from "@/lib/entitlements";
import { getFieldErrors } from "@/lib/zod";
import { z } from "zod";
import type { ActionState } from "./auth.types";
import { generateReferralCode } from "@/lib/referral";
import { SIGNUP_REF_COOKIE, createSignupAttribution, resolveSignupReferral } from "@/lib/sales/attribution";

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

  // The form field survives a same-page reload; the cookie survives the Google OAuth round trip.
  const refCode = formData.get("refCode")?.toString() || cookieStore.get(SIGNUP_REF_COOKIE)?.value || "";

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
      select: { id: true, googleId: true },
    });

    if (existingUser) {
      // Only an account already linked to this Google identity logs in here.
      // An email/password account with this address must go through the
      // Google sign-in callback, which links it safely.
      if (existingUser.googleId !== googleData.googleId) {
        return { error: "الإيميل ده عليه حساب بالفعل. سجّل دخول بجوجل من صفحة تسجيل الدخول." };
      }
      await createUserSession(existingUser.id);
      return { success: true, message: "تم تسجيل الدخول" };
    }

    // Resolve referrer (merchant referral or sales rep) — validated server-side
    const referral = await resolveSignupReferral(refCode);
    const referredById = referral?.referrerUserId ?? null;

    const baseSlug = normalizeStoreSlug(storeName);
    if (!baseSlug) {
      return { error: "اسم المتجر غير صالح", fieldErrors: { storeName: "اكتب اسم متجر صالح" } };
    }

    const now = new Date();
    const trialEndsAt = getFreeTrialEndDate(now);
    const trialPlanId = await getDefaultTrialPlanId();
    // Trial runs on Platinum; afterwards a store that never picked a plan pays the entry plan.
    const entryPlan = await getEntryPlan();

    const created = await prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const slug = await getAvailableSlug(tx, baseSlug);
      const user = await tx.user.create({
        data: {
          email: googleData.email,
          name: googleData.name || null,
          googleId: googleData.googleId,
          // Google only hands out verified emails (checked in the callback).
          emailVerified: true,
          country,
          businessType,
          referralCode: generateReferralCode(),
          referredById: referredById || null,
          stores: {
            create: {
              name: storeName.trim(),
              slug,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionEndsAt: trialEndsAt,
              trialStartDate: now,
              trialEndDate: trialEndsAt,
              onboardingCompleted: false,
              balance: 0,
              autoRenew: true,
              planSelected: false,
              planId: trialPlanId,
              ...(entryPlan && { monthlyPrice: entryPlan.monthlyPrice }),
            },
          },
        },
        select: { id: true },
      });
      await createSignupAttribution(tx, { customerUserId: user.id, referral, signedUpAt: now });
      return user;
    });

    cookieStore.delete(PENDING_COOKIE);
    cookieStore.delete(SIGNUP_REF_COOKIE);
    await createUserSession(created.id);

    return { success: true, message: "تم إنشاء الحساب بنجاح" };
  } catch (err: unknown) {
    console.error("RegisterGoogleAction error:", err);
    return { error: "حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى" };
  }
}

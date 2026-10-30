"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { syncStorePricesFromPlans } from "@/lib/billing/sync-prices";
import { requireAdmin } from "./admin-guard.actions";
import { FeatureType } from "@prisma/client";

const KEY_RE = /^[A-Z][A-Z0-9_]{1,30}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FEATURE_KEY_RE = /^[a-z][a-z0-9_]{1,40}$/;

function isUniqueViolation(error: unknown) {
  return (error as { code?: string } | null)?.code === "P2002";
}

function validatePrices(input: { monthlyPrice: number; yearlyPrice: number }) {
  for (const v of [input.monthlyPrice, input.yearlyPrice]) {
    if (!Number.isInteger(v) || v < 0) return "الأسعار لازم تكون أرقام موجبة";
  }
  return null;
}

function revalidatePlanPaths() {
  revalidatePath("/admin/plans");
  revalidatePath("/admin/features");
  revalidatePath("/dashboard/change-plan");
  // The landing page's pricing section is cached.
  revalidatePath("/");
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function GetPlansForAdminAction() {
  await requireAdmin();
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { stores: true } } },
  });
}

export async function GetFeaturesForAdminAction() {
  await requireAdmin();
  return prisma.feature.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function GetPlanWithFeaturesForAdminAction(planId: string) {
  await requireAdmin();
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { planFeatures: true },
  });
  if (!plan) throw new Error("الباقة غير موجودة");

  const features = await prisma.feature.findMany({ orderBy: { sortOrder: "asc" } });
  const planFeatureByFeatureId = new Map(plan.planFeatures.map((pf) => [pf.featureId, pf]));

  return {
    plan,
    rows: features.map((feature) => ({
      feature,
      planFeature: planFeatureByFeatureId.get(feature.id) ?? null,
    })),
  };
}

/** Active subscriptions grouped by plan — spec section 18 "View active subscriptions". */
export async function GetPlanSubscriptionsOverviewAction() {
  await requireAdmin();

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const counts = await prisma.store.groupBy({
    by: ["planId", "billingCycle", "subscriptionStatus"],
    _count: { _all: true },
  });

  return plans.map((plan) => ({
    plan,
    byStatus: counts.filter((c) => c.planId === plan.id),
  }));
}

// ─── Plan mutations ─────────────────────────────────────────────────────────

export type PlanFormInput = {
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  originalMonthlyPrice: number | null;
  originalYearlyPrice: number | null;
  discountPercent: number | null;
  isActive: boolean;
  sortOrder: number;
  pricingConfigured: boolean;
};

export async function UpdatePlanAction(planId: string, input: PlanFormInput) {
  const admin = await requireAdmin();

  if (!input.name?.trim()) return { success: false, message: "اسم الباقة مطلوب" };
  const priceError = validatePrices(input);
  if (priceError) return { success: false, message: priceError };

  const before = await prisma.plan.findUnique({ where: { id: planId } });
  if (!before) return { success: false, message: "الباقة غير موجودة" };

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.plan.update({ where: { id: planId }, data: input });
    await tx.planAuditLog.create({
      data: {
        actorUserId: admin.id,
        planId,
        action: "plan_updated",
        before,
        after: updated,
      },
    });
    return updated;
  });

  // Prices / order / visibility drive what every store pays next — keep the
  // stores' cached prices in step and warn merchants whose price moved.
  const { updated } = await syncStorePricesFromPlans();

  revalidatePlanPaths();
  return {
    success: true,
    message: updated > 0 ? `تم حفظ الباقة — اتحدّث سعر التجديد لـ ${updated} متجر واتبعتلهم إشعار` : "تم حفظ الباقة",
    plan: after,
  };
}

export type CreatePlanInput = PlanFormInput & { key: string; slug: string };

export async function CreatePlanAction(input: CreatePlanInput) {
  const admin = await requireAdmin();

  if (!input.name?.trim()) return { success: false, message: "اسم الباقة مطلوب" };
  if (!KEY_RE.test(input.key)) return { success: false, message: "الكود لازم يكون حروف إنجليزي كابيتال وأرقام، زي GOLD" };
  if (!SLUG_RE.test(input.slug)) return { success: false, message: "الرابط لازم يكون حروف إنجليزي صغيرة وشرطات، زي gold" };
  const priceError = validatePrices(input);
  if (priceError) return { success: false, message: priceError };

  try {
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({ data: input });
      await tx.planAuditLog.create({
        data: { actorUserId: admin.id, planId: created.id, action: "plan_created", after: created },
      });
      return created;
    });

    await syncStorePricesFromPlans();
    revalidatePlanPaths();
    return { success: true, message: "تم إنشاء الباقة", plan };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false, message: "فيه باقة بنفس الكود أو الرابط" };
    throw error;
  }
}

// ─── Feature mutations ──────────────────────────────────────────────────────

export type FeatureFormInput = {
  name: string;
  description: string | null;
  unit: string | null;
  isActive: boolean;
  sortOrder: number;
};

export async function UpdateFeatureAction(featureId: string, input: FeatureFormInput) {
  const admin = await requireAdmin();

  const before = await prisma.feature.findUnique({ where: { id: featureId } });
  if (!before) return { success: false, message: "الميزة غير موجودة" };

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.feature.update({ where: { id: featureId }, data: input });
    await tx.planAuditLog.create({
      data: { actorUserId: admin.id, action: "feature_updated", before, after: updated },
    });
    return updated;
  });

  revalidatePlanPaths();
  return { success: true, message: "تم حفظ الميزة", feature: after };
}

export type CreateFeatureInput = FeatureFormInput & { key: string; type: FeatureType };

export async function CreateFeatureAction(input: CreateFeatureInput) {
  const admin = await requireAdmin();

  if (!input.name?.trim()) return { success: false, message: "اسم الميزة مطلوب" };
  if (!FEATURE_KEY_RE.test(input.key)) return { success: false, message: "المفتاح لازم يكون حروف إنجليزي صغيرة وأرقام و _، زي custom_domain" };
  if (!(Object.values(FeatureType) as string[]).includes(input.type)) return { success: false, message: "نوع الميزة غير صحيح" };

  try {
    const feature = await prisma.$transaction(async (tx) => {
      const created = await tx.feature.create({ data: input });
      await tx.planAuditLog.create({
        data: { actorUserId: admin.id, action: "feature_created", after: created },
      });
      return created;
    });

    revalidatePlanPaths();
    return { success: true, message: "تم إنشاء الميزة", feature };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false, message: "فيه ميزة بنفس المفتاح" };
    throw error;
  }
}

// ─── Plan × Feature matrix (spec section 19) ────────────────────────────────

export type PlanFeatureFormInput = {
  enabled: boolean;
  limitValue: number | null;
  isUnlimited: boolean;
};

export async function UpsertPlanFeatureAction(
  planId: string,
  featureId: string,
  input: PlanFeatureFormInput,
) {
  const admin = await requireAdmin();

  const before = await prisma.planFeature.findUnique({ where: { planId_featureId: { planId, featureId } } });

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.planFeature.upsert({
      where: { planId_featureId: { planId, featureId } },
      create: { planId, featureId, ...input },
      update: input,
    });
    await tx.planAuditLog.create({
      data: {
        actorUserId: admin.id,
        planId,
        action: "plan_feature_updated",
        before: before ?? undefined,
        after: updated,
      },
    });
    return updated;
  });

  revalidatePlanPaths();
  return { success: true, message: "تم الحفظ", planFeature: after };
}

"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  SalesAttributionSource,
  SalesCommissionStatus,
  SalesRepStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard.actions";
import { hashPassword } from "@/lib/auth/password";
import { generateReferralCode } from "@/lib/referral";
import { syncSalesCommissionsForCustomer } from "@/lib/sales/engine";
import { getPayableItems } from "@/lib/sales/queries";
import {
  COMMISSION_ACTIONS,
  canApplyCommissionAction,
  canCancelRepAdjustment,
  signedRepAdjustment,
  validateAdjustment,
} from "@/lib/sales/workflow";
import { SALES_CURRENCY } from "@/lib/sales/rules";
import {
  assignCustomerSchema,
  cancelRepAdjustmentSchema,
  commissionActionSchema,
  commissionAdjustmentSchema,
  commissionRuleSchema,
  createSalesRepSchema,
  recordPayoutSchema,
  repAdjustmentSchema,
  setSalesRepStatusSchema,
  updateSalesRepSchema,
} from "@/validations/sales.schema";

export type SalesActionResult = { success: boolean; message: string; fieldErrors?: Record<string, string> };

function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }): SalesActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { success: false, message: Object.values(fieldErrors)[0] ?? "راجع البيانات", fieldErrors };
}

function revalidateSales() {
  revalidatePath("/admin/sales", "layout");
  revalidatePath("/sales", "layout");
}

function audit(
  tx: Prisma.TransactionClient,
  data: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    salesRepId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    reason?: string | null;
  },
) {
  return tx.salesAuditLog.create({ data });
}

// ─── Sales accounts ─────────────────────────────────────────────────────────

/** The only way to get the SALES role. Always a brand-new account — existing merchants are never converted. */
export async function createSalesRepAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = createSalesRepSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { name, email, phone, password, notes, joinCampaign } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone_number: phone }] : [])] },
    select: { email: true },
  });
  if (existing) {
    return existing.email === email
      ? { success: false, message: "البريد مستخدم لحساب تاني", fieldErrors: { email: "البريد مستخدم بالفعل" } }
      : { success: false, message: "رقم الموبايل مستخدم لحساب تاني", fieldErrors: { phone: "الرقم مستخدم بالفعل" } };
  }

  let joined: string | null = null;
  try {
    const hashed = await hashPassword(password);
    joined = await prisma.$transaction(async (tx): Promise<string | null> => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          phone_number: phone || null,
          password: hashed,
          passwordAlgo: "argon2id",
          role: UserRole.SALES,
          referralCode: generateReferralCode(),
        },
        select: { id: true, referralCode: true },
      });
      const rep = await tx.salesRep.create({
        data: { userId: user.id, notes: notes || null, createdById: admin.id },
        select: { id: true },
      });
      await audit(tx, {
        actorUserId: admin.id,
        action: "sales_rep_created",
        entityType: "SalesRep",
        entityId: rep.id,
        salesRepId: rep.id,
        after: { email, name, referralCode: user.referralCode },
      });

      // Optional: take a seat in the campaign that hasn't ended yet.
      if (joinCampaign === "on") {
        const campaign = await tx.salesCampaign.findFirst({
          where: { endsAt: { gt: new Date() } },
          orderBy: { startsAt: "asc" },
          select: { id: true, name: true, maxMembers: true },
        });
        if (campaign) {
          await tx.$queryRaw`SELECT "id" FROM "SalesCampaign" WHERE "id" = ${campaign.id} FOR UPDATE`;
          const seated = await tx.salesCampaignMember.count({ where: { campaignId: campaign.id } });
          if (seated < campaign.maxMembers) {
            await tx.salesCampaignMember.create({ data: { campaignId: campaign.id, salesRepId: rep.id, createdById: admin.id } });
            await audit(tx, {
              actorUserId: admin.id,
              action: "campaign_member_added",
              entityType: "SalesCampaign",
              entityId: campaign.id,
              salesRepId: rep.id,
            });
            return campaign.name;
          }
        }
      }
      return null;
    });
  } catch (error) {
    console.error("createSalesRepAction", error);
    return { success: false, message: "حصلت مشكلة وإحنا بنعمل الحساب، جرّب تاني" };
  }

  revalidateSales();
  if (joinCampaign === "on" && !joined) return { success: true, message: "تم إنشاء الحساب — بس العرض كامل فماتضافش له" };
  return { success: true, message: joined ? `تم إنشاء الحساب وانضم لـ${joined}` : "تم إنشاء حساب المندوب" };
}

/**
 * Name, email, phone and notes. A new email becomes the rep's login right away:
 * it starts unverified, the Google account linked to the old address is
 * unlinked, and reset links / codes sent to the old inbox stop working.
 * Sessions stay open; the referral code never changes.
 */
export async function updateSalesRepAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = updateSalesRepSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { salesRepId, name, email, phone, notes } = parsed.data;

  const rep = await prisma.salesRep.findUnique({
    where: { id: salesRepId },
    select: { id: true, notes: true, user: { select: { id: true, name: true, email: true, phone_number: true } } },
  });
  if (!rep) return { success: false, message: "المندوب مش موجود" };

  const emailChanged = email !== rep.user.email.toLowerCase();
  if (emailChanged) {
    const taken = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, id: { not: rep.user.id } },
      select: { id: true },
    });
    if (taken) return { success: false, message: "البريد مستخدم لحساب تاني", fieldErrors: { email: "البريد مستخدم بالفعل" } };
  }
  if (phone && phone !== rep.user.phone_number) {
    const taken = await prisma.user.findFirst({ where: { phone_number: phone, id: { not: rep.user.id } }, select: { id: true } });
    if (taken) return { success: false, message: "رقم الموبايل مستخدم لحساب تاني", fieldErrors: { phone: "الرقم مستخدم بالفعل" } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: rep.user.id },
        data: {
          name,
          phone_number: phone || null,
          ...(emailChanged && { email, emailVerified: false, googleId: null }),
        },
      });
      if (emailChanged) {
        await tx.passwordResetToken.deleteMany({ where: { userId: rep.user.id } });
        await tx.emailVerificationCode.deleteMany({ where: { userId: rep.user.id } });
      }
      await tx.salesRep.update({ where: { id: rep.id }, data: { notes: notes || null } });
      await audit(tx, {
        actorUserId: admin.id,
        action: emailChanged ? "sales_rep_email_changed" : "sales_rep_updated",
        entityType: "SalesRep",
        entityId: rep.id,
        salesRepId: rep.id,
        before: { name: rep.user.name, email: rep.user.email, phone: rep.user.phone_number, notes: rep.notes },
        after: { name, email, phone: phone || null, notes: notes || null },
        reason: emailChanged ? `من ${rep.user.email} إلى ${email}` : null,
      });
    });
  } catch (error) {
    // Two admins (or a signup) grabbed the same email/phone between the check and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      return target.includes("phone")
        ? { success: false, message: "رقم الموبايل مستخدم لحساب تاني", fieldErrors: { phone: "الرقم مستخدم بالفعل" } }
        : { success: false, message: "البريد مستخدم لحساب تاني", fieldErrors: { email: "البريد مستخدم بالفعل" } };
    }
    throw error;
  }

  revalidateSales();
  return { success: true, message: emailChanged ? "تم حفظ البيانات — المندوب يدخل بالبريد الجديد من دلوقتي" : "تم حفظ البيانات" };
}

/** Disabling ends every session at once; history and attributions are kept. */
export async function setSalesRepStatusAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = setSalesRepStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { salesRepId, status, reason } = parsed.data;

  const rep = await prisma.salesRep.findUnique({ where: { id: salesRepId }, select: { id: true, status: true, userId: true } });
  if (!rep) return { success: false, message: "المندوب مش موجود" };
  if (rep.status === status) return { success: true, message: "الحالة متغيّرتش" };

  await prisma.$transaction(async (tx) => {
    await tx.salesRep.update({
      where: { id: rep.id },
      data: { status, disabledAt: status === SalesRepStatus.DISABLED ? new Date() : null },
    });
    if (status === SalesRepStatus.DISABLED) await tx.session.deleteMany({ where: { userId: rep.userId } });
    await audit(tx, {
      actorUserId: admin.id,
      action: status === SalesRepStatus.DISABLED ? "sales_rep_disabled" : "sales_rep_enabled",
      entityType: "SalesRep",
      entityId: rep.id,
      salesRepId: rep.id,
      before: { status: rep.status },
      after: { status },
      reason,
    });
  });

  revalidateSales();
  return { success: true, message: status === SalesRepStatus.DISABLED ? "تم إيقاف المندوب" : "تم تفعيل المندوب" };
}

// ─── Attribution disputes ───────────────────────────────────────────────────

/**
 * Assigns or re-assigns a merchant to a rep. Earned commissions stay with the
 * rep who earned them; only charges after this moment go to the new rep.
 */
export async function assignCustomerToSalesRepAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = assignCustomerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { customerUserId, customerEmail, toSalesRepId, reason } = parsed.data;

  const customer = await prisma.user.findFirst({
    where: customerUserId ? { id: customerUserId } : { email: customerEmail },
    select: { id: true, role: true, createdAt: true },
  });
  if (!customer) return { success: false, message: "مش لاقيين العميل ده", fieldErrors: { customerEmail: "مفيش حساب بالبريد ده" } };
  if (customer.role !== UserRole.USER) return { success: false, message: "الحساب ده مش حساب تاجر" };

  const target = await prisma.salesRep.findUnique({ where: { id: toSalesRepId }, select: { id: true, status: true } });
  if (!target) return { success: false, message: "المندوب مش موجود" };
  if (target.status !== SalesRepStatus.ACTIVE) return { success: false, message: "مينفعش تنسب عملاء لمندوب موقوف" };

  const outcome = await prisma.$transaction(async (tx) => {
    const existing = await tx.salesAttribution.findUnique({ where: { customerUserId: customer.id }, select: { id: true } });
    if (existing) await tx.$queryRaw`SELECT "id" FROM "SalesAttribution" WHERE "id" = ${existing.id} FOR UPDATE`;
    const current = existing
      ? await tx.salesAttribution.findUniqueOrThrow({ where: { id: existing.id }, select: { id: true, salesRepId: true } })
      : null;

    if (current?.salesRepId === target.id) return "same" as const;

    const attribution =
      current ??
      (await tx.salesAttribution.create({
        data: {
          customerUserId: customer.id,
          salesRepId: target.id,
          originalSalesRepId: target.id,
          source: SalesAttributionSource.ADMIN,
          signedUpAt: customer.createdAt,
        },
        select: { id: true, salesRepId: true },
      }));

    if (current) await tx.salesAttribution.update({ where: { id: current.id }, data: { salesRepId: target.id } });

    await tx.salesAttributionChange.create({
      data: {
        attributionId: attribution.id,
        fromSalesRepId: current?.salesRepId ?? null,
        toSalesRepId: target.id,
        actorUserId: admin.id,
        reason,
      },
    });
    await audit(tx, {
      actorUserId: admin.id,
      action: current ? "attribution_reassigned" : "attribution_assigned",
      entityType: "SalesAttribution",
      entityId: attribution.id,
      salesRepId: target.id,
      before: { salesRepId: current?.salesRepId ?? null },
      after: { salesRepId: target.id, customerUserId: customer.id },
      reason,
    });
    return current ? ("reassigned" as const) : ("assigned" as const);
  });

  if (outcome === "same") return { success: false, message: "العميل منسوب للمندوب ده بالفعل" };

  // Fills acquisition dates for a customer who already paid (no retroactive commissions).
  await syncSalesCommissionsForCustomer(customer.id).catch((e) => console.error("[sales] assign sync", e));
  revalidateSales();
  return { success: true, message: outcome === "reassigned" ? "تم نقل العميل للمندوب الجديد" : "تم نسب العميل للمندوب" };
}

// ─── Commission review ──────────────────────────────────────────────────────

export async function updateCommissionStatusAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = commissionActionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { commissionId, action, reason } = parsed.data;
  const rule = COMMISSION_ACTIONS[action];

  if (rule.reasonRequired && (!reason || reason.length < 5)) {
    return { success: false, message: "اكتب سبب واضح (5 أحرف على الأقل)", fieldErrors: { reason: "السبب مطلوب" } };
  }

  const commission = await prisma.salesCommission.findUnique({
    where: { id: commissionId },
    select: { id: true, status: true, salesRepId: true },
  });
  if (!commission) return { success: false, message: "العمولة مش موجودة" };
  if (!canApplyCommissionAction(commission.status, action)) {
    return { success: false, message: "الإجراء ده مش متاح للحالة الحالية" };
  }

  const done = await prisma.$transaction(async (tx) => {
    // Conditional update: a concurrent change (or a payout) makes this a no-op.
    const res = await tx.salesCommission.updateMany({
      where: { id: commission.id, status: { in: [...rule.from] }, payoutId: null },
      data: { status: rule.to, statusReason: reason || null },
    });
    if (res.count !== 1) return false;
    await audit(tx, {
      actorUserId: admin.id,
      action: `commission_${action}`,
      entityType: "SalesCommission",
      entityId: commission.id,
      salesRepId: commission.salesRepId,
      before: { status: commission.status },
      after: { status: rule.to },
      reason: reason || null,
    });
    return true;
  });

  if (!done) return { success: false, message: "حالة العمولة اتغيرت — حدّث الصفحة" };
  revalidateSales();
  return { success: true, message: "تم تحديث العمولة" };
}

export async function createCommissionAdjustmentAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = commissionAdjustmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { commissionId, amountEgp, reason } = parsed.data;
  const amount = Math.round(amountEgp * 100);

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SalesCommission" WHERE "id" = ${commissionId} FOR UPDATE`;
    if (!locked.length) return "العمولة مش موجودة";

    const commission = await tx.salesCommission.findUniqueOrThrow({
      where: { id: commissionId },
      select: { id: true, status: true, amount: true, salesRepId: true, adjustments: { select: { amount: true } } },
    });
    const currentNet = commission.amount + commission.adjustments.reduce((s, a) => s + a.amount, 0);
    const error = validateAdjustment({ status: commission.status, amount, currentNet });
    if (error) return error;

    const adjustment = await tx.salesCommissionAdjustment.create({
      data: {
        commissionId: commission.id,
        salesRepId: commission.salesRepId,
        amount,
        currency: SALES_CURRENCY,
        source: "ADMIN",
        reason,
        actorUserId: admin.id,
      },
      select: { id: true },
    });
    await audit(tx, {
      actorUserId: admin.id,
      action: "adjustment_created",
      entityType: "SalesCommission",
      entityId: commission.id,
      salesRepId: commission.salesRepId,
      before: { net: currentNet },
      after: { adjustmentId: adjustment.id, amount, net: currentNet + amount },
      reason,
    });
    return null;
  });

  if (result) return { success: false, message: result };
  revalidateSales();
  return { success: true, message: "تم تسجيل التعديل" };
}

// ─── Bonuses & deductions ───────────────────────────────────────────────────

/** A bonus or deduction on the rep's account (not tied to a commission). Payable at once; the next payout settles it. */
export async function createRepAdjustmentAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = repAdjustmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { salesRepId, kind, amountEgp, reason } = parsed.data;
  const amount = signedRepAdjustment(kind, Math.round(amountEgp * 100));

  const result = await prisma.$transaction(async (tx) => {
    // Same lock as payouts: the entry lands either before a payout's snapshot or after it, never half-way.
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SalesRep" WHERE "id" = ${salesRepId} FOR UPDATE`;
    if (!locked.length) return "المندوب مش موجود";

    const row = await tx.salesRepAdjustment.create({
      data: { salesRepId, kind, amount, currency: SALES_CURRENCY, reason, actorUserId: admin.id },
      select: { id: true },
    });
    await audit(tx, {
      actorUserId: admin.id,
      action: kind === "BONUS" ? "rep_bonus_added" : "rep_deduction_added",
      entityType: "SalesRepAdjustment",
      entityId: row.id,
      salesRepId,
      after: { kind, amount, currency: SALES_CURRENCY },
      reason,
    });
    return null;
  });

  if (result) return { success: false, message: result };
  revalidateSales();
  return { success: true, message: kind === "BONUS" ? "تمت إضافة المكافأة" : "تم تسجيل الخصم" };
}

/** Cancels a bonus/deduction that no payout has settled yet. A settled one is corrected with an opposite entry. */
export async function cancelRepAdjustmentAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = cancelRepAdjustmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { adjustmentId, reason } = parsed.data;

  const row = await prisma.salesRepAdjustment.findUnique({
    where: { id: adjustmentId },
    select: { id: true, salesRepId: true, kind: true, amount: true, canceledAt: true, payoutId: true },
  });
  if (!row) return { success: false, message: "البند مش موجود" };
  if (!canCancelRepAdjustment(row)) {
    return { success: false, message: row.canceledAt ? "البند ده ملغي بالفعل" : "البند اتصرف خلاص — سجّل بند عكسي بدل الإلغاء" };
  }

  const done = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "SalesRep" WHERE "id" = ${row.salesRepId} FOR UPDATE`;
    // Conditional: a payout (or another cancel) that got there first makes this a no-op.
    const res = await tx.salesRepAdjustment.updateMany({
      where: { id: row.id, canceledAt: null, payoutId: null },
      data: { canceledAt: new Date(), canceledById: admin.id, cancelReason: reason },
    });
    if (res.count !== 1) return false;
    await audit(tx, {
      actorUserId: admin.id,
      action: "rep_adjustment_canceled",
      entityType: "SalesRepAdjustment",
      entityId: row.id,
      salesRepId: row.salesRepId,
      before: { kind: row.kind, amount: row.amount },
      after: { canceled: true },
      reason,
    });
    return true;
  });

  if (!done) return { success: false, message: "البند اتغيّر — حدّث الصفحة" };
  revalidateSales();
  return { success: true, message: row.kind === "BONUS" ? "تم إلغاء المكافأة" : "تم إلغاء الخصم" };
}

// ─── Payouts ────────────────────────────────────────────────────────────────

/**
 * Records a transfer that already happened outside Casho. Settles every payable
 * item of the rep atomically; refuses if the payable total changed since the
 * admin looked at it.
 */
export async function recordSalesPayoutAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = recordPayoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { salesRepId, expectedTotal, paidAt, method, reference, note } = parsed.data;

  if (paidAt.getTime() > Date.now() + 60_000) {
    return { success: false, message: "تاريخ الصرف مينفعش يكون في المستقبل", fieldErrors: { paidAt: "تاريخ في المستقبل" } };
  }

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SalesRep" WHERE "id" = ${salesRepId} FOR UPDATE`;
    if (!locked.length) return { error: "المندوب مش موجود" };

    const payable = await getPayableItems(tx, salesRepId);
    if (payable.total <= 0) return { error: "مفيش مبلغ مستحق للصرف" };
    if (payable.total !== expectedTotal) return { error: "المبلغ المستحق اتغيّر — حدّث الصفحة وراجع تاني" };

    const payout = await tx.salesPayout.create({
      data: {
        salesRepId,
        amount: payable.total,
        currency: SALES_CURRENCY,
        paidAt,
        method,
        reference: reference || null,
        note: note || null,
        recordedById: admin.id,
      },
      select: { id: true },
    });

    const settled = await tx.salesCommission.updateMany({
      where: { id: { in: payable.commissionIds }, status: SalesCommissionStatus.APPROVED, payoutId: null },
      data: { status: SalesCommissionStatus.PAID, payoutId: payout.id },
    });
    if (settled.count !== payable.commissionIds.length) throw new Error("Payable commissions changed during payout");
    if (payable.adjustmentIds.length) {
      await tx.salesCommissionAdjustment.updateMany({ where: { id: { in: payable.adjustmentIds }, payoutId: null }, data: { payoutId: payout.id } });
    }
    if (payable.repAdjustmentIds.length) {
      const res = await tx.salesRepAdjustment.updateMany({
        where: { id: { in: payable.repAdjustmentIds }, payoutId: null, canceledAt: null },
        data: { payoutId: payout.id },
      });
      if (res.count !== payable.repAdjustmentIds.length) throw new Error("Bonuses/deductions changed during payout");
    }

    await audit(tx, {
      actorUserId: admin.id,
      action: "payout_recorded",
      entityType: "SalesPayout",
      entityId: payout.id,
      salesRepId,
      after: {
        amount: payable.total,
        currency: SALES_CURRENCY,
        paidAt: paidAt.toISOString(),
        method,
        reference: reference || null,
        commissions: payable.commissionIds.length,
        adjustments: payable.adjustmentIds.length,
        repAdjustments: payable.repAdjustmentIds.length,
      },
      reason: note || null,
    });
    return { error: null };
  });

  if (result.error) return { success: false, message: result.error };
  revalidateSales();
  return { success: true, message: "تم تسجيل الصرف" };
}

// ─── Commission rules ───────────────────────────────────────────────────────

/** Appends a new rule set effective now. Existing commissions keep their snapshot. */
export async function updateCommissionRulesAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = commissionRuleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const bps = (pct: number) => Math.round(pct * 100);

  await prisma.$transaction(async (tx) => {
    const rule = await tx.salesCommissionRule.create({
      data: {
        starterRateBps: bps(d.starterRate),
        growthRateBps: bps(d.growthRate),
        proRateBps: bps(d.proRate),
        renewalRateBps: bps(d.renewalRate),
        starterMaxPosition: d.starterMaxPosition,
        growthMaxPosition: d.growthMaxPosition,
        eligibilityMonths: d.eligibilityMonths,
        createdById: admin.id,
        note: d.note,
      },
      select: { id: true },
    });
    await audit(tx, {
      actorUserId: admin.id,
      action: "commission_rules_updated",
      entityType: "SalesCommissionRule",
      entityId: rule.id,
      after: { ...d },
      reason: d.note,
    });
  });

  revalidateSales();
  return { success: true, message: "تم حفظ القواعد الجديدة — هتنطبق على العمولات الجاية بس" };
}

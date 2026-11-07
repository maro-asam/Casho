"use server";

import { revalidatePath } from "next/cache";
import { Prisma, SalesRepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./admin-guard.actions";
import { campaignWindowFromDays } from "@/lib/sales/campaign";
import { cairoDayStart } from "@/lib/sales/rules";
import {
  announcementSchema,
  campaignMemberSchema,
  campaignSchema,
  deleteAnnouncementSchema,
  removeCampaignMemberSchema,
} from "@/validations/sales.schema";
import type { SalesActionResult } from "./sales.actions";

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

const bps = (percent: number) => Math.round(percent * 100);

// ─── Campaign ───────────────────────────────────────────────────────────────

/**
 * Edits the campaign's dates and terms. Commissions already earned keep their
 * snapshot; the new terms apply to payments synced from now on.
 */
export async function updateCampaignAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const window = campaignWindowFromDays(d.firstDay, d.lastDay);
  if (!window) return { success: false, message: "آخر يوم لازم يكون بعد أول يوم أو نفسه", fieldErrors: { lastDay: "تاريخ غير صحيح" } };

  const before = await prisma.salesCampaign.findUnique({ where: { id: d.campaignId }, include: { _count: { select: { members: true } } } });
  if (!before) return { success: false, message: "العرض مش موجود" };
  if (d.maxMembers < before._count.members) {
    return { success: false, message: `فيه ${before._count.members} مندوبين في العرض — شيل حد الأول`, fieldErrors: { maxMembers: "أقل من المشتركين" } };
  }

  const data = {
    name: d.name,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    baseRateBps: bps(d.baseRate),
    pharmacyRateBps: bps(d.pharmacyRate),
    posRateBps: bps(d.posRate),
    bonusTarget: d.bonusTarget,
    bonusAmount: d.bonusEgp * 100,
    maxMembers: d.maxMembers,
  };

  await prisma.$transaction(async (tx) => {
    await tx.salesCampaign.update({ where: { id: before.id }, data });
    await tx.salesAuditLog.create({
      data: {
        actorUserId: admin.id,
        action: "campaign_updated",
        entityType: "SalesCampaign",
        entityId: before.id,
        before: {
          name: before.name,
          startsAt: before.startsAt.toISOString(),
          endsAt: before.endsAt.toISOString(),
          baseRateBps: before.baseRateBps,
          pharmacyRateBps: before.pharmacyRateBps,
          posRateBps: before.posRateBps,
          bonusTarget: before.bonusTarget,
          bonusAmount: before.bonusAmount,
          maxMembers: before.maxMembers,
        },
        after: { ...data, startsAt: data.startsAt.toISOString(), endsAt: data.endsAt.toISOString() },
      },
    });
  });

  revalidateSales();
  return { success: true, message: "تم حفظ العرض" };
}

/** Adds an active rep to the campaign, within its seat limit. */
export async function addCampaignMemberAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = campaignMemberSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { campaignId, salesRepId } = parsed.data;

  const rep = await prisma.salesRep.findUnique({ where: { id: salesRepId }, select: { status: true } });
  if (!rep || rep.status !== SalesRepStatus.ACTIVE) return { success: false, message: "المندوب مش موجود أو موقوف" };

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Serialise seat checks for this campaign.
      await tx.$queryRaw`SELECT "id" FROM "SalesCampaign" WHERE "id" = ${campaignId} FOR UPDATE`;
      const campaign = await tx.salesCampaign.findUnique({ where: { id: campaignId }, select: { maxMembers: true, _count: { select: { members: true } } } });
      if (!campaign) return "missing" as const;
      if (campaign._count.members >= campaign.maxMembers) return "full" as const;
      const member = await tx.salesCampaignMember.create({ data: { campaignId, salesRepId, createdById: admin.id }, select: { id: true } });
      await tx.salesAuditLog.create({
        data: { actorUserId: admin.id, action: "campaign_member_added", entityType: "SalesCampaign", entityId: campaignId, salesRepId, after: { memberId: member.id } },
      });
      return "ok" as const;
    });
    if (outcome === "missing") return { success: false, message: "العرض مش موجود" };
    if (outcome === "full") return { success: false, message: "العرض كامل — مفيش أماكن فاضية" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "المندوب ده في العرض بالفعل" };
    }
    throw error;
  }

  revalidateSales();
  return { success: true, message: "اتضاف للعرض" };
}

/** Takes a rep out: later payments go back to the normal rules; earned commissions stay. */
export async function removeCampaignMemberAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = removeCampaignMemberSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const member = await prisma.salesCampaignMember.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, campaignId: true, salesRepId: true, bonusAwardedAt: true } });
  if (!member) return { success: false, message: "مش موجود في العرض" };

  await prisma.$transaction(async (tx) => {
    await tx.salesCampaignMember.delete({ where: { id: member.id } });
    await tx.salesAuditLog.create({
      data: {
        actorUserId: admin.id,
        action: "campaign_member_removed",
        entityType: "SalesCampaign",
        entityId: member.campaignId,
        salesRepId: member.salesRepId,
        before: { memberId: member.id, bonusAwardedAt: member.bonusAwardedAt?.toISOString() ?? null },
      },
    });
  });

  revalidateSales();
  return { success: true, message: "اتشال من العرض" };
}

// ─── Announcements ──────────────────────────────────────────────────────────

function expiresAtFor(day: string | undefined): Date | null {
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  return cairoDayStart(y, m, d + 1); // shows through the end of that Cairo day
}

export async function saveAnnouncementAction(input: unknown): Promise<SalesActionResult> {
  const admin = await requireAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, title, body, tone, pinned, expiresOn } = parsed.data;

  const data = { title, body, tone, pinned: pinned === "on" || pinned === "true", expiresAt: expiresAtFor(expiresOn || undefined) };

  if (id) {
    const updated = await prisma.salesAnnouncement.updateMany({ where: { id }, data });
    if (updated.count === 0) return { success: false, message: "الإعلان مش موجود" };
  } else {
    await prisma.salesAnnouncement.create({ data: { ...data, createdById: admin.id } });
  }

  revalidateSales();
  return { success: true, message: id ? "تم تعديل الإعلان" : "الإعلان اتنشر للمندوبين" };
}

export async function deleteAnnouncementAction(input: unknown): Promise<SalesActionResult> {
  await requireAdmin();
  const parsed = deleteAnnouncementSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await prisma.salesAnnouncement.deleteMany({ where: { id: parsed.data.id } });
  revalidateSales();
  return { success: true, message: "اتمسح الإعلان" };
}

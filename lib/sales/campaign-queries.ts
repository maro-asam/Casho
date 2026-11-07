import { SalesCommissionKind, SalesCommissionStatus, SalesRepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Read models for campaigns and the announcements board. Rep reads take the
 * rep id from requireSalesRep(), never from the request.
 */

const VOID: SalesCommissionStatus[] = [SalesCommissionStatus.REJECTED, SalesCommissionStatus.REVERSED];

const CAMPAIGN_FIELDS = {
  id: true,
  name: true,
  startsAt: true,
  endsAt: true,
  baseRateBps: true,
  pharmacyRateBps: true,
  posRateBps: true,
  bonusTarget: true,
  bonusAmount: true,
  maxMembers: true,
} as const;

/** The rep's campaign that hasn't ended (running or about to start), with their progress. */
export async function getRepCampaign(salesRepId: string, now = new Date()) {
  const member = await prisma.salesCampaignMember.findFirst({
    where: { salesRepId, campaign: { endsAt: { gt: now } } },
    orderBy: { campaign: { startsAt: "asc" } },
    select: { bonusAwardedAt: true, campaign: { select: CAMPAIGN_FIELDS } },
  });
  if (!member) return null;

  const c = member.campaign;
  const [acquiredInWindow, earned] = await Promise.all([
    prisma.salesCommission.count({
      where: { salesRepId, kind: SalesCommissionKind.ACQUISITION, status: { notIn: VOID }, paymentAt: { gte: c.startsAt, lt: c.endsAt } },
    }),
    prisma.salesCommission.aggregate({ where: { salesRepId, campaignId: c.id, status: { notIn: VOID } }, _sum: { amount: true } }),
  ]);
  return { ...c, bonusAwardedAt: member.bonusAwardedAt, acquiredInWindow, campaignEarned: earned._sum.amount ?? 0 };
}

export type RepCampaign = NonNullable<Awaited<ReturnType<typeof getRepCampaign>>>;

/** Admin: the latest campaign, each member's progress, and active reps who could still join. */
export async function getCampaignAdmin() {
  const campaign = await prisma.salesCampaign.findFirst({
    orderBy: { startsAt: "desc" },
    select: {
      ...CAMPAIGN_FIELDS,
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          bonusAwardedAt: true,
          createdAt: true,
          salesRep: { select: { id: true, status: true, user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  if (!campaign) return null;

  const repIds = campaign.members.map((m) => m.salesRep.id);
  const [acquired, earned, candidates] = await Promise.all([
    prisma.salesCommission.groupBy({
      by: ["salesRepId"],
      where: {
        salesRepId: { in: repIds },
        kind: SalesCommissionKind.ACQUISITION,
        status: { notIn: VOID },
        paymentAt: { gte: campaign.startsAt, lt: campaign.endsAt },
      },
      _count: { _all: true },
    }),
    prisma.salesCommission.groupBy({
      by: ["salesRepId"],
      where: { campaignId: campaign.id, status: { notIn: VOID } },
      _sum: { amount: true },
    }),
    prisma.salesRep.findMany({
      where: { status: SalesRepStatus.ACTIVE, id: { notIn: repIds } },
      orderBy: { createdAt: "asc" },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const { members, ...terms } = campaign;
  return {
    campaign: terms,
    members: members.map((m) => ({
      ...m,
      acquiredInWindow: acquired.find((a) => a.salesRepId === m.salesRep.id)?._count._all ?? 0,
      campaignEarned: earned.find((e) => e.salesRepId === m.salesRep.id)?._sum.amount ?? 0,
    })),
    candidates,
  };
}

export type CampaignAdmin = NonNullable<Awaited<ReturnType<typeof getCampaignAdmin>>>;

const ANNOUNCEMENT_FIELDS = { id: true, title: true, body: true, tone: true, pinned: true, expiresAt: true, createdAt: true } as const;

/** What reps see: unexpired, pinned first, newest first. */
export async function listActiveAnnouncements(now = new Date(), take = 4) {
  return prisma.salesAnnouncement.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
    select: ANNOUNCEMENT_FIELDS,
  });
}

/** Admin: everything, including expired ones. */
export async function listAllAnnouncements(take = 100) {
  return prisma.salesAnnouncement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take, select: ANNOUNCEMENT_FIELDS });
}

export type Announcement = Awaited<ReturnType<typeof listAllAnnouncements>>[number];

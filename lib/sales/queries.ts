import {
  BalanceTransactionType,
  Prisma,
  SalesCommissionKind,
  SalesCommissionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCommissionRuleAt } from "./engine";
import { allocateTiers, levelForEligibleCount, tierForPosition } from "./rules";

/**
 * Read models for the Admin and Sales dashboards. Every function takes an
 * explicit scope: Sales pages pass `{ salesRepId }` from requireSalesRep(),
 * never from the request. Metrics are all-time unless the name says otherwise,
 * money is EGP piasters.
 */
export type SalesScope = { salesRepId: string } | { all: true };

const repWhere = (scope: SalesScope) => ("all" in scope ? {} : { salesRepId: scope.salesRepId });

export const PAGE_SIZE = 20;

export type MoneyByStatus = Record<SalesCommissionStatus, number>;

const emptyByStatus = (): MoneyByStatus => ({ PENDING: 0, APPROVED: 0, ON_HOLD: 0, REJECTED: 0, REVERSED: 0, PAID: 0 });

/** Net subscription revenue (charges − refund credits) of currently attributed customers, per rep. */
export async function getAttributedRevenueByRep(scope: SalesScope): Promise<Map<string, { charged: number; refunded: number }>> {
  const filter = "all" in scope ? Prisma.empty : Prisma.sql`AND a."salesRepId" = ${scope.salesRepId}`;
  const rows = await prisma.$queryRaw<{ salesRepId: string; charged: bigint | null; refunded: bigint | null }[]>`
    SELECT a."salesRepId",
           SUM(-bt."amount") FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE' AND bt."amount" < 0) AS charged,
           SUM(bt."amount") FILTER (WHERE bt."type" = 'REFUND' AND bt."amount" > 0) AS refunded
    FROM "SalesAttribution" a
    JOIN "Store" s ON s."userId" = a."customerUserId"
    JOIN "BalanceTransaction" bt ON bt."storeId" = s."id"
    WHERE bt."type" IN ('SUBSCRIPTION_CHARGE', 'REFUND') ${filter}
    GROUP BY a."salesRepId"`;
  return new Map(rows.map((r) => [r.salesRepId, { charged: Number(r.charged ?? 0), refunded: Number(r.refunded ?? 0) }]));
}

/** Items a payout would settle: approved unpaid commissions + unpaid adjustments on approved/paid commissions. */
export async function getPayableItems(db: Prisma.TransactionClient | typeof prisma, salesRepId: string) {
  const [commissions, adjustments] = await Promise.all([
    db.salesCommission.findMany({
      where: { salesRepId, status: SalesCommissionStatus.APPROVED, payoutId: null },
      select: { id: true, amount: true },
    }),
    db.salesCommissionAdjustment.findMany({
      where: {
        salesRepId,
        payoutId: null,
        commission: { status: { in: [SalesCommissionStatus.APPROVED, SalesCommissionStatus.PAID] } },
      },
      select: { id: true, amount: true },
    }),
  ]);
  const total = commissions.reduce((s, c) => s + c.amount, 0) + adjustments.reduce((s, a) => s + a.amount, 0);
  return { commissionIds: commissions.map((c) => c.id), adjustmentIds: adjustments.map((a) => a.id), total };
}

export async function getSalesSummary(scope: SalesScope, now = new Date()) {
  const where = repWhere(scope);
  const [signups, acquired, eligible, commissionGroups, adjustmentSum, payoutSum, revenueMap, rule, cohorts] = await Promise.all([
    prisma.salesAttribution.count({ where }),
    prisma.salesAttribution.count({ where: { ...where, acquiredAt: { not: null } } }),
    prisma.salesAttribution.count({ where: { ...where, acquiredAt: { not: null }, eligibleUntil: { gt: now } } }),
    prisma.salesCommission.groupBy({ by: ["kind", "status"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.salesCommissionAdjustment.aggregate({ where, _sum: { amount: true } }),
    prisma.salesPayout.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    getAttributedRevenueByRep(scope),
    getCommissionRuleAt(prisma, now),
    prisma.salesAttribution.groupBy({
      by: ["cohortMonth", "eligibleUntil"],
      where: { ...where, acquiredAt: { not: null }, eligibleUntil: { gt: now } },
      _count: { _all: true },
      orderBy: { eligibleUntil: "asc" },
    }),
  ]);

  const byKind: Record<SalesCommissionKind, MoneyByStatus> = { ACQUISITION: emptyByStatus(), RENEWAL: emptyByStatus() };
  const countByStatus = emptyByStatus();
  for (const g of commissionGroups) {
    byKind[g.kind][g.status] += g._sum.amount ?? 0;
    countByStatus[g.status] += g._count._all;
  }
  const byStatus = emptyByStatus();
  for (const k of Object.keys(byKind) as SalesCommissionKind[]) {
    for (const s of Object.keys(byStatus) as SalesCommissionStatus[]) byStatus[s] += byKind[k][s];
  }
  const earned = (k: SalesCommissionKind) =>
    byKind[k].PENDING + byKind[k].APPROVED + byKind[k].ON_HOLD + byKind[k].PAID;

  let charged = 0;
  let refunded = 0;
  for (const r of revenueMap.values()) {
    charged += r.charged;
    refunded += r.refunded;
  }

  const payable = "all" in scope ? null : (await getPayableItems(prisma, scope.salesRepId)).total;

  return {
    signups,
    acquired,
    eligible,
    expired: acquired - eligible,
    conversionRate: signups ? acquired / signups : 0,
    revenue: { charged, refunded, net: charged - refunded },
    commissions: {
      byKind,
      byStatus,
      countByStatus,
      acquisitionEarned: earned("ACQUISITION"),
      renewalEarned: earned("RENEWAL"),
      adjustments: adjustmentSum._sum.amount ?? 0,
    },
    payouts: { total: payoutSum._sum.amount ?? 0, count: payoutSum._count._all },
    payable,
    rule,
    level: levelForEligibleCount(eligible, rule),
    allocation: allocateTiers(eligible, rule),
    nextAcquisition: tierForPosition(eligible + 1, rule),
    expiringCohorts: cohorts.map((c) => ({ cohortMonth: c.cohortMonth, eligibleUntil: c.eligibleUntil, count: c._count._all })),
  };
}

export type SalesSummary = Awaited<ReturnType<typeof getSalesSummary>>;

/** Sales team table for admins. */
export async function listSalesReps(now = new Date()) {
  const [reps, signups, acquired, eligible, commissions, revenue, rule] = await Promise.all([
    prisma.salesRep.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, phone_number: true, referralCode: true } },
      },
    }),
    prisma.salesAttribution.groupBy({ by: ["salesRepId"], _count: { _all: true } }),
    prisma.salesAttribution.groupBy({ by: ["salesRepId"], where: { acquiredAt: { not: null } }, _count: { _all: true } }),
    prisma.salesAttribution.groupBy({
      by: ["salesRepId"],
      where: { acquiredAt: { not: null }, eligibleUntil: { gt: now } },
      _count: { _all: true },
    }),
    prisma.salesCommission.groupBy({
      by: ["salesRepId", "kind"],
      where: { status: { notIn: [SalesCommissionStatus.REJECTED, SalesCommissionStatus.REVERSED] } },
      _sum: { amount: true },
    }),
    getAttributedRevenueByRep({ all: true }),
    getCommissionRuleAt(prisma, now),
  ]);

  const countOf = (rows: { salesRepId: string; _count: { _all: number } }[], id: string) =>
    rows.find((r) => r.salesRepId === id)?._count._all ?? 0;
  const sumOf = (id: string, kind: SalesCommissionKind) =>
    commissions.find((r) => r.salesRepId === id && r.kind === kind)?._sum.amount ?? 0;

  return reps.map((rep) => {
    const e = countOf(eligible, rep.id);
    const s = countOf(signups, rep.id);
    const a = countOf(acquired, rep.id);
    const rev = revenue.get(rep.id) ?? { charged: 0, refunded: 0 };
    return {
      ...rep,
      signups: s,
      acquired: a,
      eligible: e,
      conversionRate: s ? a / s : 0,
      level: levelForEligibleCount(e, rule),
      revenueNet: rev.charged - rev.refunded,
      acquisitionCommissions: sumOf(rep.id, "ACQUISITION"),
      renewalCommissions: sumOf(rep.id, "RENEWAL"),
    };
  });
}

export type CustomerFilter = "all" | "signup" | "eligible" | "expired";

function customerSearchWhere(scope: SalesScope, q?: string): Prisma.SalesAttributionWhereInput {
  const term = q?.trim();
  return {
    ...repWhere(scope),
    ...(term && {
      customer: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { phone_number: { contains: term } },
          { stores: { some: { name: { contains: term, mode: "insensitive" } } } },
        ],
      },
    }),
  };
}

function customerStateWhere(filter: CustomerFilter | undefined, now: Date): Prisma.SalesAttributionWhereInput {
  if (filter === "signup") return { acquiredAt: null };
  if (filter === "eligible") return { acquiredAt: { not: null }, eligibleUntil: { gt: now } };
  if (filter === "expired") return { acquiredAt: { not: null }, eligibleUntil: { lte: now } };
  return {};
}

/** Tab counts — same search/scope as the list, minus the state filter. */
export async function countCustomersByState(scope: SalesScope, q: string | undefined, now = new Date()) {
  const base = customerSearchWhere(scope, q);
  const [all, signup, eligible, expired] = await Promise.all(
    (["all", "signup", "eligible", "expired"] as const).map((f) =>
      prisma.salesAttribution.count({ where: { ...base, ...customerStateWhere(f, now) } }),
    ),
  );
  return { all, signup, eligible, expired };
}

export async function listAttributedCustomers(
  scope: SalesScope,
  opts: { q?: string; filter?: CustomerFilter; page?: number },
  now = new Date(),
) {
  const where: Prisma.SalesAttributionWhereInput = { ...customerSearchWhere(scope, opts.q), ...customerStateWhere(opts.filter, now) };
  const total = await prisma.salesAttribution.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);

  const [rows] = await Promise.all([
    prisma.salesAttribution.findMany({
      where,
      orderBy: { signedUpAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        source: true,
        signedUpAt: true,
        acquiredAt: true,
        cohortMonth: true,
        eligibleUntil: true,
        salesRepId: true,
        originalSalesRepId: true,
        salesRep: { select: { id: true, user: { select: { name: true, email: true } } } },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            stores: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true,
                billingCycle: true,
                trialEndDate: true,
                plan: { select: { name: true } },
              },
            },
          },
        },
        _count: { select: { commissions: true, changes: true } },
      },
    }),
  ]);

  return { total, page, pageCount, rows };
}

/** One customer's attribution + payment history. Returns null when outside the scope (IDOR-safe). */
export async function getAttributedCustomer(scope: SalesScope, customerUserId: string) {
  const attribution = await prisma.salesAttribution.findFirst({
    where: { customerUserId, ...repWhere(scope) },
    select: {
      id: true,
      source: true,
      referralCode: true,
      signedUpAt: true,
      acquiredAt: true,
      cohortMonth: true,
      eligibleUntil: true,
      salesRepId: true,
      originalSalesRepId: true,
      createdAt: true,
      salesRep: { select: { id: true, user: { select: { name: true, email: true } } } },
      changes: { orderBy: { createdAt: "desc" } },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          stores: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              subscriptionStatus: true,
              subscriptionEndsAt: true,
              billingCycle: true,
              plan: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!attribution) return null;

  const payments = await prisma.balanceTransaction.findMany({
    where: {
      store: { userId: customerUserId },
      type: { in: [BalanceTransactionType.SUBSCRIPTION_CHARGE, BalanceTransactionType.REFUND] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, type: true, amount: true, createdAt: true, note: true, store: { select: { name: true } } },
  });

  const commissions = await prisma.salesCommission.findMany({
    where: { attributionId: attribution.id, ...repWhere(scope) },
    orderBy: { paymentAt: "desc" },
    select: {
      id: true,
      kind: true,
      status: true,
      amount: true,
      rateBps: true,
      basisAmount: true,
      paymentAt: true,
      balanceTransactionId: true,
      salesRepId: true,
      adjustments: { select: { amount: true } },
    },
  });

  return { attribution, payments, commissions };
}

export type CommissionListFilters = {
  kind?: SalesCommissionKind;
  status?: SalesCommissionStatus;
  from?: Date;
  to?: Date;
  q?: string;
  page?: number;
};

export async function listCommissions(scope: SalesScope, filters: CommissionListFilters) {
  const q = filters.q?.trim();
  const where: Prisma.SalesCommissionWhereInput = {
    ...repWhere(scope),
    ...(filters.kind && { kind: filters.kind }),
    ...(filters.status && { status: filters.status }),
    ...((filters.from || filters.to) && {
      paymentAt: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lt: filters.to }) },
    }),
    ...(q && {
      attribution: {
        customer: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { stores: { some: { name: { contains: q, mode: "insensitive" } } } },
          ],
        },
      },
    }),
  };

  const total = await prisma.salesCommission.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);

  const [totals, rows] = await Promise.all([
    prisma.salesCommission.aggregate({ where, _sum: { amount: true, basisAmount: true } }),
    prisma.salesCommission.findMany({
      where,
      orderBy: { paymentAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        kind: true,
        status: true,
        statusReason: true,
        basisAmount: true,
        rateBps: true,
        amount: true,
        currency: true,
        tier: true,
        customerPosition: true,
        cohortMonth: true,
        eligibleUntil: true,
        paymentAt: true,
        balanceTransactionId: true,
        ruleId: true,
        createdAt: true,
        payout: { select: { id: true, paidAt: true, reference: true } },
        adjustments: { orderBy: { createdAt: "asc" }, select: { id: true, amount: true, source: true, reason: true, createdAt: true } },
        salesRep: { select: { id: true, user: { select: { name: true, email: true } } } },
        attribution: {
          select: {
            customer: { select: { id: true, name: true, email: true, stores: { take: 1, orderBy: { createdAt: "asc" }, select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    pageCount,
    sumAmount: totals._sum.amount ?? 0,
    sumBasis: totals._sum.basisAmount ?? 0,
    rows,
  };
}

export async function listPayouts(scope: SalesScope, take = 50) {
  return prisma.salesPayout.findMany({
    where: repWhere(scope),
    orderBy: { paidAt: "desc" },
    take,
    select: {
      id: true,
      amount: true,
      currency: true,
      paidAt: true,
      method: true,
      reference: true,
      note: true,
      createdAt: true,
      salesRep: { select: { id: true, user: { select: { name: true, email: true } } } },
      _count: { select: { commissions: true, adjustments: true } },
    },
  });
}

export async function listSalesAuditLog(where: { salesRepId?: string; entityId?: string }, take = 50) {
  const logs = await prisma.salesAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, take });
  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const byId = new Map(actors.map((a) => [a.id, a]));
  return logs.map((l) => ({ ...l, actor: l.actorUserId ? byId.get(l.actorUserId) ?? null : null }));
}

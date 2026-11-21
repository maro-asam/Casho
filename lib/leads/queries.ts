/**
 * Lead reads. Every function takes the actor and goes through its scope
 * (lib/leads/scope.ts), so a rep's page can't load another rep's lead even
 * with a hand-typed id. Lists are paginated on the server.
 */
import { BalanceTransactionType, Prisma, SalesRepStatus, type LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUSES, OPEN_STATUSES } from "./constants";
import { buildLeadWhere, leadOrderBy, type LeadFilters } from "./filters";
import { bucketWhere, cairoDayBounds, type FollowUpBucket } from "./follow-ups";
import { scoreLead } from "./scoring";
import { leadScopeFor } from "./scope";
import type { LeadActor } from "./workflow";

export const LEAD_PAGE_SIZE = 25;

const REP_SELECT = { id: true, status: true, user: { select: { name: true, email: true } } } as const;

export const LEAD_ROW_SELECT = {
  id: true,
  businessName: true,
  ownerName: true,
  phone: true,
  whatsapp: true,
  email: true,
  category: true,
  city: true,
  source: true,
  status: true,
  priority: true,
  score: true,
  lastContactedAt: true,
  nextFollowUpAt: true,
  createdAt: true,
  archivedAt: true,
  deletedAt: true,
  convertedAt: true,
  assignedRep: { select: REP_SELECT },
} satisfies Prisma.LeadSelect;

export type LeadRow = Prisma.LeadGetPayload<{ select: typeof LEAD_ROW_SELECT }>;

export const repLabel = (rep: { status: SalesRepStatus; user: { name: string | null; email: string } } | null | undefined) =>
  rep ? `${rep.user.name ?? rep.user.email}${rep.status === SalesRepStatus.DISABLED ? " (موقوف)" : ""}` : null;

export async function listLeads(actor: LeadActor, f: LeadFilters, pageSize = LEAD_PAGE_SIZE) {
  const where = buildLeadWhere(actor, f);
  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({ where, orderBy: leadOrderBy(f), skip: (f.page - 1) * pageSize, take: pageSize, select: LEAD_ROW_SELECT }),
  ]);
  return { total, rows, page: f.page, pageSize };
}

/** Counts per status for the segmented filter (same filters, status left out). */
export async function countLeadsByStatus(actor: LeadActor, f: LeadFilters) {
  const groups = await prisma.lead.groupBy({ by: ["status"], where: buildLeadWhere(actor, { ...f, status: undefined }), _count: { _all: true } });
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const g of groups) counts[g.status] = g._count._all;
  return { ...counts, all: groups.reduce((s, g) => s + g._count._all, 0) };
}

// ─── Details ────────────────────────────────────────────────────────────────

export async function getLeadDetail(actor: LeadActor, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...leadScopeFor(actor) },
    include: {
      assignedRep: { select: REP_SELECT },
      customerUser: {
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          createdAt: true,
          salesAttribution: { select: { salesRepId: true, source: true, salesRep: { select: REP_SELECT } } },
        },
      },
      customerStore: { select: { id: true, name: true, slug: true, subscriptionStatus: true, planName: true } },
      import: { select: { id: true, fileName: true } },
    },
  });
  if (!lead) return null;

  const [activities, followUps, assignments, matches] = await Promise.all([
    prisma.leadActivity.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.leadFollowUp.findMany({ where: { leadId }, orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 100, include: { salesRep: { select: REP_SELECT } } }),
    actor.kind === "admin" ? prisma.leadAssignment.findMany({ where: { leadId }, orderBy: { createdAt: "desc" }, take: 100 }) : Promise.resolve([]),
    actor.kind === "admin"
      ? prisma.leadConversionMatch.findMany({
          where: { leadId, status: "OPEN" },
          include: { user: { select: { id: true, name: true, email: true, phone_number: true, stores: { select: { name: true, slug: true }, take: 1 } } } },
        })
      : Promise.resolve([]),
  ]);

  // Names for every actor / rep id in the history, in one query each.
  const userIds = [...new Set([...activities.map((a) => a.actorUserId), ...followUps.map((f) => f.closedById), ...assignments.map((a) => a.assignedById)].filter((id): id is string => !!id))];
  const repIds = [...new Set(assignments.flatMap((a) => [a.fromRepId, a.toRepId]).filter((id): id is string => !!id))];
  const [users, reps] = await Promise.all([
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [],
    repIds.length ? prisma.salesRep.findMany({ where: { id: { in: repIds } }, select: REP_SELECT }) : [],
  ]);
  const people = new Map(users.map((u) => [u.id, u.name ?? u.email]));
  const repNames = new Map(reps.map((r) => [r.id, repLabel(r)!]));

  const hadDemo = activities.some((a) => a.type === "DEMO");
  const responded = activities.some((a) => (["CALL", "WHATSAPP", "EMAIL"].includes(a.type) && a.reached) || a.type === "MEETING" || a.type === "DEMO");
  const score = scoreLead({ ...lead, hadDemo, responded });

  // First paid subscription of the linked account (what a conversion is measured by).
  const firstCharge = lead.customerUserId
    ? await prisma.balanceTransaction.findFirst({
        where: { type: BalanceTransactionType.SUBSCRIPTION_CHARGE, store: { userId: lead.customerUserId } },
        orderBy: { createdAt: "asc" },
        select: { id: true, amount: true, createdAt: true },
      })
    : null;

  return { lead, activities, followUps, assignments, matches, people, repNames, score, firstCharge };
}
export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>;

/** Casho accounts whose phone / email match this lead (admin details page: "is this them?"). */
export async function possibleAccountsFor(lead: { normalizedPhone: string; normalizedWhatsapp: string | null; email: string | null; customerUserId: string | null }) {
  if (lead.customerUserId) return [];
  const phones = [lead.normalizedPhone, lead.normalizedWhatsapp].filter((p): p is string => !!p);
  const or: Prisma.UserWhereInput[] = [{ phone_number: { in: phones } }];
  if (lead.email) or.push({ email: lead.email });
  return prisma.user.findMany({
    where: { role: "USER", OR: or },
    take: 5,
    select: { id: true, name: true, email: true, phone_number: true, emailVerified: true, lead: { select: { id: true } }, stores: { select: { name: true, slug: true }, take: 1 } },
  });
}

// ─── Follow-ups ─────────────────────────────────────────────────────────────

const FOLLOW_UP_LEAD_SELECT = {
  id: true,
  businessName: true,
  ownerName: true,
  phone: true,
  whatsapp: true,
  status: true,
  priority: true,
  assignedRep: { select: REP_SELECT },
} satisfies Prisma.LeadSelect;

function followUpScope(actor: LeadActor): Prisma.LeadFollowUpWhereInput {
  return { lead: { deletedAt: null, archivedAt: null, ...leadScopeFor(actor) } };
}

export async function countFollowUps(actor: LeadActor, now = new Date()) {
  const scope = followUpScope(actor);
  const [overdue, today, upcoming, completed] = await Promise.all(
    (["overdue", "today", "upcoming", "completed"] as FollowUpBucket[]).map((b) => prisma.leadFollowUp.count({ where: { ...scope, ...bucketWhere(b, now) } })),
  );
  return { overdue, today, upcoming, completed };
}

export async function listFollowUps(actor: LeadActor, bucket: FollowUpBucket, opts: { page: number; repId?: string; now?: Date }) {
  const now = opts.now ?? new Date();
  const where: Prisma.LeadFollowUpWhereInput = {
    ...followUpScope(actor),
    ...bucketWhere(bucket, now),
    ...(actor.kind === "admin" && opts.repId ? (opts.repId === "none" ? { salesRepId: null } : { salesRepId: opts.repId }) : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.leadFollowUp.count({ where }),
    prisma.leadFollowUp.findMany({
      where,
      orderBy: bucket === "completed" ? { closedAt: "desc" } : { dueAt: "asc" },
      skip: (opts.page - 1) * LEAD_PAGE_SIZE,
      take: LEAD_PAGE_SIZE,
      select: { id: true, dueAt: true, note: true, status: true, outcome: true, closedAt: true, lead: { select: FOLLOW_UP_LEAD_SELECT } },
    }),
  ]);
  return { total, rows, page: opts.page, pageSize: LEAD_PAGE_SIZE };
}
export type FollowUpRow = Awaited<ReturnType<typeof listFollowUps>>["rows"][number];

// ─── Pipeline (Kanban) ──────────────────────────────────────────────────────

export const PIPELINE_COLUMN_SIZE = 30;

export async function getPipeline(actor: LeadActor, f: LeadFilters) {
  const base = buildLeadWhere(actor, { ...f, status: undefined });
  const columns = await Promise.all(
    LEAD_STATUSES.map(async (status) => {
      const where: Prisma.LeadWhereInput = { AND: [base, { status }] };
      const [count, leads] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.findMany({
          where,
          orderBy: [{ priority: "desc" }, { score: "desc" }, { statusChangedAt: "desc" }],
          take: PIPELINE_COLUMN_SIZE,
          select: { id: true, businessName: true, ownerName: true, city: true, priority: true, score: true, nextFollowUpAt: true, assignedRep: { select: REP_SELECT } },
        }),
      ]);
      return { status, count, leads };
    }),
  );
  return columns;
}
export type PipelineColumn = Awaited<ReturnType<typeof getPipeline>>[number];

// ─── Overview analytics (super admin) ───────────────────────────────────────

export type OverviewRange = "30d" | "90d" | "12m";

type Bucket = { key: string; label: string; count: number };

export async function getLeadOverview(now = new Date()) {
  const live: Prisma.LeadWhereInput = { deletedAt: null };
  const { start: todayStart, end: todayEnd } = cairoDayBounds(now);
  const pendingLive: Prisma.LeadFollowUpWhereInput = { status: "PENDING", lead: { deletedAt: null, archivedAt: null } };

  const [byStatus, total, newThisWeek, assigned, dueToday, overdue, orphaned, openMatches, bySource, byCategory, byCity] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: live, _count: { _all: true } }),
    prisma.lead.count({ where: live }),
    prisma.lead.count({ where: { ...live, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } } }),
    prisma.lead.count({ where: { ...live, archivedAt: null, assignedRepId: { not: null }, status: { in: OPEN_STATUSES } } }),
    prisma.leadFollowUp.count({ where: { ...pendingLive, dueAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.leadFollowUp.count({ where: { ...pendingLive, dueAt: { lt: now } } }),
    prisma.lead.count({ where: { ...live, archivedAt: null, status: { in: OPEN_STATUSES }, assignedRep: { status: SalesRepStatus.DISABLED } } }),
    prisma.leadConversionMatch.count({ where: { status: "OPEN" } }),
    prisma.lead.groupBy({ by: ["source"], where: live, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["category"], where: live, _count: { _all: true }, orderBy: { _count: { category: "desc" } }, take: 8 }),
    prisma.lead.groupBy({ by: ["city"], where: live, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 8 }),
  ]);

  const status = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const g of byStatus) status[g.status] = g._count._all;
  const contacted = status.CONTACTED + status.INTERESTED + status.DEMO_SCHEDULED + status.NEGOTIATION;
  const decided = status.CONVERTED + status.LOST;

  const toBuckets = <T extends string | null>(rows: { _count: { _all: number } }[], key: (r: never) => T, label: (k: T) => string): Bucket[] =>
    rows
      .map((r) => {
        const k = key(r as never);
        return { key: k ?? "", label: label(k), count: r._count._all };
      })
      .sort((a, b) => b.count - a.count);

  return {
    total,
    status,
    newThisWeek,
    assigned,
    contacted,
    dueToday,
    overdue,
    orphaned,
    openMatches,
    /** Converted ÷ all live leads. */
    conversionRate: total ? status.CONVERTED / total : 0,
    /** Converted ÷ leads that reached a decision (won or lost). */
    winRate: decided ? status.CONVERTED / decided : null,
    bySource: toBuckets(bySource, (r: { source: string | null }) => r.source, (k) => k ?? ""),
    byCategory: toBuckets(byCategory, (r: { category: string | null }) => r.category, (k) => k ?? ""),
    byCity: toBuckets(byCity, (r: { city: string | null }) => r.city, (k) => k ?? ""),
  };
}
export type LeadOverview = Awaited<ReturnType<typeof getLeadOverview>>;

/** Leads added and leads converted per period (Cairo time), for the trend charts. */
export async function getLeadTrend(range: OverviewRange, now = new Date()) {
  const unit = range === "12m" ? "month" : range === "90d" ? "week" : "day";
  const since =
    range === "12m" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)) : new Date(now.getTime() - (range === "90d" ? 90 : 30) * 86_400_000);
  const rows = await prisma.$queryRaw<{ period: string; added: number; converted: number; lost: number }[]>`
    WITH added AS (
      SELECT date_trunc(${unit}, ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo') AS period, count(*)::int AS n
      FROM "Lead" WHERE "deletedAt" IS NULL AND "createdAt" >= ${since} GROUP BY 1
    ), converted AS (
      SELECT date_trunc(${unit}, ("convertedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo') AS period, count(*)::int AS n
      FROM "Lead" WHERE "deletedAt" IS NULL AND "convertedAt" >= ${since} GROUP BY 1
    ), lost AS (
      SELECT date_trunc(${unit}, ("lostAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo') AS period, count(*)::int AS n
      FROM "Lead" WHERE "deletedAt" IS NULL AND status = 'LOST' AND "lostAt" >= ${since} GROUP BY 1
    ), periods AS (
      SELECT generate_series(date_trunc(${unit}, ${since}::timestamptz AT TIME ZONE 'Africa/Cairo'), date_trunc(${unit}, now() AT TIME ZONE 'Africa/Cairo'), ('1 ' || ${unit})::interval) AS period
    )
    SELECT to_char(p.period, 'YYYY-MM-DD') AS period, COALESCE(a.n, 0) AS added, COALESCE(c.n, 0) AS converted, COALESCE(l.n, 0) AS lost
    FROM periods p
    LEFT JOIN added a ON a.period = p.period
    LEFT JOIN converted c ON c.period = p.period
    LEFT JOIN lost l ON l.period = p.period
    ORDER BY p.period
  `;
  return { unit, points: rows.map((r) => ({ period: r.period, added: r.added, converted: r.converted, lost: r.lost })) };
}

/** Per rep: leads they hold, worked, won, lost, follow-ups overdue — for the overview table. */
export async function getRepLeadPerformance(now = new Date()) {
  const [reps, groups, overdue, activity30d] = await Promise.all([
    prisma.salesRep.findMany({ select: REP_SELECT, orderBy: { createdAt: "asc" } }),
    prisma.lead.groupBy({ by: ["assignedRepId", "status"], where: { deletedAt: null, assignedRepId: { not: null } }, _count: { _all: true } }),
    prisma.leadFollowUp.groupBy({
      by: ["salesRepId"],
      where: { status: "PENDING", dueAt: { lt: now }, salesRepId: { not: null }, lead: { deletedAt: null, archivedAt: null } },
      _count: { _all: true },
    }),
    prisma.leadActivity.groupBy({
      by: ["actorUserId"],
      where: { actorRole: "SALES", type: { in: ["CALL", "WHATSAPP", "EMAIL", "MEETING", "DEMO"] }, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } },
      _count: { _all: true },
    }),
  ]);
  const repUsers = await prisma.salesRep.findMany({ select: { id: true, userId: true } });
  const userOf = new Map(repUsers.map((r) => [r.id, r.userId]));
  const touches = new Map(activity30d.map((a) => [a.actorUserId, a._count._all]));
  const overdueBy = new Map(overdue.map((o) => [o.salesRepId, o._count._all]));

  return reps
    .map((rep) => {
      const mine = groups.filter((g) => g.assignedRepId === rep.id);
      const n = (s: LeadStatus[]) => mine.filter((g) => s.includes(g.status)).reduce((sum, g) => sum + g._count._all, 0);
      const total = mine.reduce((sum, g) => sum + g._count._all, 0);
      const converted = n(["CONVERTED"]);
      const lost = n(["LOST"]);
      return {
        id: rep.id,
        name: repLabel(rep)!,
        active: rep.status === SalesRepStatus.ACTIVE,
        total,
        open: n(OPEN_STATUSES),
        untouched: n(["ASSIGNED"]),
        converted,
        lost,
        winRate: converted + lost ? converted / (converted + lost) : null,
        overdue: overdueBy.get(rep.id) ?? 0,
        touches30d: touches.get(userOf.get(rep.id) ?? "") ?? 0,
      };
    })
    .filter((r) => r.total > 0 || r.active);
}

/** A rep's own numbers for /sales/leads. */
export async function getRepLeadStats(salesRepId: string, now = new Date()) {
  const actor: LeadActor = { kind: "rep", userId: "", salesRepId };
  const scope = leadScopeFor(actor);
  const [groups, followUps] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    countFollowUps(actor, now),
  ]);
  const by = (s: LeadStatus[]) => groups.filter((g) => s.includes(g.status)).reduce((sum, g) => sum + g._count._all, 0);
  const converted = by(["CONVERTED"]);
  const lost = by(["LOST"]);
  return {
    total: groups.reduce((s, g) => s + g._count._all, 0),
    open: by(OPEN_STATUSES),
    untouched: by(["ASSIGNED"]),
    converted,
    lost,
    winRate: converted + lost ? converted / (converted + lost) : null,
    followUps,
  };
}

// ─── Filter options & badges ────────────────────────────────────────────────

export async function leadFilterOptions() {
  const [reps, categories, cities] = await Promise.all([
    prisma.salesRep.findMany({ select: REP_SELECT, orderBy: { createdAt: "asc" } }),
    prisma.lead.groupBy({ by: ["category"], where: { deletedAt: null, category: { not: null } }, _count: { _all: true }, orderBy: { _count: { category: "desc" } }, take: 50 }),
    prisma.lead.groupBy({ by: ["city"], where: { deletedAt: null, city: { not: null } }, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 60 }),
  ]);
  return {
    reps: reps.map((r) => ({ id: r.id, label: repLabel(r)!, active: r.status === SalesRepStatus.ACTIVE })),
    categories: categories.map((c) => c.category!).filter(Boolean),
    cities: cities.map((c) => c.city!).filter(Boolean),
  };
}

/** Sidebar badge: work waiting on a super admin (overdue follow-ups of their own + ambiguous matches + orphaned leads). */
export async function countLeadAttention(now = new Date()) {
  const [matches, orphaned, overdueAdmin] = await Promise.all([
    prisma.leadConversionMatch.count({ where: { status: "OPEN" } }),
    prisma.lead.count({ where: { deletedAt: null, archivedAt: null, status: { in: OPEN_STATUSES }, assignedRep: { status: SalesRepStatus.DISABLED } } }),
    prisma.leadFollowUp.count({ where: { status: "PENDING", salesRepId: null, dueAt: { lt: now }, lead: { deletedAt: null, archivedAt: null } } }),
  ]);
  return { matches, orphaned, overdueAdmin, total: matches + orphaned + overdueAdmin };
}

export async function listOpenMatches(take = 50) {
  return prisma.leadConversionMatch.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      lead: { select: { id: true, businessName: true, ownerName: true, phone: true, email: true, status: true, assignedRep: { select: REP_SELECT } } },
      user: { select: { id: true, name: true, email: true, phone_number: true, emailVerified: true, createdAt: true, stores: { select: { name: true, slug: true }, take: 1 } } },
    },
  });
}

// ─── Imports ────────────────────────────────────────────────────────────────

export async function listLeadImports(take = 30) {
  const imports = await prisma.leadImport.findMany({ orderBy: { createdAt: "desc" }, take });
  const uploaders = await prisma.user.findMany({ where: { id: { in: [...new Set(imports.map((i) => i.uploadedById))] } }, select: { id: true, name: true, email: true } });
  const names = new Map(uploaders.map((u) => [u.id, u.name ?? u.email]));
  return imports.map((i) => ({ ...i, uploadedBy: names.get(i.uploadedById) ?? "—" }));
}

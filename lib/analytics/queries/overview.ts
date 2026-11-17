/**
 * Overview: traffic totals from session summaries, and the business side
 * from verified records — accounts, stores, the balance ledger, orders —
 * never from browser events. See docs/analytics/README.md for every definition.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isStorefrontView, scopeWhere, type AnalyticsFilter } from "../filters";
import type { SessionTotals } from "../metrics";
import { bucketSql, bucketsFor, cachedQuery, cairo, num, previousBuckets, rangeSql, type Bucket } from "./shared";

export type Business = {
  /** Casho: accounts created (all signups, tracked or not). */
  signups: number;
  /** Casho: signups whose email is confirmed (Google signups are confirmed on creation). */
  verifiedSignups: number;
  /** Casho: stores that started their free trial. */
  trials: number;
  /** Casho: stores charged for a subscription period (balance ledger). */
  paidStores: number;
  /** Casho: subscription charges − refunds, piasters. */
  revenue: number;
  /** Casho: the part of `revenue` from stores whose owner arrived through tracked traffic matching the filter. */
  attributedRevenue: number;
  /** Visitors in the range who became paying customers (to date). */
  customers: number;
  /** Storefront: tracked orders (verified, not canceled). */
  orders: number;
  /** Storefront: their value, piasters. */
  orderRevenue: number;
  /** Storefront: all orders placed on the store(s), tracked or not. */
  allOrders: number;
};

const EMPTY_BUSINESS: Business = {
  signups: 0,
  verifiedSignups: 0,
  trials: 0,
  paidStores: 0,
  revenue: 0,
  attributedRevenue: 0,
  customers: 0,
  orders: 0,
  orderRevenue: 0,
  allOrders: 0,
};

export const SERIES_KEYS = [
  "sessions",
  "visitors",
  "newVisitors",
  "pageviews",
  "engagedSessions",
  "convertedSessions",
  "engagedMs",
  "durationMs",
  "signups",
  "verifiedSignups",
  "trials",
  "paidStores",
  "revenue",
  "orders",
  "orderRevenue",
] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];
export type Series = Record<SeriesKey, number[]>;

export type OverviewData = {
  view: "casho" | "storefront";
  buckets: Bucket[];
  prevBuckets: Bucket[];
  current: { totals: SessionTotals; business: Business };
  previous: { totals: SessionTotals; business: Business } | null;
  series: Series;
  prevSeries: Series | null;
};

// ─── Traffic ──────────────────────────────────────────────────────────────

async function trafficTotals(f: AnalyticsFilter, from: Date, to: Date): Promise<SessionTotals> {
  const where = Prisma.sql`${rangeSql(Prisma.sql`s."startedAt"`, from, to)} AND ${scopeWhere(f, "s")}`;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT count(*)::int AS sessions,
           count(DISTINCT s."visitorId")::int AS visitors,
           count(DISTINCT s."visitorId") FILTER (WHERE NOT s."isReturning")::int AS new_visitors,
           count(DISTINCT (s."visitorId", to_char(${cairo(Prisma.sql`s."startedAt"`)}, 'YYYY-MM-DD')))::int AS visitor_days,
           COALESCE(sum(s."pageviews"), 0)::int AS pageviews,
           count(*) FILTER (WHERE s."engaged")::int AS engaged,
           count(*) FILTER (WHERE s."converted")::int AS converted,
           COALESCE(sum(s."engagedMs"), 0)::float8 AS engaged_ms,
           COALESCE(sum(extract(epoch FROM (s."lastSeenAt" - s."startedAt")) * 1000), 0)::float8 AS duration_ms
    FROM "AnalyticsSession" s
    WHERE ${where}
  `;
  const r = rows[0] ?? {};
  return {
    sessions: num(r.sessions),
    visitors: num(r.visitors),
    visitorDays: num(r.visitor_days),
    newVisitors: num(r.new_visitors),
    pageviews: num(r.pageviews),
    engagedSessions: num(r.engaged),
    convertedSessions: num(r.converted),
    engagedMs: num(r.engaged_ms),
    durationMs: num(r.duration_ms),
  };
}

async function trafficSeries(f: AnalyticsFilter, from: Date, to: Date) {
  const bucket = bucketSql(Prisma.sql`s."startedAt"`, f.granularity);
  return prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT ${bucket} AS bucket,
           count(*)::int AS sessions,
           count(DISTINCT s."visitorId")::int AS visitors,
           count(DISTINCT s."visitorId") FILTER (WHERE NOT s."isReturning")::int AS new_visitors,
           COALESCE(sum(s."pageviews"), 0)::int AS pageviews,
           count(*) FILTER (WHERE s."engaged")::int AS engaged,
           count(*) FILTER (WHERE s."converted")::int AS converted,
           COALESCE(sum(s."engagedMs"), 0)::float8 AS engaged_ms,
           COALESCE(sum(extract(epoch FROM (s."lastSeenAt" - s."startedAt")) * 1000), 0)::float8 AS duration_ms
    FROM "AnalyticsSession" s
    WHERE ${rangeSql(Prisma.sql`s."startedAt"`, from, to)} AND ${scopeWhere(f, "s")}
    GROUP BY 1
  `;
}

// ─── Business (verified records) ──────────────────────────────────────────

/** Users whose first tracked visit (before signing up) matches the filter — the attribution base. */
function attributedUsersSql(f: AnalyticsFilter) {
  return Prisma.sql`
    SELECT DISTINCT ON (ai."userId") ai."userId"
    FROM "AnalyticsIdentity" ai
    JOIN "AnalyticsSession" s ON s."visitorId" = ai."visitorId" AND s."startedAt" <= ai."createdAt" + interval '1 minute'
    WHERE ai."kind" = 'signup' AND ${scopeWhere({ ...f, scope: f.scope === "all" ? "all" : f.scope }, "s")}
    ORDER BY ai."userId", s."startedAt" ASC
  `;
}

async function cashoBusiness(f: AnalyticsFilter, from: Date, to: Date): Promise<Business> {
  const [users, trials, ledger, customers] = await Promise.all([
    prisma.$queryRaw<{ total: number; verified: number }[]>`
      SELECT count(*)::int AS total, count(*) FILTER (WHERE u."emailVerified")::int AS verified
      FROM "User" u
      WHERE ${rangeSql(Prisma.sql`u."createdAt"`, from, to)} AND u."role" = 'USER'
    `,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM "Store" st WHERE ${rangeSql(Prisma.sql`st."trialStartDate"`, from, to)}
    `,
    prisma.$queryRaw<{ paid: number; revenue: number; attributed: number }[]>`
      WITH attributed AS (${attributedUsersSql(f)})
      SELECT count(DISTINCT bt."storeId") FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE')::int AS paid,
             (COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE'), 0)
              - COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'REFUND'), 0))::float8 AS revenue,
             (COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE' AND a."userId" IS NOT NULL), 0)
              - COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'REFUND' AND a."userId" IS NOT NULL), 0))::float8 AS attributed
      FROM "BalanceTransaction" bt
      JOIN "Store" st ON st."id" = bt."storeId"
      LEFT JOIN attributed a ON a."userId" = st."userId"
      WHERE ${rangeSql(Prisma.sql`bt."createdAt"`, from, to)} AND bt."type" IN ('SUBSCRIPTION_CHARGE', 'REFUND')
    `,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(DISTINCT ai."userId")::int AS n
      FROM "AnalyticsIdentity" ai
      WHERE ai."kind" = 'signup'
        AND ai."visitorId" IN (
          SELECT DISTINCT s."visitorId" FROM "AnalyticsSession" s
          WHERE ${rangeSql(Prisma.sql`s."startedAt"`, from, to)} AND ${scopeWhere(f, "s")}
        )
        AND EXISTS (
          SELECT 1 FROM "Store" st JOIN "BalanceTransaction" bt ON bt."storeId" = st."id" AND bt."type" = 'SUBSCRIPTION_CHARGE'
          WHERE st."userId" = ai."userId"
        )
    `,
  ]);
  return {
    ...EMPTY_BUSINESS,
    signups: num(users[0]?.total),
    verifiedSignups: num(users[0]?.verified),
    trials: num(trials[0]?.n),
    paidStores: num(ledger[0]?.paid),
    revenue: num(ledger[0]?.revenue),
    attributedRevenue: num(ledger[0]?.attributed),
    customers: num(customers[0]?.n),
  };
}

async function storefrontBusiness(f: AnalyticsFilter, from: Date, to: Date): Promise<Business> {
  const storeWhere = f.storeId ? Prisma.sql`o."storeId" = ${f.storeId}` : Prisma.sql`TRUE`;
  const [tracked, all] = await Promise.all([
    prisma.$queryRaw<{ orders: number; revenue: number; buyers: number }[]>`
      SELECT count(*)::int AS orders, COALESCE(sum(o."total"), 0)::float8 AS revenue, count(DISTINCT e."visitorId")::int AS buyers
      FROM "AnalyticsEvent" e
      JOIN "Order" o ON o."id" = e."refId"
      WHERE e."name" = 'order_placed' AND ${rangeSql(Prisma.sql`e."ts"`, from, to)} AND ${scopeWhere(f, "e")}
        AND o."status" <> 'CANCELED'
    `,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM "Order" o
      WHERE ${rangeSql(Prisma.sql`o."createdAt"`, from, to)} AND o."source" = 'ONLINE' AND ${storeWhere}
    `,
  ]);
  return {
    ...EMPTY_BUSINESS,
    orders: num(tracked[0]?.orders),
    orderRevenue: num(tracked[0]?.revenue),
    customers: num(tracked[0]?.buyers),
    allOrders: num(all[0]?.n),
  };
}

async function businessSeries(f: AnalyticsFilter, from: Date, to: Date) {
  if (isStorefrontView(f)) {
    const bucket = bucketSql(Prisma.sql`e."ts"`, f.granularity);
    return prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucket} AS bucket, count(*)::int AS orders, COALESCE(sum(o."total"), 0)::float8 AS order_revenue
      FROM "AnalyticsEvent" e JOIN "Order" o ON o."id" = e."refId"
      WHERE e."name" = 'order_placed' AND ${rangeSql(Prisma.sql`e."ts"`, from, to)} AND ${scopeWhere(f, "e")} AND o."status" <> 'CANCELED'
      GROUP BY 1
    `;
  }
  const [users, trials, ledger] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucketSql(Prisma.sql`u."createdAt"`, f.granularity)} AS bucket, count(*)::int AS signups,
             count(*) FILTER (WHERE u."emailVerified")::int AS verified
      FROM "User" u WHERE ${rangeSql(Prisma.sql`u."createdAt"`, from, to)} AND u."role" = 'USER' GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucketSql(Prisma.sql`st."trialStartDate"`, f.granularity)} AS bucket, count(*)::int AS trials
      FROM "Store" st WHERE ${rangeSql(Prisma.sql`st."trialStartDate"`, from, to)} GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucketSql(Prisma.sql`bt."createdAt"`, f.granularity)} AS bucket,
             count(DISTINCT bt."storeId") FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE')::int AS paid,
             (COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE'), 0)
              - COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'REFUND'), 0))::float8 AS revenue
      FROM "BalanceTransaction" bt
      WHERE ${rangeSql(Prisma.sql`bt."createdAt"`, from, to)} AND bt."type" IN ('SUBSCRIPTION_CHARGE', 'REFUND')
      GROUP BY 1
    `,
  ]);
  return [...users, ...trials, ...ledger];
}

function toSeries(buckets: Bucket[], rows: Record<string, unknown>[]): Series {
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  const series = Object.fromEntries(SERIES_KEYS.map((k) => [k, new Array<number>(buckets.length).fill(0)])) as Series;
  const map: [string, SeriesKey][] = [
    ["sessions", "sessions"],
    ["visitors", "visitors"],
    ["new_visitors", "newVisitors"],
    ["pageviews", "pageviews"],
    ["engaged", "engagedSessions"],
    ["converted", "convertedSessions"],
    ["engaged_ms", "engagedMs"],
    ["duration_ms", "durationMs"],
    ["signups", "signups"],
    ["verified", "verifiedSignups"],
    ["trials", "trials"],
    ["paid", "paidStores"],
    ["revenue", "revenue"],
    ["orders", "orders"],
    ["order_revenue", "orderRevenue"],
  ];
  for (const row of rows) {
    const i = index.get(String(row.bucket));
    if (i === undefined) continue;
    for (const [col, key] of map) if (row[col] !== undefined) series[key][i] += num(row[col]);
  }
  return series;
}

async function load(f: AnalyticsFilter): Promise<OverviewData> {
  const storefront = isStorefrontView(f);
  const business = storefront ? storefrontBusiness : cashoBusiness;
  const buckets = bucketsFor(f.fromKey, f.toKey, f.granularity);
  const prevBuckets = previousBuckets(f);
  const hasPrev = !!(f.prevFrom && f.prevTo);

  const [totals, biz, tSeries, bSeries, prevTotals, prevBiz, prevT, prevB] = await Promise.all([
    trafficTotals(f, f.from, f.to),
    business(f, f.from, f.to),
    trafficSeries(f, f.from, f.to),
    businessSeries(f, f.from, f.to),
    hasPrev ? trafficTotals(f, f.prevFrom!, f.prevTo!) : null,
    hasPrev ? business(f, f.prevFrom!, f.prevTo!) : null,
    hasPrev ? trafficSeries(f, f.prevFrom!, f.prevTo!) : null,
    hasPrev ? businessSeries(f, f.prevFrom!, f.prevTo!) : null,
  ]);

  return {
    view: storefront ? "storefront" : "casho",
    buckets,
    prevBuckets,
    current: { totals, business: biz },
    previous: prevTotals && prevBiz ? { totals: prevTotals, business: prevBiz } : null,
    series: toSeries(buckets, [...tSeries, ...bSeries]),
    prevSeries: prevT && prevB ? toSeries(prevBuckets, [...prevT, ...prevB]) : null,
  };
}

const cachedLoad = cachedQuery("overview", load);

/** Throws on a database error — the page's error boundary shows it (never zeros pretending to be data). */
export function getOverview(f: AnalyticsFilter): Promise<OverviewData> {
  return cachedLoad(f);
}

/**
 * Grouped views over sessions: visitors (geo, language, technology),
 * acquisition (channels, sources, UTM, referrers, landing pages) and stores.
 * Casho conversions are attributed through verified signups and the balance
 * ledger (first or last touch); storefront conversions through verified orders.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isStorefrontView, scopeWhere, type AnalyticsFilter } from "../filters";
import { cachedQuery, num, rangeSql } from "./shared";

export type BreakdownRow = {
  key: string | null;
  /** Extra label column when the dimension has one (city → its country). */
  sub?: string | null;
  sessions: number;
  visitors: number;
  engaged: number;
  converted: number;
  engagedMs: number;
};

/** Whitelisted group-by expressions over the session table (alias s). */
const DIMENSIONS = {
  country: Prisma.sql`s."country"`,
  city: Prisma.sql`s."city"`,
  language: Prisma.sql`lower(split_part(s."language", '-', 1))`,
  device: Prisma.sql`s."device"`,
  browser: Prisma.sql`s."browser"`,
  os: Prisma.sql`s."os"`,
  screen: Prisma.sql`s."screen"`,
  viewport: Prisma.sql`CASE WHEN s."viewportW" IS NULL THEN NULL WHEN s."viewportW" < 360 THEN '< 360' WHEN s."viewportW" < 414 THEN '360–413' WHEN s."viewportW" < 768 THEN '414–767' WHEN s."viewportW" < 1024 THEN '768–1023' WHEN s."viewportW" < 1280 THEN '1024–1279' WHEN s."viewportW" < 1440 THEN '1280–1439' WHEN s."viewportW" < 1920 THEN '1440–1919' ELSE '≥ 1920' END`,
  visitorType: Prisma.sql`CASE WHEN s."isReturning" THEN 'returning' ELSE 'new' END`,
  channel: Prisma.sql`s."channel"`,
  source: Prisma.sql`s."source"`,
  medium: Prisma.sql`s."utmMedium"`,
  campaign: Prisma.sql`s."utmCampaign"`,
  content: Prisma.sql`s."utmContent"`,
  term: Prisma.sql`s."utmTerm"`,
  referrer: Prisma.sql`s."referrerHost"`,
  landing: Prisma.sql`s."entryPath"`,
} as const;
export type Dimension = keyof typeof DIMENSIONS;

async function breakdown(f: AnalyticsFilter, dim: Dimension, limit: number): Promise<BreakdownRow[]> {
  const expr = DIMENSIONS[dim];
  const sub = dim === "city" ? Prisma.sql`, max(s."country") AS sub` : Prisma.empty;
  const notNull = dim === "referrer" || dim === "medium" || dim === "campaign" || dim === "content" || dim === "term" ? Prisma.sql`AND ${expr} IS NOT NULL` : Prisma.empty;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT ${expr} AS key ${sub},
           count(*)::int AS sessions,
           count(DISTINCT s."visitorId")::int AS visitors,
           count(*) FILTER (WHERE s."engaged")::int AS engaged,
           count(*) FILTER (WHERE s."converted")::int AS converted,
           COALESCE(sum(s."engagedMs"), 0)::float8 AS engaged_ms
    FROM "AnalyticsSession" s
    WHERE ${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")} ${notNull}
    GROUP BY 1
    ORDER BY sessions DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    key: r.key === null || r.key === undefined ? null : String(r.key),
    ...(dim === "city" && { sub: r.sub ? String(r.sub) : null }),
    sessions: num(r.sessions),
    visitors: num(r.visitors),
    engaged: num(r.engaged),
    converted: num(r.converted),
    engagedMs: num(r.engaged_ms),
  }));
}

export const getBreakdown = cachedQuery("breakdown", breakdown);

/** All visitor/technology breakdowns of the Visitors page in one go. */
export const getVisitorBreakdowns = cachedQuery("visitor-breakdowns", async (f: AnalyticsFilter) => {
  const dims: Dimension[] = ["country", "city", "language", "device", "browser", "os", "screen", "viewport", "visitorType"];
  const results = await Promise.all(dims.map((d) => breakdown(f, d, d === "city" ? 25 : 15)));
  return Object.fromEntries(dims.map((d, i) => [d, results[i]])) as Record<(typeof dims)[number], BreakdownRow[]>;
});

// ─── Attribution (Casho) ──────────────────────────────────────────────────

export type AttributionModel = "first" | "last";

export type AttributedRow = {
  key: string | null;
  /** Verified signups attributed to this key (accounts created in the range). */
  signups: number;
  /** Of those, stores that have paid for a subscription (to date). */
  paid: number;
  /** Net subscription revenue from those stores (to date), piasters. */
  revenue: number;
};

const TOUCH_DIMENSIONS = {
  channel: Prisma.sql`t."channel"`,
  source: Prisma.sql`t."source"`,
  medium: Prisma.sql`t."utmMedium"`,
  campaign: Prisma.sql`t."utmCampaign"`,
  content: Prisma.sql`t."utmContent"`,
  term: Prisma.sql`t."utmTerm"`,
  referrer: Prisma.sql`t."referrerHost"`,
  landing: Prisma.sql`t."entryPath"`,
  device: Prisma.sql`t."device"`,
  country: Prisma.sql`t."country"`,
} as const;
export type TouchDimension = keyof typeof TOUCH_DIMENSIONS;

/**
 * Each account created in the range, credited to one of its visits before
 * signing up: the first one (first touch) or the last non-direct one (last
 * touch). Only accounts whose browser was measured can be attributed.
 */
async function attributed(f: AnalyticsFilter, dim: TouchDimension, model: AttributionModel): Promise<AttributedRow[]> {
  const order =
    model === "first"
      ? Prisma.sql`ORDER BY ai."userId", s."startedAt" ASC`
      : Prisma.sql`ORDER BY ai."userId", (s."channel" <> 'direct') DESC, s."startedAt" DESC`;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH touch AS (
      SELECT DISTINCT ON (ai."userId") ai."userId", s."channel", s."source", s."utmMedium", s."utmCampaign", s."utmContent",
             s."utmTerm", s."referrerHost", s."entryPath", s."device", s."country"
      FROM "AnalyticsIdentity" ai
      JOIN "AnalyticsSession" s ON s."visitorId" = ai."visitorId" AND s."startedAt" <= ai."createdAt" + interval '1 minute'
      WHERE ai."kind" = 'signup' AND ${rangeSql(Prisma.sql`ai."createdAt"`, f.from, f.to)} AND ${scopeWhere({ ...f, scope: "all" }, "s")}
      ${order}
    ),
    money AS (
      SELECT st."userId",
             bool_or(bt."type" = 'SUBSCRIPTION_CHARGE') AS paid,
             (COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'SUBSCRIPTION_CHARGE'), 0)
              - COALESCE(sum(abs(bt."amount")) FILTER (WHERE bt."type" = 'REFUND'), 0))::float8 AS revenue
      FROM "Store" st JOIN "BalanceTransaction" bt ON bt."storeId" = st."id" AND bt."type" IN ('SUBSCRIPTION_CHARGE', 'REFUND')
      WHERE st."userId" IN (SELECT "userId" FROM touch)
      GROUP BY st."userId"
    )
    SELECT ${TOUCH_DIMENSIONS[dim]} AS key,
           count(*)::int AS signups,
           count(*) FILTER (WHERE m."paid")::int AS paid,
           COALESCE(sum(m."revenue"), 0)::float8 AS revenue
    FROM touch t LEFT JOIN money m ON m."userId" = t."userId"
    GROUP BY 1
    ORDER BY signups DESC
    LIMIT 100
  `;
  return rows.map((r) => ({ key: r.key === null ? null : String(r.key), signups: num(r.signups), paid: num(r.paid), revenue: num(r.revenue) }));
}

export const getAttributed = cachedQuery("attributed", attributed);

// ─── Storefront orders by session dimension ───────────────────────────────

export type OrderRow = { key: string | null; orders: number; revenue: number };

async function ordersBy(f: AnalyticsFilter, dim: Dimension): Promise<OrderRow[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT ${DIMENSIONS[dim]} AS key, count(*)::int AS orders, COALESCE(sum(o."total"), 0)::float8 AS revenue
    FROM "AnalyticsEvent" e
    JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
    JOIN "Order" o ON o."id" = e."refId" AND o."status" <> 'CANCELED'
    WHERE e."name" = 'order_placed' AND ${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)} AND ${scopeWhere(f, "s")}
    GROUP BY 1
    ORDER BY revenue DESC
    LIMIT 100
  `;
  return rows.map((r) => ({ key: r.key === null ? null : String(r.key), orders: num(r.orders), revenue: num(r.revenue) }));
}

export const getOrdersBy = cachedQuery("orders-by", ordersBy);

/** Acquisition page: one dimension with traffic + conversions merged by key. */
export async function getAcquisition(f: AnalyticsFilter, dim: Dimension & TouchDimension, model: AttributionModel) {
  const [traffic, conversions] = await Promise.all([
    getBreakdown(f, dim, 100),
    isStorefrontView(f) ? getOrdersBy(f, dim) : getAttributed(f, dim, model),
  ]);
  return { traffic, conversions };
}

// ─── Stores (platform view) ───────────────────────────────────────────────

export type StoreRow = {
  storeId: string;
  name: string;
  slug: string;
  sessions: number;
  visitors: number;
  pageviews: number;
  engaged: number;
  orders: number;
  revenue: number;
};

export const getStoresTable = cachedQuery("stores", async (f: AnalyticsFilter): Promise<StoreRow[]> => {
  const device = f.device !== "all" ? Prisma.sql`AND s."device" = ${f.device}` : Prisma.empty;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH traffic AS (
      SELECT s."storeId", count(*)::int AS sessions, count(DISTINCT s."visitorId")::int AS visitors,
             COALESCE(sum(s."pageviews"), 0)::int AS pageviews, count(*) FILTER (WHERE s."engaged")::int AS engaged
      FROM "AnalyticsSession" s
      WHERE s."scope" = 'STOREFRONT' AND ${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} ${device}
      GROUP BY 1
    ),
    sales AS (
      SELECT e."storeId", count(*)::int AS orders, COALESCE(sum(o."total"), 0)::float8 AS revenue
      FROM "AnalyticsEvent" e JOIN "Order" o ON o."id" = e."refId" AND o."status" <> 'CANCELED'
      WHERE e."scope" = 'STOREFRONT' AND e."name" = 'order_placed' AND ${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)}
      GROUP BY 1
    )
    SELECT t."storeId", st."name", st."slug", t.sessions, t.visitors, t.pageviews, t.engaged,
           COALESCE(x.orders, 0)::int AS orders, COALESCE(x.revenue, 0)::float8 AS revenue
    FROM traffic t
    JOIN "Store" st ON st."id" = t."storeId"
    LEFT JOIN sales x ON x."storeId" = t."storeId"
    ORDER BY t.sessions DESC
    LIMIT 200
  `;
  return rows.map((r) => ({
    storeId: String(r.storeId),
    name: String(r.name),
    slug: String(r.slug),
    sessions: num(r.sessions),
    visitors: num(r.visitors),
    pageviews: num(r.pageviews),
    engaged: num(r.engaged),
    orders: num(r.orders),
    revenue: num(r.revenue),
  }));
});

/** Store picker options: stores with storefront traffic first, by name. */
export const getStoreOptions = cachedQuery(
  "store-options",
  async (): Promise<{ id: string; name: string; slug: string }[]> => {
    const rows = await prisma.$queryRaw<{ id: string; name: string; slug: string }[]>`
      SELECT st."id", st."name", st."slug"
      FROM "Store" st
      LEFT JOIN (
        SELECT "storeId", count(*) AS n FROM "AnalyticsSession"
        WHERE "scope" = 'STOREFRONT' AND "startedAt" > now() - interval '90 days' GROUP BY 1
      ) t ON t."storeId" = st."id"
      ORDER BY COALESCE(t.n, 0) DESC, st."name" ASC
      LIMIT 500
    `;
    return rows;
  },
  300,
);

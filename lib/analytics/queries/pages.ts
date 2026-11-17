/**
 * Pages & content: per-page metrics from page views + session entry/exit
 * paths, insight lists, and the single-page drill-down.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scopeWhere, type AnalyticsFilter } from "../filters";
import { ratio } from "../metrics";
import { bucketSql, bucketsFor, cachedQuery, num, rangeSql } from "./shared";

export type PageRow = {
  path: string;
  title: string | null;
  views: number;
  visitors: number;
  sessions: number;
  entrances: number;
  bounces: number;
  /** Sessions that started on this page and converted. */
  entryConversions: number;
  exits: number;
  convertedSessions: number;
  avgEngagedMs: number;
  avgScroll: number;
  ctaClicks: number;
};

async function pagesTable(f: AnalyticsFilter): Promise<PageRow[]> {
  const pvWhere = Prisma.sql`${rangeSql(Prisma.sql`p."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "p")}`;
  const sWhere = Prisma.sql`${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")}`;
  const eWhere = Prisma.sql`${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)} AND ${scopeWhere(f, "e")}`;
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH pv AS (
      SELECT p."path", count(*)::int AS views, count(DISTINCT p."visitorId")::int AS visitors,
             count(DISTINCT p."sessionId")::int AS sessions,
             avg(p."engagedMs")::float8 AS avg_engaged, avg(p."scrollPct")::float8 AS avg_scroll,
             max(p."title") AS title
      FROM "AnalyticsPageView" p WHERE ${pvWhere}
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 300
    ),
    ent AS (
      SELECT s."entryPath" AS path, count(*)::int AS entrances, count(*) FILTER (WHERE NOT s."engaged")::int AS bounces,
             count(*) FILTER (WHERE s."converted")::int AS entry_conversions
      FROM "AnalyticsSession" s WHERE ${sWhere} GROUP BY 1
    ),
    ex AS (
      SELECT s."exitPath" AS path, count(*)::int AS exits FROM "AnalyticsSession" s WHERE ${sWhere} GROUP BY 1
    ),
    conv AS (
      SELECT p."path", count(DISTINCT p."sessionId")::int AS converted
      FROM "AnalyticsPageView" p JOIN "AnalyticsSession" s ON s."id" = p."sessionId" AND s."converted"
      WHERE ${pvWhere} GROUP BY 1
    ),
    cta AS (
      SELECT e."path", count(*)::int AS cta FROM "AnalyticsEvent" e WHERE e."name" = 'cta_clicked' AND ${eWhere} GROUP BY 1
    )
    SELECT pv.*, COALESCE(ent.entrances, 0)::int AS entrances, COALESCE(ent.bounces, 0)::int AS bounces,
           COALESCE(ent.entry_conversions, 0)::int AS entry_conversions,
           COALESCE(ex.exits, 0)::int AS exits, COALESCE(conv.converted, 0)::int AS converted, COALESCE(cta.cta, 0)::int AS cta
    FROM pv
    LEFT JOIN ent ON ent.path = pv."path"
    LEFT JOIN ex ON ex.path = pv."path"
    LEFT JOIN conv ON conv."path" = pv."path"
    LEFT JOIN cta ON cta."path" = pv."path"
    ORDER BY pv.views DESC
  `;
  return rows.map((r) => ({
    path: String(r.path),
    title: r.title ? String(r.title) : null,
    views: num(r.views),
    visitors: num(r.visitors),
    sessions: num(r.sessions),
    entrances: num(r.entrances),
    bounces: num(r.bounces),
    entryConversions: num(r.entry_conversions),
    exits: num(r.exits),
    convertedSessions: num(r.converted),
    avgEngagedMs: num(r.avg_engaged),
    avgScroll: num(r.avg_scroll),
    ctaClicks: num(r.cta),
  }));
}

export const getPagesTable = cachedQuery("pages", pagesTable);

export type PageInsights = {
  minViews: number;
  top: PageRow[];
  worst: PageRow[];
  highTrafficLowConversion: PageRow[];
  highExit: PageRow[];
  bestLanding: PageRow[];
  siteConversion: number | null;
};

/**
 * Insight lists, each only among pages with enough traffic to mean something
 * (≥ 20 views, or ≥ 2 % of all views on a busy site).
 */
export function pageInsights(rows: PageRow[]): PageInsights {
  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
  const totalConverted = rows.reduce((s, r) => s + r.convertedSessions, 0);
  const minViews = Math.max(20, Math.round(totalViews * 0.02));
  const enough = rows.filter((r) => r.views >= minViews);
  const conv = (r: PageRow) => ratio(r.convertedSessions, r.sessions) ?? 0;
  const siteConversion = ratio(totalConverted, totalSessions);
  const viewsSorted = [...enough].sort((a, b) => b.views - a.views);
  const busy = viewsSorted.slice(0, Math.max(1, Math.ceil(viewsSorted.length / 4)));
  const landings = rows.filter((r) => r.entrances >= Math.max(10, Math.round(minViews / 2)));

  return {
    minViews,
    siteConversion,
    top: [...enough].sort((a, b) => conv(b) - conv(a) || b.views - a.views).filter((r) => r.convertedSessions > 0).slice(0, 5),
    worst: [...landings].sort((a, b) => (ratio(b.bounces, b.entrances) ?? 0) - (ratio(a.bounces, a.entrances) ?? 0)).slice(0, 5),
    highTrafficLowConversion: busy.filter((r) => siteConversion !== null && conv(r) < siteConversion).slice(0, 5),
    highExit: [...enough].sort((a, b) => (ratio(b.exits, b.views) ?? 0) - (ratio(a.exits, a.views) ?? 0)).slice(0, 5),
    // Landing pages ranked by conversions per entrance, then by how few visitors bounce.
    bestLanding: [...landings]
      .sort(
        (a, b) =>
          (ratio(b.entryConversions, b.entrances) ?? 0) - (ratio(a.entryConversions, a.entrances) ?? 0) ||
          (ratio(a.bounces, a.entrances) ?? 1) - (ratio(b.bounces, b.entrances) ?? 1) ||
          b.entrances - a.entrances,
      )
      .slice(0, 5),
  };
}

// ─── One page ─────────────────────────────────────────────────────────────

export type PageDetail = {
  path: string;
  trend: { key: string; label: string; views: number; visitors: number }[];
  sources: { key: string; sessions: number }[];
  previous: { key: string | null; views: number }[];
  next: { key: string; views: number }[];
  devices: { key: string; views: number }[];
  scroll: number[];
  ctas: { key: string; clicks: number }[];
  elements: { sel: string; label: string | null; clicks: number }[];
};

async function pageDetail(f: AnalyticsFilter, path: string): Promise<PageDetail> {
  const pvWhere = Prisma.sql`p."path" = ${path} AND ${rangeSql(Prisma.sql`p."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "p")}`;
  const eWhere = Prisma.sql`e."path" = ${path} AND ${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)} AND ${scopeWhere(f, "e")}`;
  const buckets = bucketsFor(f.fromKey, f.toKey, f.granularity);

  const [trend, sources, previous, next, exits, devices, scroll, ctas, elements] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucketSql(Prisma.sql`p."startedAt"`, f.granularity)} AS bucket, count(*)::int AS views, count(DISTINCT p."visitorId")::int AS visitors
      FROM "AnalyticsPageView" p WHERE ${pvWhere} GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT s."channel" AS key, count(*)::int AS sessions
      FROM "AnalyticsSession" s
      WHERE s."entryPath" = ${path} AND ${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")}
      GROUP BY 1 ORDER BY 2 DESC
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p."prevPath" AS key, count(*)::int AS views FROM "AnalyticsPageView" p WHERE ${pvWhere}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p."path" AS key, count(*)::int AS views
      FROM "AnalyticsPageView" p
      WHERE p."prevPath" = ${path} AND p."path" <> ${path} AND ${rangeSql(Prisma.sql`p."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "p")}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM "AnalyticsSession" s
      WHERE s."exitPath" = ${path} AND ${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")}
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p."device" AS key, count(*)::int AS views FROM "AnalyticsPageView" p WHERE ${pvWhere} GROUP BY 1 ORDER BY 2 DESC
    `,
    prisma.$queryRaw<{ sp: number }[]>`
      SELECT p."scrollPct" AS sp FROM "AnalyticsPageView" p WHERE ${pvWhere} AND p."scrollPct" > 0 LIMIT 20000
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT COALESCE(e."props"->>'label', e."props"->>'cta') AS key, count(*)::int AS clicks
      FROM "AnalyticsEvent" e WHERE e."name" = 'cta_clicked' AND ${eWhere} GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."sel" AS sel, max(e."props"->>'label') AS label, count(*)::int AS clicks
      FROM "AnalyticsEvent" e WHERE e."name" = 'click' AND e."sel" IS NOT NULL AND ${eWhere}
      GROUP BY 1 ORDER BY 3 DESC LIMIT 10
    `,
  ]);

  const byKey = new Map(trend.map((r) => [String(r.bucket), r]));
  return {
    path,
    trend: buckets.map((b) => ({ key: b.key, label: b.label, views: num(byKey.get(b.key)?.views), visitors: num(byKey.get(b.key)?.visitors) })),
    sources: sources.map((r) => ({ key: String(r.key), sessions: num(r.sessions) })),
    previous: previous.map((r) => ({ key: r.key === null ? null : String(r.key), views: num(r.views) })),
    next: [...next.map((r) => ({ key: String(r.key), views: num(r.views) })), { key: "(exit)", views: num(exits[0]?.n) }].sort((a, b) => b.views - a.views),
    devices: devices.map((r) => ({ key: String(r.key), views: num(r.views) })),
    scroll: scroll.map((r) => num(r.sp)),
    ctas: ctas.map((r) => ({ key: r.key ? String(r.key) : "—", clicks: num(r.clicks) })),
    elements: elements.map((r) => ({ sel: String(r.sel), label: r.label ? String(r.label) : null, clicks: num(r.clicks) })),
  };
}

export const getPageDetail = cachedQuery("page-detail", pageDetail);

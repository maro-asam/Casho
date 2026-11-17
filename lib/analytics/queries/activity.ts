/**
 * Real-time, journeys, technical performance and the event explorer.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scopeWhere, type AnalyticsFilter } from "../filters";
import { topJourneys, transitions } from "../metrics";
import { bucketSql, bucketsFor, cachedQuery, num, rangeSql } from "./shared";

type ScopeOnly = Pick<AnalyticsFilter, "scope" | "storeId" | "device">;

// ─── Real-time (never cached) ─────────────────────────────────────────────

export type LiveSession = {
  id: string;
  visitor: string;
  startedAt: string;
  lastSeenAt: string;
  entryPath: string;
  currentPath: string;
  pageviews: number;
  channel: string;
  source: string;
  device: string;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  scope: string;
  storeName: string | null;
};

export type FeedItem = { kind: "page" | "event"; name: string; path: string | null; at: string; device: string | null; country: string | null; storeName: string | null };

export async function getRealtime(f: ScopeOnly, windowMin: number) {
  const since = new Date(Date.now() - windowMin * 60_000);
  const feedSince = new Date(Date.now() - 30 * 60_000);
  const [sessions, feed, perMinute] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT s."id", s."visitorId", s."startedAt", s."lastSeenAt", s."entryPath", s."exitPath", s."pageviews", s."channel", s."source",
             s."device", s."browser", s."os", s."country", s."city", s."scope", st."name" AS store_name
      FROM "AnalyticsSession" s LEFT JOIN "Store" st ON st."id" = s."storeId"
      WHERE s."lastSeenAt" >= ${since} AND ${scopeWhere(f, "s")}
      ORDER BY s."lastSeenAt" DESC
      LIMIT 300
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      (SELECT 'page' AS kind, 'page_view' AS name, p."path", p."startedAt" AS at, p."device", s."country", st."name" AS store_name
       FROM "AnalyticsPageView" p JOIN "AnalyticsSession" s ON s."id" = p."sessionId" LEFT JOIN "Store" st ON st."id" = p."storeId"
       WHERE p."startedAt" >= ${feedSince} AND ${scopeWhere(f, "p")}
       ORDER BY p."startedAt" DESC LIMIT 60)
      UNION ALL
      (SELECT 'event' AS kind, e."name", e."path", e."ts" AS at, e."device", NULL AS country, st."name" AS store_name
       FROM "AnalyticsEvent" e LEFT JOIN "Store" st ON st."id" = e."storeId"
       WHERE e."ts" >= ${feedSince} AND e."name" NOT IN ('click', 'web_vital') AND ${scopeWhere(f, "e")}
       ORDER BY e."ts" DESC LIMIT 60)
      ORDER BY at DESC
      LIMIT 80
    `,
    prisma.$queryRaw<{ m: number; n: number }[]>`
      SELECT floor(extract(epoch FROM (now() AT TIME ZONE 'UTC' - p."startedAt")) / 60)::int AS m, count(*)::int AS n
      FROM "AnalyticsPageView" p
      WHERE p."startedAt" >= ${feedSince} AND ${scopeWhere(f, "p")}
      GROUP BY 1
    `,
  ]);

  const live: LiveSession[] = sessions.map((r) => ({
    id: String(r.id),
    visitor: String(r.visitorId).slice(0, 6),
    startedAt: new Date(r.startedAt as Date).toISOString(),
    lastSeenAt: new Date(r.lastSeenAt as Date).toISOString(),
    entryPath: String(r.entryPath),
    currentPath: String(r.exitPath),
    pageviews: num(r.pageviews),
    channel: String(r.channel),
    source: String(r.source),
    device: String(r.device),
    browser: (r.browser as string | null) ?? null,
    os: (r.os as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    scope: String(r.scope),
    storeName: (r.store_name as string | null) ?? null,
  }));
  const minutes = new Array<number>(30).fill(0);
  for (const row of perMinute) if (row.m >= 0 && row.m < 30) minutes[29 - row.m] += num(row.n);

  return {
    windowMin,
    activeVisitors: new Set(sessions.map((r) => String(r.visitorId))).size,
    activeSessions: live.length,
    sessions: live,
    feed: feed.map(
      (r): FeedItem => ({
        kind: r.kind === "page" ? "page" : "event",
        name: String(r.name),
        path: (r.path as string | null) ?? null,
        at: new Date(r.at as Date).toISOString(),
        device: (r.device as string | null) ?? null,
        country: (r.country as string | null) ?? null,
        storeName: (r.store_name as string | null) ?? null,
      }),
    ),
    perMinute: minutes,
  };
}
export type RealtimeData = Awaited<ReturnType<typeof getRealtime>>;

// ─── Journeys ─────────────────────────────────────────────────────────────

/** Actions that show up as steps of a journey next to page views. */
const JOURNEY_EVENTS = ["cta_clicked", "form_submitted", "signup_completed", "login", "add_to_cart", "order_placed", "payment_initiated", "subscription_selected"];
const MAX_SESSIONS = 5_000;

async function journeys(f: AnalyticsFilter) {
  const rows = await prisma.$queryRaw<{ sid: string; step: string; at: Date }[]>`
    WITH sess AS (
      SELECT s."id" FROM "AnalyticsSession" s
      WHERE ${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")}
      ORDER BY s."startedAt" DESC LIMIT ${MAX_SESSIONS}
    )
    SELECT p."sessionId" AS sid, p."path" AS step, p."startedAt" AS at FROM "AnalyticsPageView" p WHERE p."sessionId" IN (SELECT "id" FROM sess)
    UNION ALL
    SELECT e."sessionId" AS sid,
           '⚑ ' || e."name" || COALESCE(':' || (e."props"->>'cta'), '') AS step, e."ts" AS at
    FROM "AnalyticsEvent" e WHERE e."sessionId" IN (SELECT "id" FROM sess) AND e."name" = ANY(${JOURNEY_EVENTS}::text[])
    ORDER BY sid, at
  `;
  const bySession = new Map<string, string[]>();
  for (const r of rows) {
    let steps = bySession.get(r.sid);
    if (!steps) bySession.set(r.sid, (steps = []));
    steps.push(r.step);
  }
  const sessions = [...bySession.values()];
  const trans = transitions(sessions);
  const entryCounts = new Map<string, number>();
  const exitCounts = new Map<string, number>();
  for (const steps of sessions) {
    const pages = steps.filter((s) => !s.startsWith("⚑"));
    if (!pages.length) continue;
    entryCounts.set(pages[0], (entryCounts.get(pages[0]) ?? 0) + 1);
    const last = pages[pages.length - 1];
    exitCounts.set(last, (exitCounts.get(last) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, n]) => ({ key, sessions: n }));

  // "From the top entry pages, where next?" — the three busiest first steps.
  const firstSteps = top(entryCounts).slice(0, 3).map(({ key, sessions: n }) => ({
    from: key,
    sessions: n,
    next: [...(trans.get(key) ?? new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([to, count]) => ({ to, count })),
  }));

  return {
    sampled: sessions.length,
    capped: sessions.length >= MAX_SESSIONS,
    paths: topJourneys(sessions, 5, 15),
    entries: top(entryCounts),
    exits: top(exitCounts),
    firstSteps,
  };
}

export const getJourneys = cachedQuery("journeys", journeys);

/** Recent sessions for the individual-journey list (super admins; every view is audit-logged). */
export async function listSessions(f: AnalyticsFilter, opts: { page: number; converted?: boolean }) {
  const pageSize = 30;
  const conv = opts.converted ? Prisma.sql`AND s."converted"` : Prisma.empty;
  const where = Prisma.sql`${rangeSql(Prisma.sql`s."startedAt"`, f.from, f.to)} AND ${scopeWhere(f, "s")} ${conv}`;
  const [rows, total] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT s."id", s."visitorId", s."startedAt", s."lastSeenAt", s."entryPath", s."exitPath", s."pageviews", s."engagedMs",
             s."channel", s."source", s."device", s."country", s."converted", s."isReturning", st."name" AS store_name
      FROM "AnalyticsSession" s LEFT JOIN "Store" st ON st."id" = s."storeId"
      WHERE ${where}
      ORDER BY s."startedAt" DESC
      LIMIT ${pageSize} OFFSET ${(opts.page - 1) * pageSize}
    `,
    prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "AnalyticsSession" s WHERE ${where}`,
  ]);
  return {
    pageSize,
    total: num(total[0]?.n),
    rows: rows.map((r) => ({
      id: String(r.id),
      visitor: String(r.visitorId).slice(0, 8),
      startedAt: new Date(r.startedAt as Date).toISOString(),
      durationMs: new Date(r.lastSeenAt as Date).getTime() - new Date(r.startedAt as Date).getTime(),
      entryPath: String(r.entryPath),
      exitPath: String(r.exitPath),
      pageviews: num(r.pageviews),
      engagedMs: num(r.engagedMs),
      channel: String(r.channel),
      source: String(r.source),
      device: String(r.device),
      country: (r.country as string | null) ?? null,
      converted: r.converted === true,
      returning: r.isReturning === true,
      storeName: (r.store_name as string | null) ?? null,
    })),
  };
}

/** One session's timeline: page views and events, oldest first. */
export async function getSessionTimeline(sessionId: string) {
  const session = await prisma.analyticsSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      visitorId: true,
      scope: true,
      startedAt: true,
      lastSeenAt: true,
      channel: true,
      source: true,
      referrerHost: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      device: true,
      browser: true,
      os: true,
      country: true,
      city: true,
      converted: true,
      engagedMs: true,
      pageviews: true,
      isReturning: true,
      store: { select: { name: true } },
    },
  });
  if (!session) return null;
  const [pages, events, otherSessions] = await Promise.all([
    prisma.analyticsPageView.findMany({
      where: { sessionId },
      orderBy: [{ seq: "asc" }, { startedAt: "asc" }],
      select: { id: true, path: true, title: true, startedAt: true, engagedMs: true, scrollPct: true },
      take: 300,
    }),
    prisma.analyticsEvent.findMany({
      where: { sessionId, name: { not: "web_vital" } },
      orderBy: { ts: "asc" },
      select: { id: true, name: true, path: true, ts: true, props: true, value: true },
      take: 500,
    }),
    prisma.analyticsSession.count({ where: { visitorId: session.visitorId } }),
  ]);
  return { session, pages, events, visitorSessions: otherSessions };
}

// ─── Technical performance ────────────────────────────────────────────────

async function performance(f: AnalyticsFilter) {
  const where = Prisma.sql`${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)} AND ${scopeWhere(f, "e")}`;
  const [vitals, byDevice, byPage, errors, failed, lcpConversion] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."props"->>'metric' AS metric, count(*)::int AS n,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value")::float8 AS p75,
             count(*) FILTER (WHERE e."props"->>'rating' = 'good')::int AS good,
             count(*) FILTER (WHERE e."props"->>'rating' = 'needs-improvement')::int AS ni,
             count(*) FILTER (WHERE e."props"->>'rating' = 'poor')::int AS poor
      FROM "AnalyticsEvent" e WHERE e."name" = 'web_vital' AND e."value" IS NOT NULL AND ${where}
      GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."device" AS device, e."props"->>'metric' AS metric, count(*)::int AS n,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value")::float8 AS p75
      FROM "AnalyticsEvent" e WHERE e."name" = 'web_vital' AND e."value" IS NOT NULL AND ${where}
      GROUP BY 1, 2
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."path", count(*) FILTER (WHERE e."props"->>'metric' = 'LCP')::int AS n,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value") FILTER (WHERE e."props"->>'metric' = 'LCP')::float8 AS lcp,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value") FILTER (WHERE e."props"->>'metric' = 'INP')::float8 AS inp,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value") FILTER (WHERE e."props"->>'metric' = 'CLS')::float8 AS cls,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."value") FILTER (WHERE e."props"->>'metric' = 'TTFB')::float8 AS ttfb
      FROM "AnalyticsEvent" e WHERE e."name" = 'web_vital' AND e."value" IS NOT NULL AND e."path" IS NOT NULL AND ${where}
      GROUP BY 1
      HAVING count(*) FILTER (WHERE e."props"->>'metric' = 'LCP') >= 3
      ORDER BY lcp DESC NULLS LAST
      LIMIT 25
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."name" AS kind, COALESCE(e."props"->>'message', e."props"->>'url', e."props"->>'tag') AS message,
             max(e."props"->>'source') AS source, count(*)::int AS n, count(DISTINCT e."sessionId")::int AS sessions,
             count(DISTINCT e."path")::int AS pages, max(e."path") AS sample_path, max(e."ts") AS last_seen
      FROM "AnalyticsEvent" e WHERE e."name" IN ('js_error', 'resource_error') AND ${where}
      GROUP BY 1, 2 ORDER BY n DESC LIMIT 30
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."props"->>'url' AS url, (e."props"->>'status')::int AS status, max(e."props"->>'type') AS type,
             count(*)::int AS n, count(DISTINCT e."sessionId")::int AS sessions, max(e."path") AS sample_path, max(e."ts") AS last_seen
      FROM "AnalyticsEvent" e WHERE e."name" = 'request_failed' AND ${where}
      GROUP BY 1, 2 ORDER BY n DESC LIMIT 30
    `,
    // Does a slow first paint cost engagement / conversions? Sessions grouped by their landing page's LCP rating.
    prisma.$queryRaw<Record<string, unknown>[]>`
      WITH first_lcp AS (
        SELECT DISTINCT ON (e."sessionId") e."sessionId", e."props"->>'rating' AS rating
        FROM "AnalyticsEvent" e
        WHERE e."name" = 'web_vital' AND e."props"->>'metric' = 'LCP' AND e."sessionId" IS NOT NULL AND ${where}
        ORDER BY e."sessionId", e."ts" ASC
      )
      SELECT l.rating, count(*)::int AS sessions, count(*) FILTER (WHERE s."engaged")::int AS engaged,
             count(*) FILTER (WHERE s."converted")::int AS converted
      FROM first_lcp l JOIN "AnalyticsSession" s ON s."id" = l."sessionId"
      GROUP BY 1
    `,
  ]);

  return {
    vitals: vitals.map((r) => ({ metric: String(r.metric), n: num(r.n), p75: num(r.p75), good: num(r.good), ni: num(r.ni), poor: num(r.poor) })),
    byDevice: byDevice.map((r) => ({ device: String(r.device), metric: String(r.metric), n: num(r.n), p75: num(r.p75) })),
    byPage: byPage.map((r) => ({
      path: String(r.path),
      n: num(r.n),
      lcp: r.lcp === null ? null : num(r.lcp),
      inp: r.inp === null ? null : num(r.inp),
      cls: r.cls === null ? null : num(r.cls),
      ttfb: r.ttfb === null ? null : num(r.ttfb),
    })),
    errors: errors.map((r) => ({
      kind: String(r.kind),
      message: r.message ? String(r.message) : "—",
      source: r.source ? String(r.source) : null,
      n: num(r.n),
      sessions: num(r.sessions),
      pages: num(r.pages),
      samplePath: r.sample_path ? String(r.sample_path) : null,
      lastSeen: new Date(r.last_seen as Date).toISOString(),
    })),
    failed: failed.map((r) => ({
      url: r.url ? String(r.url) : "—",
      status: num(r.status),
      type: r.type ? String(r.type) : null,
      n: num(r.n),
      sessions: num(r.sessions),
      samplePath: r.sample_path ? String(r.sample_path) : null,
      lastSeen: new Date(r.last_seen as Date).toISOString(),
    })),
    lcpConversion: lcpConversion.map((r) => ({ rating: String(r.rating), sessions: num(r.sessions), engaged: num(r.engaged), converted: num(r.converted) })),
  };
}

export const getPerformance = cachedQuery("performance", performance);

// ─── Event explorer ───────────────────────────────────────────────────────

export type EventQuery = { name: string | null; q: string | null; page: number };

async function events(f: AnalyticsFilter, query: EventQuery) {
  const pageSize = 50;
  const parts: Prisma.Sql[] = [rangeSql(Prisma.sql`e."ts"`, f.from, f.to), scopeWhere(f, "e")];
  if (query.name) parts.push(Prisma.sql`e."name" = ${query.name}`);
  if (query.q) {
    const like = `%${query.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    parts.push(Prisma.sql`(e."name" ILIKE ${like} OR e."path" ILIKE ${like})`);
  }
  const where = Prisma.join(parts, " AND ");
  const nameWhere = Prisma.join([rangeSql(Prisma.sql`e."ts"`, f.from, f.to), scopeWhere(f, "e")], " AND ");
  const buckets = bucketsFor(f.fromKey, f.toKey, f.granularity);

  const [names, volume, rows, total] = await Promise.all([
    prisma.$queryRaw<{ name: string; n: number; sessions: number }[]>`
      SELECT e."name", count(*)::int AS n, count(DISTINCT e."sessionId")::int AS sessions
      FROM "AnalyticsEvent" e WHERE ${nameWhere} GROUP BY 1 ORDER BY 2 DESC LIMIT 60
    `,
    prisma.$queryRaw<{ bucket: string; n: number }[]>`
      SELECT ${bucketSql(Prisma.sql`e."ts"`, f.granularity)} AS bucket, count(*)::int AS n
      FROM "AnalyticsEvent" e WHERE ${where} GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."id", e."name", e."path", e."ts", e."device", e."scope", e."value", e."props", e."sessionId" IS NOT NULL AS has_session,
             st."name" AS store_name
      FROM "AnalyticsEvent" e LEFT JOIN "Store" st ON st."id" = e."storeId"
      WHERE ${where}
      ORDER BY e."ts" DESC
      LIMIT ${pageSize} OFFSET ${(query.page - 1) * pageSize}
    `,
    prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "AnalyticsEvent" e WHERE ${where}`,
  ]);
  const vol = new Map(volume.map((r) => [r.bucket, num(r.n)]));
  return {
    pageSize,
    total: num(total[0]?.n),
    names: names.map((r) => ({ name: r.name, n: num(r.n), sessions: num(r.sessions) })),
    volume: buckets.map((b) => ({ key: b.key, label: b.label, n: vol.get(b.key) ?? 0 })),
    rows: rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      path: (r.path as string | null) ?? null,
      ts: new Date(r.ts as Date).toISOString(),
      device: (r.device as string | null) ?? null,
      scope: String(r.scope),
      value: r.value === null ? null : num(r.value),
      props: (r.props as Record<string, unknown> | null) ?? null,
      server: String(r.id).startsWith("srv_"),
      storeName: (r.store_name as string | null) ?? null,
    })),
  };
}

export const getEvents = cachedQuery("events", events, 30);

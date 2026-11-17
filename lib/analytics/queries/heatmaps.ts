/**
 * Heatmap data: real click positions (selector + offset inside the element,
 * and the raw page position as a fallback), scroll depths per page view, and
 * per-element interaction counts — always for one page and one layout bucket
 * (desktop ≥ 1024 px, tablet 768–1023, mobile < 768), so positions recorded
 * at one layout are never drawn on another.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DeviceBucket } from "../constants";
import { scopeWhere, type AnalyticsFilter } from "../filters";
import { cachedQuery, num, rangeSql } from "./shared";

// Enough for a dense map; keeps the cached payload well under the 2 MB cache entry limit.
const MAX_CLICKS = 10_000;

const bucketOf = (col: Prisma.Sql) =>
  Prisma.sql`(CASE WHEN ${col} >= 1024 THEN 'desktop' WHEN ${col} >= 768 THEN 'tablet' ELSE 'mobile' END)`;

export type HeatmapPage = {
  path: string;
  views: number;
  clicks: number;
  deadClicks: number;
  rageClicks: number;
  avgScroll: number;
};

/** Pages to pick from, busiest first, with their click volume (all layouts). */
export const getHeatmapPages = cachedQuery("heatmap-pages", async (f: AnalyticsFilter): Promise<HeatmapPage[]> => {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH pv AS (
      SELECT p."path", count(*)::int AS views, avg(p."scrollPct")::float8 AS avg_scroll
      FROM "AnalyticsPageView" p
      WHERE ${rangeSql(Prisma.sql`p."startedAt"`, f.from, f.to)} AND ${scopeWhere({ ...f, device: "all" }, "p")}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 200
    ),
    ck AS (
      SELECT e."path", count(*)::int AS clicks,
             count(*) FILTER (WHERE (e."props"->>'dead')::boolean)::int AS dead,
             count(*) FILTER (WHERE (e."props"->>'rage')::boolean)::int AS rage
      FROM "AnalyticsEvent" e
      WHERE e."name" = 'click' AND ${rangeSql(Prisma.sql`e."ts"`, f.from, f.to)} AND ${scopeWhere({ ...f, device: "all" }, "e")}
      GROUP BY 1
    )
    SELECT pv."path", pv.views, pv.avg_scroll, COALESCE(ck.clicks, 0)::int AS clicks,
           COALESCE(ck.dead, 0)::int AS dead, COALESCE(ck.rage, 0)::int AS rage
    FROM pv LEFT JOIN ck ON ck."path" = pv."path"
    ORDER BY pv.views DESC
  `;
  return rows.map((r) => ({
    path: String(r.path),
    views: num(r.views),
    clicks: num(r.clicks),
    deadClicks: num(r.dead),
    rageClicks: num(r.rage),
    avgScroll: num(r.avg_scroll),
  }));
});

export type HeatmapClick = {
  /** Selector index into `selectors`, or -1. */
  s: number;
  ex: number | null;
  ey: number | null;
  x: number;
  y: number;
  dh: number | null;
  dead: boolean;
  rage: boolean;
};

export type HeatmapElement = {
  sel: string;
  label: string | null;
  tag: string | null;
  href: string | null;
  clicks: number;
  sessions: number;
  dead: number;
  byBucket: Record<DeviceBucket, number>;
};

export type HeatmapData = {
  path: string;
  bucket: DeviceBucket;
  /** Page views of this page at this layout (the denominator for click and scroll rates). */
  views: number;
  /** Page views at each layout (for the layout switcher). */
  viewsByBucket: Record<DeviceBucket, number>;
  selectors: string[];
  clicks: HeatmapClick[];
  /** True when there were more clicks than were loaded (the newest are shown). */
  truncated: boolean;
  totalClicks: number;
  scroll: number[];
  /** Median page height recorded at this layout, px. */
  medianDocHeight: number | null;
  medianViewportH: number | null;
  elements: HeatmapElement[];
};

async function heatmap(f: AnalyticsFilter, path: string, bucket: DeviceBucket): Promise<HeatmapData> {
  const scope = scopeWhere({ ...f, device: "all" }, "e");
  const pScope = scopeWhere({ ...f, device: "all" }, "p");
  const eRange = rangeSql(Prisma.sql`e."ts"`, f.from, f.to);
  const pRange = rangeSql(Prisma.sql`p."startedAt"`, f.from, f.to);

  const [views, clicks, total, scroll, elements] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${bucketOf(Prisma.sql`p."viewportW"`)} AS b, count(*)::int AS n,
             percentile_disc(0.5) WITHIN GROUP (ORDER BY p."docHeight") AS dh,
             percentile_disc(0.5) WITHIN GROUP (ORDER BY p."viewportH") AS vh
      FROM "AnalyticsPageView" p WHERE p."path" = ${path} AND ${pRange} AND ${pScope}
      GROUP BY 1
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."sel", e."ex", e."ey", e."x", e."y", e."dh",
             COALESCE((e."props"->>'dead')::boolean, false) AS dead, COALESCE((e."props"->>'rage')::boolean, false) AS rage
      FROM "AnalyticsEvent" e
      WHERE e."name" = 'click' AND e."path" = ${path} AND e."x" IS NOT NULL AND ${bucketOf(Prisma.sql`e."vw"`)} = ${bucket}
        AND ${eRange} AND ${scope}
      ORDER BY e."ts" DESC
      LIMIT ${MAX_CLICKS}
    `,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM "AnalyticsEvent" e
      WHERE e."name" = 'click' AND e."path" = ${path} AND e."x" IS NOT NULL AND ${bucketOf(Prisma.sql`e."vw"`)} = ${bucket}
        AND ${eRange} AND ${scope}
    `,
    prisma.$queryRaw<{ sp: number }[]>`
      SELECT p."scrollPct" AS sp FROM "AnalyticsPageView" p
      WHERE p."path" = ${path} AND ${bucketOf(Prisma.sql`p."viewportW"`)} = ${bucket} AND p."scrollPct" > 0 AND ${pRange} AND ${pScope}
      LIMIT 20000
    `,
    // Interaction counts per element across all layouts (with the split), so devices can be compared.
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT e."sel", max(e."props"->>'label') AS label, max(e."props"->>'tag') AS tag, max(e."props"->>'href') AS href,
             count(*)::int AS clicks, count(DISTINCT e."sessionId")::int AS sessions,
             count(*) FILTER (WHERE (e."props"->>'dead')::boolean)::int AS dead,
             count(*) FILTER (WHERE ${bucketOf(Prisma.sql`e."vw"`)} = 'desktop')::int AS desktop,
             count(*) FILTER (WHERE ${bucketOf(Prisma.sql`e."vw"`)} = 'tablet')::int AS tablet,
             count(*) FILTER (WHERE ${bucketOf(Prisma.sql`e."vw"`)} = 'mobile')::int AS mobile
      FROM "AnalyticsEvent" e
      WHERE e."name" = 'click' AND e."path" = ${path} AND e."sel" IS NOT NULL AND ${eRange} AND ${scope}
      GROUP BY 1 ORDER BY clicks DESC LIMIT 60
    `,
  ]);

  const viewsByBucket: Record<DeviceBucket, number> = { desktop: 0, tablet: 0, mobile: 0 };
  let medianDocHeight: number | null = null;
  let medianViewportH: number | null = null;
  for (const row of views) {
    const b = String(row.b) as DeviceBucket;
    viewsByBucket[b] = num(row.n);
    if (b === bucket) {
      medianDocHeight = row.dh === null ? null : num(row.dh);
      medianViewportH = row.vh === null ? null : num(row.vh);
    }
  }

  const selectors: string[] = [];
  const index = new Map<string, number>();
  const points: HeatmapClick[] = clicks.map((r) => {
    let s = -1;
    if (r.sel) {
      const sel = String(r.sel);
      s = index.get(sel) ?? -1;
      if (s === -1) {
        s = selectors.push(sel) - 1;
        index.set(sel, s);
      }
    }
    return {
      s,
      ex: r.ex === null ? null : num(r.ex),
      ey: r.ey === null ? null : num(r.ey),
      x: num(r.x),
      y: num(r.y),
      dh: r.dh === null ? null : num(r.dh),
      dead: r.dead === true,
      rage: r.rage === true,
    };
  });

  return {
    path,
    bucket,
    views: viewsByBucket[bucket],
    viewsByBucket,
    selectors,
    clicks: points,
    truncated: num(total[0]?.n) > points.length,
    totalClicks: num(total[0]?.n),
    scroll: scroll.map((r) => num(r.sp)),
    medianDocHeight,
    medianViewportH,
    elements: elements.map((r) => ({
      sel: String(r.sel),
      label: r.label ? String(r.label) : null,
      tag: r.tag ? String(r.tag) : null,
      href: r.href ? String(r.href) : null,
      clicks: num(r.clicks),
      sessions: num(r.sessions),
      dead: num(r.dead),
      byBucket: { desktop: num(r.desktop), tablet: num(r.tablet), mobile: num(r.mobile) },
    })),
  };
}

export const getHeatmap = cachedQuery("heatmap", heatmap);

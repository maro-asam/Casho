/**
 * Funnel engine: the cohort is every visitor who reached step 1 inside the
 * date range; later steps are looked up up to `windowDays` after the range
 * ends, then ordered per visitor by computeFunnel (lib/analytics/metrics).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AnalyticsFilter } from "../filters";
import { pathPattern, type FunnelDefinition, type FunnelStep } from "../funnels";
import { computeFunnel, type FunnelResult, type StepOccurrence } from "../metrics";
import { cachedQuery, num } from "./shared";

const MAX_COHORT = 50_000;
const DAY_MS = 86_400_000;

function scopeSql(def: FunnelDefinition, f: AnalyticsFilter, alias: string): Prisma.Sql {
  const t = Prisma.raw(`"${alias}"`);
  const parts: Prisma.Sql[] = [];
  if (def.scope === "STOREFRONT") {
    parts.push(Prisma.sql`${t}."scope" = 'STOREFRONT'`);
    if (f.storeId) parts.push(Prisma.sql`${t}."storeId" = ${f.storeId}`);
  } else {
    // A Casho journey crosses the site (signup pages) and the dashboard.
    parts.push(Prisma.sql`${t}."scope" IN ('MARKETING', 'APP')`);
  }
  if (f.device !== "all") parts.push(Prisma.sql`${t}."device" = ${f.device}`);
  return Prisma.join(parts, " AND ");
}

type Window = { from: Date; until: Date };

async function occurrences(step: FunnelStep, def: FunnelDefinition, f: AnalyticsFilter, w: Window, cohort: string[] | null) {
  const inCohort = (col: Prisma.Sql) => (cohort ? Prisma.sql`AND ${col} = ANY(${cohort}::text[])` : Prisma.empty);

  if (step.type === "page") {
    const pattern = pathPattern(step.value);
    const pathSql =
      pattern.kind === "any" ? Prisma.empty : pattern.kind === "prefix" ? Prisma.sql`AND p."path" LIKE ${pattern.like}` : Prisma.sql`AND p."path" = ${pattern.path}`;
    return prisma.$queryRaw<{ v: string; at: Date }[]>`
      SELECT p."visitorId" AS v, min(p."startedAt") AS at
      FROM "AnalyticsPageView" p
      WHERE p."startedAt" >= ${w.from} AND p."startedAt" < ${w.until} AND ${scopeSql(def, f, "p")} ${pathSql} ${inCohort(Prisma.sql`p."visitorId"`)}
      GROUP BY p."visitorId", p."sessionId"
    `;
  }

  if (step.type === "event") {
    const prop = step.propKey && step.propValue ? Prisma.sql`AND e."props"->>${step.propKey} = ${step.propValue}` : Prisma.empty;
    return prisma.$queryRaw<{ v: string; at: Date }[]>`
      SELECT e."visitorId" AS v, e."ts" AS at
      FROM "AnalyticsEvent" e
      WHERE e."name" = ${step.value} AND e."visitorId" IS NOT NULL AND e."ts" >= ${w.from} AND e."ts" < ${w.until}
        AND ${scopeSql(def, f, "e")} ${prop} ${inCohort(Prisma.sql`e."visitorId"`)}
      LIMIT 200000
    `;
  }

  // Verified steps: visitor → account (AnalyticsIdentity) → the record itself.
  const ids = cohort ?? [];
  if (!ids.length && step.value !== "order_placed") return [];
  const range = (col: Prisma.Sql) => Prisma.sql`${col} >= ${w.from} AND ${col} < ${w.until}`;
  switch (step.value) {
    case "signup":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v, u."createdAt" AS at
        FROM "AnalyticsIdentity" ai JOIN "User" u ON u."id" = ai."userId"
        WHERE ai."visitorId" = ANY(${ids}::text[]) AND ${range(Prisma.sql`u."createdAt"`)}
      `;
    case "store_created":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v, st."createdAt" AS at
        FROM "AnalyticsIdentity" ai JOIN "Store" st ON st."userId" = ai."userId"
        WHERE ai."visitorId" = ANY(${ids}::text[]) AND ${range(Prisma.sql`st."createdAt"`)}
      `;
    case "plan_selected":
      // When it happened: the recorded selection, else the first subscription charge, else the store's creation.
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v,
               COALESCE(
                 (SELECT min(e."ts") FROM "AnalyticsEvent" e WHERE e."name" = 'subscription_selected' AND e."refId" = st."id"),
                 (SELECT min(bt."createdAt") FROM "BalanceTransaction" bt WHERE bt."storeId" = st."id" AND bt."type" = 'SUBSCRIPTION_CHARGE'),
                 st."createdAt"
               ) AS at
        FROM "AnalyticsIdentity" ai JOIN "Store" st ON st."userId" = ai."userId" AND st."planSelected"
        WHERE ai."visitorId" = ANY(${ids}::text[])
      `;
    case "payment_initiated":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v, tr."createdAt" AS at
        FROM "AnalyticsIdentity" ai JOIN "Store" st ON st."userId" = ai."userId" JOIN "TopupRequest" tr ON tr."storeId" = st."id"
        WHERE ai."visitorId" = ANY(${ids}::text[]) AND ${range(Prisma.sql`tr."createdAt"`)}
      `;
    case "payment_completed":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v, bt."createdAt" AS at
        FROM "AnalyticsIdentity" ai JOIN "Store" st ON st."userId" = ai."userId"
        JOIN "BalanceTransaction" bt ON bt."storeId" = st."id" AND bt."type" = 'TOPUP' AND bt."amount" > 0
        WHERE ai."visitorId" = ANY(${ids}::text[]) AND ${range(Prisma.sql`bt."createdAt"`)}
      `;
    case "paid_subscription":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT ai."visitorId" AS v, bt."createdAt" AS at
        FROM "AnalyticsIdentity" ai JOIN "Store" st ON st."userId" = ai."userId"
        JOIN "BalanceTransaction" bt ON bt."storeId" = st."id" AND bt."type" = 'SUBSCRIPTION_CHARGE'
        WHERE ai."visitorId" = ANY(${ids}::text[]) AND ${range(Prisma.sql`bt."createdAt"`)}
      `;
    case "order_placed":
      return prisma.$queryRaw<{ v: string; at: Date }[]>`
        SELECT e."visitorId" AS v, e."ts" AS at
        FROM "AnalyticsEvent" e JOIN "Order" o ON o."id" = e."refId" AND o."status" <> 'CANCELED'
        WHERE e."name" = 'order_placed' AND e."visitorId" IS NOT NULL AND ${range(Prisma.sql`e."ts"`)}
          AND ${scopeSql(def, f, "e")} ${inCohort(Prisma.sql`e."visitorId"`)}
      `;
  }
}

export type FunnelReport = FunnelResult & { cohort: number; truncated: boolean };

async function runFunnel(def: FunnelDefinition, f: AnalyticsFilter): Promise<FunnelReport> {
  const until = new Date(f.to.getTime() + def.windowDays * DAY_MS);
  const first = await occurrences(def.steps[0], def, f, { from: f.from, until: f.to }, null);
  const visitors = [...new Set(first.map((r) => r.v))];
  const truncated = visitors.length > MAX_COHORT;
  const cohort = truncated ? visitors.slice(0, MAX_COHORT) : visitors;
  const keep = new Set(cohort);

  const all: StepOccurrence[] = first.filter((r) => keep.has(r.v)).map((r) => ({ visitorId: r.v, step: 0, at: new Date(r.at).getTime() }));
  if (cohort.length) {
    const rest = await Promise.all(def.steps.slice(1).map((step) => occurrences(step, def, f, { from: f.from, until }, cohort)));
    rest.forEach((rows, i) => {
      for (const r of rows) all.push({ visitorId: r.v, step: i + 1, at: new Date(r.at).getTime() });
    });
  }
  const result = computeFunnel(def.steps.length, all, def.windowDays * DAY_MS);
  return { ...result, cohort: cohort.length, truncated };
}

export const getFunnelReport = cachedQuery("funnel", runFunnel);

/** Saved funnels (custom), newest first. */
export async function listCustomFunnels() {
  const rows = await prisma.analyticsFunnel.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((r) => ({ ...r, windowDays: num(r.windowDays) }));
}

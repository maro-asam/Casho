/**
 * Retention: raw page views/events past `rawRetentionDays` and session
 * summaries (+ visitor ↔ account links) past `sessionRetentionDays` are
 * deleted by the hourly cron (renew-subscriptions). Batched, so one run never
 * holds long locks; a backlog clears over a few runs.
 */
import { prisma } from "@/lib/prisma";
import { getAnalyticsSettings } from "./settings";

const BATCH = 5_000;
const MAX_BATCHES = 20;
const DAY_MS = 86_400_000;

async function deleteBatched(run: () => Promise<number>) {
  let total = 0;
  for (let i = 0; i < MAX_BATCHES; i++) {
    const n = await run();
    total += n;
    if (n < BATCH) break;
  }
  return total;
}

export async function sweepAnalytics(now = new Date()) {
  const settings = await getAnalyticsSettings();
  const rawCutoff = new Date(now.getTime() - settings.rawRetentionDays * DAY_MS);
  const sessionCutoff = new Date(now.getTime() - settings.sessionRetentionDays * DAY_MS);

  const events = await deleteBatched(() =>
    prisma.$executeRaw`DELETE FROM "AnalyticsEvent" WHERE "id" IN (SELECT "id" FROM "AnalyticsEvent" WHERE "ts" < ${rawCutoff} LIMIT ${BATCH})`,
  );
  const pageviews = await deleteBatched(() =>
    prisma.$executeRaw`DELETE FROM "AnalyticsPageView" WHERE "id" IN (SELECT "id" FROM "AnalyticsPageView" WHERE "startedAt" < ${rawCutoff} LIMIT ${BATCH})`,
  );
  const sessions = await deleteBatched(() =>
    prisma.$executeRaw`DELETE FROM "AnalyticsSession" WHERE "id" IN (SELECT "id" FROM "AnalyticsSession" WHERE "startedAt" < ${sessionCutoff} LIMIT ${BATCH})`,
  );
  const identities = await prisma.analyticsIdentity.deleteMany({ where: { createdAt: { lt: sessionCutoff } } });

  return { events, pageviews, sessions, identities: identities.count };
}

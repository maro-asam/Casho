/**
 * The collector behind POST /api/e: tenancy, staff exclusion and the database
 * writes for one validated batch. Two round trips per batch: an upsert of the
 * session (which also tells whether it is new), then one transaction with the
 * page views, events, page updates and the session's recomputed counters —
 * recomputed, not incremented, so a retried batch can't count twice.
 */
import { createHash } from "node:crypto";
import { Prisma, UserRole } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { ENGAGED_MS, ENGAGED_PAGEVIEWS, LIMITS } from "./constants";
import type { NormalisedBatch } from "./ingest";
import type { PageTenant } from "./tenant";

// ─── Store lookup (cached per instance) ───────────────────────────────────

type StoreRef = { id: string; slug: string };
const STORE_TTL_MS = 5 * 60_000;
const storeCache = new Map<string, { value: StoreRef | null; expires: number }>();

export async function resolveTenantStore(tenant: Extract<PageTenant, { kind: "store" }>): Promise<StoreRef | null> {
  const key = tenant.by === "slug" ? `s:${tenant.slug}` : `d:${tenant.domain}`;
  const hit = storeCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: StoreRef | null = null;
  if (tenant.by === "slug") {
    value = await prisma.store.findUnique({ where: { slug: tenant.slug }, select: { id: true, slug: true } });
  } else {
    const bare = tenant.domain.replace(/^www\./, "");
    value = await prisma.store.findFirst({
      where: { customDomain: { in: [bare, `www.${bare}`] }, customDomainStatus: "ACTIVE" },
      select: { id: true, slug: true },
    });
  }
  if (storeCache.size > 2_000) storeCache.clear();
  storeCache.set(key, { value, expires: Date.now() + STORE_TTL_MS });
  return value;
}

// ─── Who is behind the visit (first batch of a session only) ───────────────

export type Viewer = { userId: string; staff: boolean; ownsStore: boolean } | null;

/**
 * Reads the Casho login cookie without touching the session (no renewal, no
 * lastUsedAt write): staff and a store's own team are left out of the numbers,
 * and dashboard visits are tied to the merchant's account.
 */
export async function readViewer(sessionToken: string | undefined, storeId: string | null): Promise<Viewer> {
  if (!sessionToken) return null;
  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          role: true,
          ...(storeId && {
            stores: { where: { id: storeId }, select: { id: true }, take: 1 },
            storeMembers: { where: { storeId }, select: { id: true }, take: 1 },
          }),
        },
      },
    },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const user = session.user as typeof session.user & { stores?: unknown[]; storeMembers?: unknown[] };
  return {
    userId: user.id,
    staff: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SALES,
    ownsStore: !!storeId && ((user.stores?.length ?? 0) > 0 || (user.storeMembers?.length ?? 0) > 0),
  };
}

export { SESSION_COOKIE_NAME };

// ─── Writes ───────────────────────────────────────────────────────────────

export type WriteResult = { ok: true; newSession: boolean } | { ok: false; reason: "session_mismatch" };

export async function writeBatch(batch: NormalisedBatch, opts: { countVisit: boolean }): Promise<WriteResult> {
  const s = batch.session;

  const upserted = await prisma.$queryRaw<{ inserted: boolean; events: number; pageviews: number }[]>`
    INSERT INTO "AnalyticsSession" (
      "id", "visitorId", "scope", "storeId", "startedAt", "lastSeenAt", "isReturning", "entryPath", "exitPath",
      "channel", "source", "referrerHost", "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
      "device", "browser", "os", "screen", "viewportW", "viewportH", "language", "country", "region", "city", "userId"
    ) VALUES (
      ${s.id}, ${s.visitorId}, ${s.scope}::"AnalyticsScope", ${s.storeId}, ${s.startedAt}, ${s.lastSeenAt}, ${s.isReturning},
      ${s.entryPath}, ${s.exitPath}, ${s.channel}, ${s.source}, ${s.referrerHost}, ${s.utmSource}, ${s.utmMedium}, ${s.utmCampaign},
      ${s.utmContent}, ${s.utmTerm}, ${s.device}, ${s.browser}, ${s.os}, ${s.screen}, ${s.viewportW}, ${s.viewportH},
      ${s.language}, ${s.country}, ${s.region}, ${s.city}, ${s.userId}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "lastSeenAt" = GREATEST("AnalyticsSession"."lastSeenAt", EXCLUDED."lastSeenAt"),
      "userId" = COALESCE("AnalyticsSession"."userId", EXCLUDED."userId")
    -- A session id is only ever continued by the browser (and store) that started it.
    WHERE "AnalyticsSession"."visitorId" = EXCLUDED."visitorId"
      AND "AnalyticsSession"."storeId" IS NOT DISTINCT FROM EXCLUDED."storeId"
    RETURNING (xmax = 0) AS "inserted", "events", "pageviews"
  `;
  const row = upserted[0];
  if (!row) return { ok: false, reason: "session_mismatch" };

  // Caps: a runaway page (or a script) can't grow one session without bound.
  const pageviews = row.pageviews >= LIMITS.maxPageviewsPerSession ? [] : batch.pageviews;
  const events = row.events >= LIMITS.maxEventsPerSession ? [] : batch.events;

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (pageviews.length) {
    writes.push(prisma.analyticsPageView.createMany({ data: pageviews, skipDuplicates: true }));
  }
  if (events.length) {
    writes.push(
      prisma.analyticsEvent.createMany({
        data: events.map(({ props, ...e }) => ({ ...e, props: props ?? Prisma.DbNull })),
        skipDuplicates: true,
      }),
    );
  }
  if (batch.updates.length) {
    // Running totals only ever grow, so an old update arriving late changes nothing.
    writes.push(prisma.$executeRaw`
      UPDATE "AnalyticsPageView" AS p SET
        "engagedMs" = GREATEST(p."engagedMs", u.em),
        "scrollPct" = GREATEST(p."scrollPct", u.sp),
        "docHeight" = COALESCE(u.dh, p."docHeight")
      FROM jsonb_to_recordset(${JSON.stringify(
        batch.updates.map((u) => ({ id: u.id, em: u.engagedMs, sp: u.scrollPct, dh: u.docHeight })),
      )}::jsonb) AS u(id text, em int, sp int, dh int)
      WHERE p."id" = u.id AND p."sessionId" = ${s.id}
    `);
  }
  writes.push(prisma.$executeRaw`
    UPDATE "AnalyticsSession" AS s SET
      "pageviews" = a.pv,
      "engagedMs" = a.em,
      "exitPath" = COALESCE(a.exit_path, s."exitPath"),
      "events" = (SELECT count(*)::int FROM "AnalyticsEvent" e WHERE e."sessionId" = s."id"),
      "engaged" = (a.pv >= ${ENGAGED_PAGEVIEWS} OR a.em >= ${ENGAGED_MS} OR s."converted")
    FROM (
      SELECT count(*)::int AS pv,
             COALESCE(sum("engagedMs"), 0)::int AS em,
             (array_agg("path" ORDER BY "seq" DESC, "startedAt" DESC))[1] AS exit_path
      FROM "AnalyticsPageView" WHERE "sessionId" = ${s.id}
    ) AS a
    WHERE s."id" = ${s.id}
  `);
  if (row.inserted && opts.countVisit && s.scope === "STOREFRONT" && s.storeId) {
    // The merchant's own visit counter (dashboard overview + reports) — one per session.
    writes.push(prisma.visit.create({ data: { storeId: s.storeId, visitorId: s.visitorId } }));
  }
  await prisma.$transaction(writes);

  return { ok: true, newSession: row.inserted };
}

/** Count-only storefront visit (no ids): the merchant's counter keeps working without analytics consent. */
export async function countAnonymousVisit(storeId: string) {
  await prisma.visit.create({ data: { storeId } });
}

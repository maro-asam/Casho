/**
 * Server-verified analytics events: recorded only after the database write
 * they describe succeeded (an account exists, a store exists, an order
 * exists) — the browser can never send these names. They tie the visit
 * (from the first-party cookie) to the account, which is how traffic is
 * attributed to signups, paid subscriptions and revenue.
 *
 * Every function here swallows its errors: analytics never breaks signup,
 * login or checkout.
 */
import { cookies } from "next/headers";
import { Prisma, type AnalyticsScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COOKIE_MAIN, COOKIE_STORE_PREFIX, ID_PATTERN, storeCookieKey } from "./constants";

export type VisitRef = { visitorId: string; sessionId: string };

/** "<visitor>.<session>.<last>.<seq>.<start>.<sampled>" → ids, or null when absent/garbled. */
export function parseVisitCookie(value: string | undefined | null): VisitRef | null {
  if (!value) return null;
  const [visitorId, sessionId] = value.split(".");
  if (!visitorId || !sessionId || !ID_PATTERN.test(visitorId) || !ID_PATTERN.test(sessionId)) return null;
  return { visitorId, sessionId };
}

/** The visit behind the current request on Casho's site/app, if the visitor is being measured. */
export async function readMainVisit(): Promise<VisitRef | null> {
  try {
    return parseVisitCookie((await cookies()).get(COOKIE_MAIN)?.value);
  } catch {
    return null;
  }
}

/** The shopper's visit on one store (cookie is per store and per host). */
export async function readStoreVisit(storeId: string): Promise<VisitRef | null> {
  try {
    return parseVisitCookie((await cookies()).get(`${COOKIE_STORE_PREFIX}${storeCookieKey(storeId)}`)?.value);
  } catch {
    return null;
  }
}

type ServerEvent = {
  name: string;
  scope: AnalyticsScope;
  /** Deterministic: the same fact is recorded once (`signup_completed` for user X). */
  dedupeKey: string;
  storeId?: string | null;
  refId?: string | null;
  value?: number | null;
  props?: Record<string, string | number | boolean>;
  visit?: VisitRef | null;
};

/** Session ids are only trusted if the session row exists and belongs to that visitor (and store). */
async function verifiedSession(visit: VisitRef | null | undefined, storeId: string | null) {
  if (!visit) return null;
  const row = await prisma.analyticsSession.findUnique({
    where: { id: visit.sessionId },
    select: { id: true, visitorId: true, storeId: true, exitPath: true, device: true },
  });
  if (!row || row.visitorId !== visit.visitorId || row.storeId !== storeId) return null;
  return row;
}

export async function recordServerEvent(event: ServerEvent): Promise<void> {
  try {
    const storeId = event.storeId ?? null;
    const session = await verifiedSession(event.visit, storeId);
    await prisma.analyticsEvent.createMany({
      data: [
        {
          id: `srv_${event.dedupeKey}`.slice(0, 120),
          sessionId: session?.id ?? null,
          visitorId: session?.visitorId ?? null,
          scope: event.scope,
          storeId,
          name: event.name,
          path: session?.exitPath ?? null,
          ts: new Date(),
          device: session?.device ?? null,
          value: event.value ?? null,
          refId: event.refId ?? null,
          props: event.props ?? Prisma.DbNull,
        },
      ],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error(`[analytics] server event ${event.name}`, error);
  }
}

/** Marks the visit as converted (signup / order) — it then counts as engaged. */
async function markConverted(sessionId: string) {
  await prisma.analyticsSession.update({
    where: { id: sessionId },
    data: { converted: true, engaged: true },
  });
}

/**
 * After a successful signup: link this browser to the new account and record
 * the verified `signup_completed` + `store_created` facts.
 */
export async function recordSignup(input: { userId: string; storeId: string | null; method: "email" | "google" }) {
  try {
    const visit = await readMainVisit();
    const session = await verifiedSession(visit, null);
    if (visit) {
      await prisma.analyticsIdentity.upsert({
        where: { visitorId_userId: { visitorId: visit.visitorId, userId: input.userId } },
        create: { visitorId: visit.visitorId, userId: input.userId, kind: "signup", sessionId: session?.id ?? null },
        update: {},
      });
    }
    if (session) {
      await prisma.analyticsSession.update({ where: { id: session.id }, data: { userId: input.userId, converted: true, engaged: true } });
    }
    await recordServerEvent({
      name: "signup_completed",
      scope: "MARKETING",
      dedupeKey: `signup_completed_${input.userId}`,
      refId: input.userId,
      props: { method: input.method },
      visit,
    });
    if (input.storeId) {
      await recordServerEvent({
        name: "store_created",
        scope: "MARKETING",
        dedupeKey: `store_created_${input.storeId}`,
        refId: input.storeId,
        visit,
      });
    }
  } catch (error) {
    console.error("[analytics] signup", error);
  }
}

/** After a successful login: remember that this browser belongs to the account (attribution across devices). */
export async function recordLogin(input: { userId: string; method: "email" | "google" }) {
  try {
    const visit = await readMainVisit();
    if (!visit) return;
    const session = await verifiedSession(visit, null);
    await prisma.analyticsIdentity.upsert({
      where: { visitorId_userId: { visitorId: visit.visitorId, userId: input.userId } },
      create: { visitorId: visit.visitorId, userId: input.userId, kind: "login", sessionId: session?.id ?? null },
      update: {},
    });
    if (session) await prisma.analyticsSession.update({ where: { id: session.id }, data: { userId: input.userId } });
    await recordServerEvent({
      name: "login",
      scope: "MARKETING",
      // One per session (logging in twice in a visit is one fact).
      dedupeKey: `login_${input.userId}_${visit.sessionId}`,
      refId: input.userId,
      props: { method: input.method },
      visit,
    });
  } catch (error) {
    console.error("[analytics] login", error);
  }
}

/** A storefront order was created — ties it to the shopper's visit (revenue by source). */
export async function recordStoreOrder(input: { storeId: string; orderId: string; total: number }) {
  try {
    const visit = await readStoreVisit(input.storeId);
    const session = await verifiedSession(visit, input.storeId);
    await recordServerEvent({
      name: "order_placed",
      scope: "STOREFRONT",
      dedupeKey: `order_placed_${input.orderId}`,
      storeId: input.storeId,
      refId: input.orderId,
      value: input.total,
      visit,
    });
    if (session) await markConverted(session.id);
  } catch (error) {
    console.error("[analytics] order", error);
  }
}

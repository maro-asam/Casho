import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(() => "exec"),
  $transaction: vi.fn(async (ops: unknown[]) => ops),
  analyticsPageView: { createMany: vi.fn(() => "pv") },
  analyticsEvent: { createMany: vi.fn(() => "ev") },
  visit: { create: vi.fn(() => "visit") },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { writeBatch } = await import("./collector");
import type { NormalisedBatch } from "./ingest";

const session: NormalisedBatch["session"] = {
  id: "s".repeat(22),
  visitorId: "v".repeat(22),
  scope: "STOREFRONT",
  storeId: "store-1",
  startedAt: new Date(),
  lastSeenAt: new Date(),
  isReturning: false,
  entryPath: "/",
  exitPath: "/",
  channel: "direct",
  source: "(direct)",
  referrerHost: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  device: "mobile",
  browser: "Chrome",
  os: "Android",
  screen: null,
  viewportW: 390,
  viewportH: 800,
  language: "ar",
  country: "EG",
  region: null,
  city: null,
  userId: null,
};

const pv = { id: "p".repeat(22), sessionId: session.id, visitorId: session.visitorId, scope: "STOREFRONT" as const, storeId: "store-1", path: "/", title: null, query: null, prevPath: null, seq: 1, startedAt: new Date(), docHeight: null, viewportW: 390, viewportH: 800, device: "mobile" };
const ev = { id: "e".repeat(22), sessionId: session.id, visitorId: session.visitorId, scope: "STOREFRONT" as const, storeId: "store-1", name: "click", path: "/", ts: new Date(), device: "mobile", x: null, y: null, vw: 390, dh: null, sel: "body", ex: null, ey: null, value: null, props: null };

beforeEach(() => vi.clearAllMocks());

describe("collector writes", () => {
  it("a session id continued by another browser or store is refused", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([]);
    const res = await writeBatch({ session, pageviews: [pv], updates: [], events: [ev], dropped: 0 }, { countVisit: true });
    expect(res).toEqual({ ok: false, reason: "session_mismatch" });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("new storefront session: rows are de-duplicated and the merchant's visit counter ticks once", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ inserted: true, events: 0, pageviews: 0 }]);
    const res = await writeBatch({ session, pageviews: [pv], updates: [{ id: pv.id, engagedMs: 1000, scrollPct: 40, docHeight: 2000 }], events: [ev], dropped: 0 }, { countVisit: true });
    expect(res).toEqual({ ok: true, newSession: true });
    expect(prismaMock.analyticsPageView.createMany).toHaveBeenCalledWith({ data: [pv], skipDuplicates: true });
    expect(prismaMock.analyticsEvent.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prismaMock.visit.create).toHaveBeenCalledWith({ data: { storeId: "store-1", visitorId: session.visitorId } });
    // page views + events + page update + session recompute + visit, in one transaction
    expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(5);
  });

  it("a continuing session (or a count already made before consent) doesn't count a second visit", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ inserted: false, events: 3, pageviews: 1 }]);
    await writeBatch({ session, pageviews: [], updates: [], events: [ev], dropped: 0 }, { countVisit: true });
    expect(prismaMock.visit.create).not.toHaveBeenCalled();
    prismaMock.$queryRaw.mockResolvedValueOnce([{ inserted: true, events: 0, pageviews: 0 }]);
    await writeBatch({ session, pageviews: [pv], updates: [], events: [], dropped: 0 }, { countVisit: false });
    expect(prismaMock.visit.create).not.toHaveBeenCalled();
  });

  it("runaway sessions stop growing at the caps", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ inserted: false, events: 1500, pageviews: 300 }]);
    await writeBatch({ session, pageviews: [pv], updates: [], events: [ev], dropped: 0 }, { countVisit: true });
    expect(prismaMock.analyticsPageView.createMany).not.toHaveBeenCalled();
    expect(prismaMock.analyticsEvent.createMany).not.toHaveBeenCalled();
    // The session's counters are still recomputed (idempotent).
    expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(1);
  });
});

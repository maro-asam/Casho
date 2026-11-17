import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import type { AnalyticsScopeName } from "./constants";
import { parseAnalyticsFilter, scopeWhere } from "./filters";
import { normaliseBatch, type IngestContext } from "./ingest";
import { computeFunnel, deriveRates, depthReachedBy, journeyKey, pctChange, percentile, ratio, scrollReach, topJourneys, transitions, vitalRating } from "./metrics";
import { DEFAULT_ANALYTICS_SETTINGS, publicConfig } from "./settings";
import { resolvePageTenant } from "./tenant";
import type { Batch } from "./wire";

const NOW = Date.parse("2026-11-18T12:00:00Z");
const VID = "v".repeat(22);
const SID = "s".repeat(22);
const id = (n: number) => `id${String(n).padStart(20, "0")}`;

function ctx(overrides: Partial<IngestContext> = {}): IngestContext {
  const scopeOf = (pathname: string): AnalyticsScopeName | null => {
    const t = resolvePageTenant("app.casho.store", pathname, "casho.store");
    return t.kind === "scope" ? t.scope : null;
  };
  return {
    now: NOW,
    scopeOf,
    storeId: null,
    storeSlugInPath: null,
    ownHosts: ["casho.store", "app.casho.store"],
    ua: { browser: "Chrome", os: "Android", device: "mobile" },
    geo: { country: "EG", region: "C", city: "Cairo" },
    userId: null,
    settings: DEFAULT_ANALYTICS_SETTINGS,
    ...overrides,
  };
}

function batch(e: Batch["e"], ss: Partial<Batch["ss"]> = {}, clientNow = NOW): Batch {
  return { v: 1, now: clientNow, sc: "m", vid: VID, sid: SID, ss: { ts: NOW - 5_000, ret: false, lp: "/register?utm_source=fb&utm_medium=paid&utm_campaign=nov", vw: 390, vh: 800, ...ss }, e };
}

describe("ingestion: what is kept, dropped and masked", () => {
  it("builds the session from the landing page, UTMs and the server's view of the visitor", () => {
    const out = normaliseBatch(batch([{ k: "pv", id: id(1), t: NOW - 4_000, p: "/register?utm_source=fb", q: 1, vw: 390 }]), ctx())!;
    expect(out.session).toMatchObject({
      id: SID,
      visitorId: VID,
      scope: "MARKETING",
      entryPath: "/register",
      channel: "paid_social",
      source: "facebook",
      utmCampaign: "nov",
      device: "mobile",
      country: "EG",
      city: "Cairo",
    });
    expect(out.pageviews).toHaveLength(1);
    expect(out.pageviews[0].query).toBeNull(); // utm_* never stored with the page
  });

  it("corrects client clock skew and drops stale events", () => {
    const skewed = normaliseBatch(batch([{ k: "pv", id: id(1), t: NOW + 3_600_000 - 1_000, p: "/", q: 1, vw: 390 }], {}, NOW + 3_600_000), ctx())!;
    expect(skewed.pageviews[0].startedAt.getTime()).toBe(NOW - 1_000);
    const stale = normaliseBatch(batch([{ k: "pv", id: id(1), t: NOW - 2 * 86_400_000, p: "/", q: 1, vw: 390 }]), ctx())!;
    expect(stale.pageviews).toHaveLength(0);
    expect(stale.dropped).toBe(1);
  });

  it("never accepts server-verified event names from the browser", () => {
    const out = normaliseBatch(
      batch([
        { k: "ev", id: id(1), t: NOW, n: "signup_completed", p: "/register" },
        { k: "ev", id: id(2), t: NOW, n: "order_placed" },
        { k: "ev", id: id(3), t: NOW, n: "cta_clicked", p: "/", pr: { cta: "signup" } },
      ]),
      ctx(),
    )!;
    expect(out.events.map((e) => e.name)).toEqual(["cta_clicked"]);
    expect(out.dropped).toBe(2);
  });

  it("dashboard pages: no titles, no text props, no clicks unless private heatmaps are on", () => {
    const items: Batch["e"] = [
      { k: "pv", id: id(1), t: NOW, p: "/orders/3f2a1c9e-1b2c-4d5e-8f90-123456789abc", ti: "طلب منى علي", q: 2, vw: 1440 },
      { k: "ev", id: id(2), t: NOW, n: "click", p: "/orders", x: 0.5, y: 300, sel: "body>main", pr: { tag: "a", label: "منى علي" } },
      { k: "ev", id: id(3), t: NOW, n: "form_started", p: "/orders", pr: { form: "notes", label: "x" } },
    ];
    const off = normaliseBatch(batch(items, { lp: "/orders" }), ctx())!;
    expect(off.session.scope).toBe("APP");
    expect(off.pageviews[0]).toMatchObject({ path: "/orders/:id", title: null, scope: "APP" });
    expect(off.events.map((e) => e.name)).toEqual(["form_started"]);
    expect(off.events[0].props).toEqual({ form: "notes" });

    const on = normaliseBatch(batch(items, { lp: "/orders" }), ctx({ settings: { ...DEFAULT_ANALYTICS_SETTINGS, heatmapPrivatePages: true } }))!;
    const click = on.events.find((e) => e.name === "click")!;
    expect(click.x).toBe(0.5);
    expect(click.props).toEqual({ tag: "a" });
  });

  it("one session can cross from the signup page (Casho site) into the dashboard", () => {
    const out = normaliseBatch(
      batch([
        { k: "pv", id: id(1), t: NOW - 2_000, p: "/register", q: 1, vw: 390 },
        { k: "pv", id: id(2), t: NOW - 1_000, p: "/onboarding", q: 2, vw: 390 },
        { k: "pv", id: id(3), t: NOW - 500, p: "/admin", q: 3, vw: 390 },
      ]),
      ctx(),
    )!;
    expect(out.pageviews.map((p) => [p.path, p.scope])).toEqual([
      ["/register", "MARKETING"],
      ["/onboarding", "APP"],
    ]);
  });

  it("a batch landing on an internal page is dropped entirely", () => {
    expect(normaliseBatch(batch([], { lp: "/admin/analytics" }), ctx())).toBeNull();
  });

  it("excluded paths, feature switches and masking", () => {
    const settings = { ...DEFAULT_ANALYTICS_SETTINGS, excludedPaths: ["/checkout"], trackErrors: false, heatmapsEnabled: false };
    const out = normaliseBatch(
      batch([
        { k: "pv", id: id(1), t: NOW, p: "/checkout/pay", q: 1, vw: 390 },
        { k: "pv", id: id(2), t: NOW, p: "/pricing?email=a@b.com&plan=pro", q: 2, vw: 390 },
        { k: "ev", id: id(3), t: NOW, n: "js_error", p: "/pricing", pr: { message: "x" } },
        { k: "ev", id: id(4), t: NOW, n: "click", p: "/pricing", x: 0.3, y: 120, ex: 0.5, ey: 0.5, sel: "#cta", pr: { label: "اتصل 01012345678" } },
        { k: "ev", id: id(5), t: NOW, n: "my_custom", p: "/pricing", pr: { note: "mona@example.com" } },
      ]),
      ctx({ settings, scopeOf: () => "MARKETING" }),
    )!;
    expect(out.pageviews.map((p) => p.path)).toEqual(["/pricing"]);
    expect(out.pageviews[0].query).toBe("plan=pro");
    expect(out.events.map((e) => e.name)).toEqual(["click", "my_custom"]);
    const click = out.events[0];
    expect([click.x, click.y, click.ex, click.ey]).toEqual([null, null, null, null]); // heatmaps off → no geometry
    expect(click.sel).toBe("#cta");
    expect(click.props).toEqual({ label: "اتصل [n]" });
    expect(out.events[1].props).toEqual({ note: "[email]" });
  });

  it("storefront batches: everything belongs to the resolved store, /store/<slug> is stripped", () => {
    const out = normaliseBatch(
      { ...batch([{ k: "pv", id: id(1), t: NOW, p: "/store/abc/products/shirt", q: 1, vw: 1440 }], { lp: "/store/abc" }), sc: "s", st: "store-1" },
      ctx({ storeId: "store-1", storeSlugInPath: "abc", scopeOf: () => "STOREFRONT", ownHosts: ["casho.store"] }),
    )!;
    expect(out.session).toMatchObject({ scope: "STOREFRONT", storeId: "store-1", entryPath: "/" });
    expect(out.pageviews[0]).toMatchObject({ storeId: "store-1", path: "/products/shirt" });
  });
});

describe("tenant isolation in queries", () => {
  const sqlOf = (s: Prisma.Sql) => ({ text: s.text, values: s.values });

  it("a store filter always pins scope and store id (as a bound parameter)", () => {
    const f = parseAnalyticsFilter({ store: "3F2A1C9E-1B2C-4D5E-8F90-123456789ABC", scope: "marketing" });
    expect(f.scope).toBe("storefront");
    const { text, values } = sqlOf(scopeWhere(f, "s"));
    expect(text).toContain(`"s"."scope" = 'STOREFRONT'`);
    expect(text).toContain(`"s"."storeId" = $`);
    expect(values).toEqual(["3f2a1c9e-1b2c-4d5e-8f90-123456789abc"]);
  });

  it("garbage store ids are ignored, never interpolated", () => {
    const f = parseAnalyticsFilter({ store: "x' OR 1=1 --" });
    expect(f.storeId).toBeNull();
    expect(sqlOf(scopeWhere(f, "s")).text).toBe(`"s"."scope" = 'MARKETING'`);
  });

  it("alias names are sanitised and devices are parameters", () => {
    const { text, values } = sqlOf(scopeWhere({ scope: "all", storeId: null, device: "mobile" }, `s"; DROP`));
    expect(text).toBe(`"sDROP"."device" = $1`);
    expect(values).toEqual(["mobile"]);
  });
});

describe("date filters", () => {
  const now = new Date("2026-11-18T10:00:00Z"); // 12:00 Cairo
  it("presets resolve to Cairo days, with an equal-length comparison", () => {
    const f = parseAnalyticsFilter({ range: "7d" }, now);
    expect([f.fromKey, f.toKey, f.days]).toEqual(["2026-11-12", "2026-11-18", 7]);
    expect([f.prevFromKey, f.prevToKey]).toEqual(["2026-11-05", "2026-11-11"]);
    expect(f.from.toISOString()).toBe("2026-11-11T22:00:00.000Z");
    expect(f.granularity).toBe("day");
  });

  it("yesterday, last month, year-over-year and no comparison", () => {
    expect(parseAnalyticsFilter({ range: "yesterday" }, now)).toMatchObject({ fromKey: "2026-11-17", toKey: "2026-11-17", granularity: "hour" });
    expect(parseAnalyticsFilter({ range: "last_month" }, now)).toMatchObject({ fromKey: "2026-10-01", toKey: "2026-10-31", prevFromKey: "2026-09-01", prevToKey: "2026-09-30" });
    expect(parseAnalyticsFilter({ range: "30d", compare: "year" }, now)).toMatchObject({ prevFromKey: "2025-10-20", prevToKey: "2025-11-18" });
    expect(parseAnalyticsFilter({ compare: "none" }, now)).toMatchObject({ prevFrom: null, prevFromKey: null });
  });

  it("custom ranges are ordered, clamped to today and capped", () => {
    expect(parseAnalyticsFilter({ range: "custom", from: "2026-11-30", to: "2026-11-10" }, now)).toMatchObject({ fromKey: "2026-11-10", toKey: "2026-11-18" });
    expect(parseAnalyticsFilter({ range: "custom", from: "nope", to: "2026-11-10" }, now).preset).toBe("30d");
    expect(parseAnalyticsFilter({ range: "custom", from: "2020-01-01", to: "2026-11-18" }, now).days).toBe(400);
  });
});

describe("rates and comparisons", () => {
  it("derives every overview rate from session totals", () => {
    const r = deriveRates({ sessions: 200, visitors: 150, visitorDays: 170, newVisitors: 120, pageviews: 500, engagedSessions: 120, convertedSessions: 10, engagedMs: 4_000_000, durationMs: 6_000_000 });
    expect(r.returningVisitors).toBe(30);
    expect(r.pagesPerSession).toBe(2.5);
    expect(r.engagementRate).toBe(0.6);
    expect(r.bounceRate).toBeCloseTo(0.4);
    expect(r.conversionRate).toBe(0.05);
    expect(r.avgEngagementMs).toBe(20_000);
  });

  it("never invents a rate from nothing", () => {
    expect(deriveRates({ sessions: 0, visitors: 0, visitorDays: 0, newVisitors: 0, pageviews: 0, engagedSessions: 0, convertedSessions: 0, engagedMs: 0, durationMs: 0 }).bounceRate).toBeNull();
    expect(ratio(1, 0)).toBeNull();
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(0, 0)).toBe(0);
    expect(pctChange(15, 10)).toBe(0.5);
    expect(pctChange(null, 10)).toBeNull();
  });
});

describe("funnels (conversion calculations)", () => {
  const H = 3_600_000;
  it("counts steps in order, after the previous step, within the window", () => {
    const occ = [
      // v1: full journey
      { visitorId: "v1", step: 0, at: 0 },
      { visitorId: "v1", step: 1, at: 1 * H },
      { visitorId: "v1", step: 2, at: 3 * H },
      // v2: step 2 happened BEFORE step 1 → stops at step 1
      { visitorId: "v2", step: 0, at: 0 },
      { visitorId: "v2", step: 2, at: 1 * H },
      { visitorId: "v2", step: 1, at: 2 * H },
      // v3: step 1 outside the 24h window
      { visitorId: "v3", step: 0, at: 0 },
      { visitorId: "v3", step: 1, at: 30 * H },
      // v4: never entered (no step 0) — ignored
      { visitorId: "v4", step: 1, at: 1 * H },
    ];
    const r = computeFunnel(3, occ, 24 * H);
    expect(r.steps.map((s) => s.entered)).toEqual([3, 2, 1]);
    expect(r.steps[1].fromPrevious).toBeCloseTo(2 / 3);
    expect(r.steps[2].fromStart).toBeCloseTo(1 / 3);
    expect(r.steps[1].dropped).toBe(1);
    expect(r.steps[1].medianMsFromPrevious).toBe(1.5 * H); // v1: 1h, v2: 2h
    expect(r.steps[2].medianMsFromPrevious).toBe(2 * H);
    expect(r.biggestDropStep).toBe(1);
  });

  it("uses the earliest entry and the earliest qualifying later step; same-time verified steps count", () => {
    const r = computeFunnel(
      3,
      [
        { visitorId: "v", step: 0, at: 5 },
        { visitorId: "v", step: 0, at: 2 },
        { visitorId: "v", step: 1, at: 2 },
        { visitorId: "v", step: 2, at: 2 },
      ],
      100,
    );
    expect(r.steps.map((s) => s.entered)).toEqual([1, 1, 1]);
  });

  it("an empty cohort yields zeros and no biggest drop", () => {
    const r = computeFunnel(2, [], 1000);
    expect(r.steps.map((s) => s.entered)).toEqual([0, 0]);
    expect(r.steps[0].fromStart).toBeNull();
    expect(r.biggestDropStep).toBeNull();
  });
});

describe("journeys, scroll and vitals (aggregation)", () => {
  it("collapses repeats, caps depth and marks exits", () => {
    expect(journeyKey(["/", "/", "/pricing", "/register"], 5)).toEqual(["/", "/pricing", "/register", "(exit)"]);
    expect(journeyKey(["/", "/a", "/b", "/c"], 2)).toEqual(["/", "/a"]);
  });

  it("ranks common journeys and counts transitions", () => {
    const sessions = [["/", "/pricing"], ["/", "/pricing"], ["/", "/", "/pricing"], ["/blog"]];
    const top = topJourneys(sessions, 5, 10);
    expect(top[0]).toEqual({ steps: ["/", "/pricing", "(exit)"], sessions: 3 });
    const t = transitions(sessions);
    expect(t.get("/")?.get("/pricing")).toBe(3);
    expect(t.get("/blog")?.get("(exit)")).toBe(1);
  });

  it("scroll reach and the depth half the views reached", () => {
    const depths = [100, 80, 50, 20];
    const reach = scrollReach(depths, 25);
    expect(reach.map((r) => r.reached)).toEqual([1, 0.75, 0.75, 0.5, 0.25]);
    expect(depthReachedBy(depths, 0.5)).toBe(80);
    expect(scrollReach([], 50).every((r) => r.reached === 0)).toBe(true);
  });

  it("p75 and Google's vital ratings", () => {
    expect(percentile([100, 200, 300, 400], 0.75)).toBe(300);
    expect(percentile([], 0.75)).toBeNull();
    expect(vitalRating("LCP", 2400)).toBe("good");
    expect(vitalRating("LCP", 3000)).toBe("needs-improvement");
    expect(vitalRating("CLS", 0.3)).toBe("poor");
    expect(vitalRating("XYZ", 1)).toBeNull();
  });
});

describe("public SDK config", () => {
  it("asks for consent only where required and hides internal lists", () => {
    const s = { ...DEFAULT_ANALYTICS_SETTINGS, internalIps: ["41.33.0.0/16"] };
    expect(publicConfig(s, "m", "DE").ask).toBe(true);
    expect(publicConfig(s, "m", "EG").ask).toBe(false);
    expect(publicConfig({ ...s, consentMode: "BANNER" }, "s", "EG").ask).toBe(true);
    expect(JSON.stringify(publicConfig(s, "m", null))).not.toContain("41.33");
  });

  it("dashboard clicks/heatmaps follow the private-pages switch; off scopes say off", () => {
    expect(publicConfig(DEFAULT_ANALYTICS_SETTINGS, "a", null)).toMatchObject({ ck: false, hm: 0 });
    expect(publicConfig({ ...DEFAULT_ANALYTICS_SETTINGS, heatmapPrivatePages: true }, "a", null)).toMatchObject({ ck: true, hm: 100 });
    expect(publicConfig({ ...DEFAULT_ANALYTICS_SETTINGS, trackStorefronts: false }, "s", null).on).toBe(false);
    expect(publicConfig({ ...DEFAULT_ANALYTICS_SETTINGS, enabled: false }, "m", null).on).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn, revalidateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
import { classifyChannel, sourceLabel } from "./channel";
import { ID_PATTERN, viewportBucket } from "./constants";
import { RateLimiter, ipMatches, isInternalIp, isValidIpRule } from "./guard";
import { cleanText, describeUrl, isExcludedPath, maskText, normalisePath, readUtm, referrerHostOf, sanitiseQuery, stripStorePrefix } from "./paths";
import { ownHostsFor, resolvePageTenant } from "./tenant";
import { isBotUserAgent, parseUserAgent } from "./ua";
import { batchSchema, visitPingSchema } from "./wire";
import { parseVisitCookie } from "./server-events";
import { proratedCost } from "./queries/campaigns";

const ROOT = "casho.store";

describe("traffic source classification (attribution)", () => {
  it("direct when nothing tells us otherwise", () => {
    expect(classifyChannel({})).toBe("direct");
    expect(sourceLabel({})).toBe("(direct)");
  });

  it("Meta ad UTMs → paid social, with fb/ig aliases normalised", () => {
    expect(classifyChannel({ utmSource: "fb", utmMedium: "paid", utmCampaign: "nov_launch" })).toBe("paid_social");
    expect(classifyChannel({ utmSource: "ig", utmMedium: "cpc" })).toBe("paid_social");
    expect(classifyChannel({ utmSource: "facebook", utmMedium: "paid_social" })).toBe("paid_social");
    expect(sourceLabel({ utmSource: "fb" })).toBe("facebook");
    expect(sourceLabel({ utmSource: "an" })).toBe("meta_audience_network");
  });

  it("an fbclid alone is an organic share, not an ad", () => {
    expect(classifyChannel({ referrerHost: "l.facebook.com", clickIds: { fbclid: true } })).toBe("organic_social");
  });

  it("search: organic from a search referrer, paid with cpc or gclid", () => {
    expect(classifyChannel({ referrerHost: "google.com.eg" })).toBe("organic_search");
    expect(classifyChannel({ referrerHost: "bing.com" })).toBe("organic_search");
    expect(classifyChannel({ utmSource: "google", utmMedium: "cpc" })).toBe("paid_search");
    expect(classifyChannel({ referrerHost: "google.com", clickIds: { gclid: true } })).toBe("paid_search");
    expect(sourceLabel({ referrerHost: "www.google.com.eg" })).toBe("google");
  });

  it("email, social, referral and other campaigns", () => {
    expect(classifyChannel({ utmSource: "brevo", utmMedium: "email" })).toBe("email");
    expect(classifyChannel({ referrerHost: "wa.me" })).toBe("organic_social");
    expect(classifyChannel({ referrerHost: "t.co" })).toBe("organic_social");
    expect(classifyChannel({ referrerHost: "blog.example.com" })).toBe("referral");
    expect(classifyChannel({ utmSource: "partner_x", utmCampaign: "spring" })).toBe("campaign");
    expect(classifyChannel({ utmSource: "tiktok", utmMedium: "paid" })).toBe("paid_social");
    expect(classifyChannel({ clickIds: { ttclid: true } })).toBe("paid_social");
  });

  it("our own hosts are not a referral (but a storefront linking to casho.store is)", () => {
    const own = ownHostsFor({ kind: "scope", scope: "MARKETING" }, ROOT, "casho.store");
    expect(classifyChannel({ referrerHost: "app.casho.store", ownHosts: own })).toBe("direct");
    expect(classifyChannel({ referrerHost: "casho.store", ownHosts: own })).toBe("direct");
    expect(classifyChannel({ referrerHost: "mystore.casho.store", ownHosts: own })).toBe("referral");
    const storeOwn = ownHostsFor({ kind: "store", by: "slug", slug: "mystore", viaPath: false }, ROOT, "mystore.casho.store");
    expect(classifyChannel({ referrerHost: "casho.store", ownHosts: storeOwn })).toBe("referral");
    expect(classifyChannel({ referrerHost: "mystore.casho.store", ownHosts: storeOwn })).toBe("direct");
  });
});

describe("tenant resolution (isolation is decided by the host, never by the browser)", () => {
  it("store subdomains, custom domains and /store/<slug> paths are storefronts", () => {
    expect(resolvePageTenant("mystore.casho.store", "/products/x", ROOT)).toEqual({ kind: "store", by: "slug", slug: "mystore", viaPath: false });
    expect(resolvePageTenant("shop.example.com", "/", ROOT)).toEqual({ kind: "store", by: "domain", domain: "shop.example.com" });
    expect(resolvePageTenant("www.shop.example.com", "/", ROOT)).toEqual({ kind: "store", by: "domain", domain: "shop.example.com" });
    expect(resolvePageTenant("casho.store", "/store/abc/cart", ROOT)).toEqual({ kind: "store", by: "slug", slug: "abc", viaPath: true });
    expect(resolvePageTenant("app.casho.store", "/store/abc", ROOT)).toEqual({ kind: "store", by: "slug", slug: "abc", viaPath: true });
  });

  it("Casho's site, the auth pages and the dashboard", () => {
    expect(resolvePageTenant("casho.store", "/", ROOT)).toEqual({ kind: "scope", scope: "MARKETING" });
    expect(resolvePageTenant("www.casho.store", "/blog/x", ROOT)).toEqual({ kind: "scope", scope: "MARKETING" });
    expect(resolvePageTenant("app.casho.store", "/register", ROOT)).toEqual({ kind: "scope", scope: "MARKETING" });
    expect(resolvePageTenant("app.casho.store", "/orders", ROOT)).toEqual({ kind: "scope", scope: "APP" });
    expect(resolvePageTenant("app.localhost", "/products", ROOT)).toEqual({ kind: "scope", scope: "APP" });
  });

  it("admin and sales tools are never collected", () => {
    expect(resolvePageTenant("app.casho.store", "/admin/analytics", ROOT).kind).toBe("ignore");
    expect(resolvePageTenant("app.casho.store", "/sales", ROOT).kind).toBe("ignore");
    expect(resolvePageTenant("localhost", "/admin", ROOT).kind).toBe("ignore");
    // "/administrator" isn't the admin panel.
    expect(resolvePageTenant("app.casho.store", "/administrator", ROOT).kind).toBe("scope");
  });

  it("reserved subdomains are not stores", () => {
    expect(resolvePageTenant("www.casho.store", "/", ROOT).kind).toBe("scope");
    expect(resolvePageTenant("app.casho.store", "/", ROOT).kind).toBe("scope");
  });
});

describe("URL hygiene", () => {
  it("ids and tokens leave paths; readable slugs stay", () => {
    expect(normalisePath("/orders/3f2a1c9e-1b2c-4d5e-8f90-123456789abc/edit?x=1#y")).toBe("/orders/:id/edit");
    expect(normalisePath("/track/clx1a2b3c4d5e6f7g8h9i0j1k")).toBe("/track/:token");
    expect(normalisePath("/order/123456")).toBe("/order/:id");
    expect(normalisePath("/products/iphone-15-pro-max-256gb-black")).toBe("/products/iphone-15-pro-max-256gb-black");
    expect(normalisePath("/products/%D9%82%D9%85%D9%8A%D8%B5")).toBe("/products/قميص");
    expect(normalisePath("")).toBe("/");
    expect(normalisePath("/pricing/")).toBe("/pricing");
  });

  it("strips a storefront's /store/<slug> prefix", () => {
    expect(stripStorePrefix("/store/abc", "abc")).toBe("/");
    expect(stripStorePrefix("/store/abc/cart", "abc")).toBe("/cart");
    expect(stripStorePrefix("/cart", "abc")).toBe("/cart");
  });

  it("query strings lose secrets, contact details, click ids and UTMs; values are masked", () => {
    expect(sanitiseQuery("?token=abc&email=a@b.com&page=2&utm_source=fb&fbclid=xyz")).toBe("page=2");
    expect(sanitiseQuery("?q=call 01012345678")).toBe(`q=${encodeURIComponent("call [n]")}`);
    expect(sanitiseQuery("?ref_id=9&sort=new", ["ref_id"])).toBe("sort=new");
    expect(sanitiseQuery("")).toBeNull();
    expect(sanitiseQuery("?code=123")).toBeNull();
  });

  it("excluded path prefixes match whole segments", () => {
    expect(isExcludedPath("/checkout/success", ["/checkout"])).toBe(true);
    expect(isExcludedPath("/checkouts", ["/checkout"])).toBe(false);
    expect(isExcludedPath("/anything", ["not-a-path"])).toBe(false);
  });

  it("masks emails and long numbers in free text", () => {
    expect(maskText("mail me at mona@example.com or 0101 234 5678")).toBe("mail me at [email] or [n]");
    expect(maskText("طلب رقم ١٢٣٤٥٦٧")).toBe("طلب رقم [n]");
    expect(cleanText("  a\n  b  ", 10)).toBe("a b");
    expect(cleanText("x".repeat(30), 10)).toHaveLength(10);
  });

  it("describes link targets without leaking addresses", () => {
    expect(describeUrl("mailto:a@b.com", "casho.store")).toBe("mailto");
    expect(describeUrl("tel:+201000000000", "casho.store")).toBe("tel");
    expect(describeUrl("https://casho.store/orders/3f2a1c9e-1b2c-4d5e-8f90-123456789abc", "casho.store")).toBe("/orders/:id");
    expect(describeUrl("https://wa.me/201000000000?text=hi", "casho.store")).toBe("wa.me");
  });

  it("reads UTM tags but only the presence of click ids", () => {
    const utm = readUtm("?utm_source=FB&utm_medium=Paid&utm_campaign=120208%20Launch&gclid=SECRET");
    expect(utm.utmSource).toBe("fb");
    expect(utm.utmMedium).toBe("paid");
    expect(utm.utmCampaign).toBe("120208 Launch");
    expect(utm.clickIds.gclid).toBe(true);
    expect(JSON.stringify(utm)).not.toContain("SECRET");
    expect(referrerHostOf("https://www.google.com/search?q=x")).toBe("google.com");
    expect(referrerHostOf("garbage")).toBeNull();
  });
});

describe("user agents (labels only, no fingerprint)", () => {
  it("families and device categories", () => {
    expect(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")).toEqual({ browser: "Safari", os: "iOS", device: "mobile" });
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36")).toEqual({ browser: "Chrome", os: "Android", device: "mobile" });
    expect(parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0")).toEqual({ browser: "Edge", os: "Windows", device: "desktop" });
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 [FBAN/EMA;FBLC/en_US;FBAV/400.0]").browser).toBe("Facebook App");
    // iPad in desktop mode sends a Mac UA; touch points give it away.
    expect(parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", 5)).toEqual({ browser: "Safari", os: "iPadOS", device: "tablet" });
  });

  it("bots and missing user agents are dropped", () => {
    expect(isBotUserAgent("Googlebot/2.1")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe(false);
  });

  it("layout buckets", () => {
    expect(viewportBucket(1440)).toBe("desktop");
    expect(viewportBucket(1024)).toBe("desktop");
    expect(viewportBucket(820)).toBe("tablet");
    expect(viewportBucket(390)).toBe("mobile");
  });
});

describe("abuse protection", () => {
  it("rate limits per key per window", () => {
    const limiter = new RateLimiter(3, 1_000);
    expect([1, 2, 3].map(() => limiter.take("a", 0))).toEqual([true, true, true]);
    expect(limiter.take("a", 10)).toBe(false);
    expect(limiter.take("b", 10)).toBe(true);
    expect(limiter.take("a", 1_001)).toBe(true);
  });

  it("matches internal IPs exactly or by IPv4 CIDR", () => {
    expect(ipMatches("41.33.10.5", "41.33.10.5")).toBe(true);
    expect(ipMatches("41.33.10.5", "41.33.0.0/16")).toBe(true);
    expect(ipMatches("41.34.10.5", "41.33.0.0/16")).toBe(false);
    expect(isInternalIp(null, ["41.33.0.0/16"])).toBe(false);
    expect(isValidIpRule("41.33.0.0/16")).toBe(true);
    expect(isValidIpRule("41.33.0.0/40")).toBe(false);
    expect(isValidIpRule("hello")).toBe(false);
    expect(isValidIpRule("2001:db8::1")).toBe(true);
  });
});

describe("wire format", () => {
  const base = {
    v: 1,
    now: Date.now(),
    sc: "m",
    vid: "a".repeat(22),
    sid: "b".repeat(22),
    ss: { ts: Date.now(), ret: false, lp: "/", vw: 1440, vh: 900 },
    e: [],
  };

  it("accepts a well-formed batch and rejects bad ids / oversized batches", () => {
    expect(batchSchema.safeParse(base).success).toBe(true);
    expect(batchSchema.safeParse({ ...base, vid: "short" }).success).toBe(false);
    expect(batchSchema.safeParse({ ...base, sid: "has spaces in it!!!!!" }).success).toBe(false);
    const many = Array.from({ length: 51 }, (_, i) => ({ k: "pu", id: `${"c".repeat(20)}${String(i).padStart(2, "0")}`, em: 1, sp: 1 }));
    expect(batchSchema.safeParse({ ...base, e: many }).success).toBe(false);
  });

  it("rejects malformed event names, too many props and out-of-range geometry", () => {
    const ev = (extra: object) => ({ ...base, e: [{ k: "ev", id: "d".repeat(22), t: Date.now(), n: "click", ...extra }] });
    expect(batchSchema.safeParse(ev({})).success).toBe(true);
    expect(batchSchema.safeParse(ev({ n: "Bad-Name" })).success).toBe(false);
    expect(batchSchema.safeParse(ev({ x: 1.5 })).success).toBe(false);
    const props = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`k${i}`, i]));
    expect(batchSchema.safeParse(ev({ pr: props })).success).toBe(false);
  });

  it("count-only visit pings carry no ids", () => {
    expect(visitPingSchema.safeParse({ v: 1, k: "visit", st: "store-1" }).success).toBe(true);
    expect(Object.keys(visitPingSchema.shape)).toEqual(["v", "k", "st"]);
  });

  it("visit cookies parse to ids or nothing", () => {
    expect(parseVisitCookie(`${"a".repeat(22)}.${"b".repeat(22)}.abc.1.xyz.1`)).toEqual({ visitorId: "a".repeat(22), sessionId: "b".repeat(22) });
    expect(parseVisitCookie("garbage")).toBeNull();
    expect(parseVisitCookie(undefined)).toBeNull();
    expect(ID_PATTERN.test("a".repeat(22))).toBe(true);
  });
});

describe("campaign spend", () => {
  it("spreads spend evenly over the campaign's days and counts the part inside the range", () => {
    const entry = { startDate: new Date("2026-11-01T00:00:00Z"), endDate: new Date("2026-11-10T00:00:00Z"), amount: 100_000 };
    expect(proratedCost(entry, new Date("2026-11-01T00:00:00Z"), new Date("2026-11-11T00:00:00Z"))).toBe(100_000);
    expect(proratedCost(entry, new Date("2026-11-06T00:00:00Z"), new Date("2026-11-11T00:00:00Z"))).toBe(50_000);
    expect(proratedCost(entry, new Date("2026-12-01T00:00:00Z"), new Date("2026-12-31T00:00:00Z"))).toBe(0);
  });
});

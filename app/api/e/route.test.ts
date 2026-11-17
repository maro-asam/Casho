import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const collector = {
  SESSION_COOKIE_NAME: "sessionToken",
  resolveTenantStore: vi.fn(),
  readViewer: vi.fn(async () => null as null | { userId: string; staff: boolean; ownsStore: boolean }),
  writeBatch: vi.fn(async () => ({ ok: true, newSession: true })),
  countAnonymousVisit: vi.fn(async () => {}),
};
vi.mock("@/lib/analytics/collector", () => collector);
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { DEFAULT_ANALYTICS_SETTINGS } = await import("@/lib/analytics/settings");
const settings = { ...DEFAULT_ANALYTICS_SETTINGS };
vi.mock("@/lib/analytics/settings", async (orig) => ({ ...(await orig<object>()), getAnalyticsSettings: vi.fn(async () => settings) }));

const { POST, GET } = await import("./route");

const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const now = Date.now();
const body = (overrides: object = {}) => ({
  v: 1,
  now,
  sc: "s",
  st: "store-1",
  vid: "v".repeat(22),
  sid: "s".repeat(22),
  ss: { ts: now, ret: false, lp: "/", vw: 390, vh: 800 },
  e: [{ k: "pv", id: "p".repeat(22), t: now, p: "/", q: 1, vw: 390 }],
  ...overrides,
});

let ipCounter = 0;
function post(host: string, payload: unknown, headers: Record<string, string> = {}) {
  ipCounter += 1;
  return new NextRequest(`https://${host}/api/e`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "user-agent": UA, host, "x-forwarded-for": `10.0.0.${ipCounter}`, ...headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(settings, DEFAULT_ANALYTICS_SETTINGS);
  collector.resolveTenantStore.mockImplementation(async (t: { by: string; slug?: string; domain?: string }) =>
    t.by === "slug" && t.slug === "mystore" ? { id: "store-1", slug: "mystore" } : t.by === "domain" && t.domain === "shop.example.com" ? { id: "store-2", slug: "shop" } : null,
  );
});

describe("POST /api/e — tenancy and abuse", () => {
  it("stores events for the store whose address the page is on", async () => {
    const res = await POST(post("mystore.casho.store", body()));
    expect(res.status).toBe(204);
    const [batch, opts] = collector.writeBatch.mock.calls[0] as unknown as [{ session: { storeId: string; scope: string } }, { countVisit: boolean }];
    expect(batch.session).toMatchObject({ storeId: "store-1", scope: "STOREFRONT" });
    expect(opts.countVisit).toBe(true);
  });

  it("rejects a store id that isn't the host's store (no writing into another tenant)", async () => {
    const res = await POST(post("mystore.casho.store", body({ st: "store-2" })));
    expect(res.status).toBe(400);
    expect(collector.writeBatch).not.toHaveBeenCalled();
  });

  it("custom domains resolve to their own store", async () => {
    expect((await POST(post("shop.example.com", body({ st: "store-2" })))).status).toBe(204);
    expect((await POST(post("shop.example.com", body({ st: "store-1" })))).status).toBe(400);
  });

  it("a storefront payload on Casho's own pages (or the reverse) is refused", async () => {
    expect((await POST(post("casho.store", body()))).status).toBe(400);
    expect((await POST(post("mystore.casho.store", body({ sc: "m", st: undefined })))).status).toBe(400);
  });

  it("another site can't post for us", async () => {
    const res = await POST(post("mystore.casho.store", body(), { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("bots, internal IPs and staff browsers aren't counted", async () => {
    expect((await POST(post("mystore.casho.store", body(), { "user-agent": "Googlebot/2.1" }))).status).toBe(204);
    settings.internalIps = ["41.33.0.0/16"];
    expect((await POST(post("mystore.casho.store", body(), { "x-forwarded-for": "41.33.1.2" }))).status).toBe(204);
    settings.internalIps = [];
    const staff = await POST(post("mystore.casho.store", body(), { cookie: "_ca_team=1" }));
    expect(await staff.json()).toEqual({ stop: true });
    expect(collector.writeBatch).not.toHaveBeenCalled();
  });

  it("the store's own owner previewing their store is told to stop", async () => {
    collector.readViewer.mockResolvedValueOnce({ userId: "u1", staff: false, ownsStore: true });
    const res = await POST(post("mystore.casho.store", body(), { cookie: "sessionToken=abc" }));
    expect(await res.json()).toEqual({ stop: true });
    expect(collector.writeBatch).not.toHaveBeenCalled();
  });

  it("disabled scopes collect nothing; malformed or oversized bodies are rejected", async () => {
    settings.trackStorefronts = false;
    expect((await POST(post("mystore.casho.store", body()))).status).toBe(204);
    expect(collector.writeBatch).not.toHaveBeenCalled();
    settings.trackStorefronts = true;
    expect((await POST(post("mystore.casho.store", { hello: "world" }))).status).toBe(400);
    const big = new NextRequest("https://mystore.casho.store/api/e", { method: "POST", body: "x", headers: { "user-agent": UA, host: "mystore.casho.store", "content-length": String(200_000) } });
    expect((await POST(big)).status).toBe(413);
  });

  it("Casho site batches are tied to the signed-in account on the first batch", async () => {
    collector.readViewer.mockResolvedValueOnce({ userId: "u9", staff: false, ownsStore: false });
    const res = await POST(post("app.casho.store", body({ sc: "a", st: undefined, ss: { ts: now, ret: true, lp: "/orders", vw: 390, vh: 800 }, e: [{ k: "pv", id: "p".repeat(22), t: now, p: "/orders", q: 1, vw: 390 }] }), { cookie: "sessionToken=abc" }));
    expect(res.status).toBe(204);
    const [batch] = collector.writeBatch.mock.calls[0] as unknown as [{ session: { userId: string; scope: string; storeId: null } }];
    expect(batch.session).toMatchObject({ userId: "u9", scope: "APP", storeId: null });
  });

  it("count-only visit pings bump the merchant counter for the right store", async () => {
    const res = await POST(post("mystore.casho.store", { v: 1, k: "visit", st: "store-1" }, { referer: "https://mystore.casho.store/products/x" }));
    expect(res.status).toBe(204);
    expect(collector.countAnonymousVisit).toHaveBeenCalledWith("store-1");
    await POST(post("mystore.casho.store", { v: 1, k: "visit", st: "store-2" }, { referer: "https://mystore.casho.store/" }));
    expect(collector.countAnonymousVisit).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/e — public config", () => {
  it("asks EU visitors for consent in REGION mode and exposes no internal lists", async () => {
    settings.internalIps = ["41.33.0.0/16"];
    const res = await GET(new NextRequest("https://casho.store/api/e?s=m", { headers: { "x-vercel-ip-country": "FR" } }));
    const json = await res.json();
    expect(json.ask).toBe(true);
    expect(JSON.stringify(json)).not.toContain("41.33");
    const eg = await (await GET(new NextRequest("https://casho.store/api/e?s=m", { headers: { "x-vercel-ip-country": "EG" } }))).json();
    expect(eg.ask).toBe(false);
  });
});

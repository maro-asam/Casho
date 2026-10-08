import crypto from "crypto";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { handleShopifyCallback, type CallbackDeps } from "./callback";
import { createOAuthState } from "./oauth";

const SECRET = "shpss_callback_secret";
const SHOP = "acme.myshopify.com";

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
});

function sign(params: Record<string, string>) {
  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return new URLSearchParams({ ...params, hmac: crypto.createHmac("sha256", SECRET).update(message).digest("hex") });
}

const TOKENS = {
  accessToken: "shpat_live_token",
  scopes: ["read_products", "read_inventory", "read_customers", "read_orders"],
  accessTokenExpiresAt: new Date(Date.now() + 3600_000),
  refreshToken: "shprt_refresh",
  refreshTokenExpiresAt: null,
};
const SHOP_INFO = { id: "gid://shopify/Shop/1", name: "Acme", domain: SHOP, currencyCode: "EGP", primaryHost: null };

function deps(overrides: Partial<CallbackDeps> = {}): CallbackDeps {
  return {
    clientSecret: SECRET,
    canManageImports: vi.fn(async () => true),
    exchange: vi.fn(async () => TOKENS),
    fetchShop: vi.fn(async () => SHOP_INFO),
    saveConnection: vi.fn(async () => {}),
    ...overrides,
  };
}

function setup(userId = "user-1", storeId = "store-1") {
  const { state, cookie } = createOAuthState({ userId, storeId, shop: SHOP });
  const query = sign({ code: "auth-code", shop: SHOP, state: state.nonce, timestamp: "1700000000" });
  return { cookie, query };
}

describe("Shopify OAuth callback", () => {
  it("successful OAuth: stores the connection for the store that started the flow", async () => {
    const { cookie, query } = setup();
    const d = deps();
    const result = await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d);

    expect(result).toEqual({ ok: true, shop: SHOP, storeId: "store-1" });
    expect(d.exchange).toHaveBeenCalledWith(SHOP, "auth-code");
    expect(d.saveConnection).toHaveBeenCalledWith({ storeId: "store-1", userId: "user-1", shop: SHOP_INFO, tokens: TOKENS });
  });

  it("invalid state: a different nonce is rejected before talking to Shopify", async () => {
    const { cookie } = setup();
    const query = sign({ code: "auth-code", shop: SHOP, state: "forged-nonce", timestamp: "1" });
    const d = deps();
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "invalid_state" });
    expect(d.exchange).not.toHaveBeenCalled();
  });

  it("invalid state: missing cookie (CSRF / other browser)", async () => {
    const { query } = setup();
    expect(await handleShopifyCallback({ query, stateCookie: undefined, sessionUserId: "user-1" }, deps())).toEqual({ ok: false, error: "invalid_state" });
  });

  it("invalid state: state issued for another shop", async () => {
    const { state, cookie } = createOAuthState({ userId: "user-1", storeId: "store-1", shop: "other.myshopify.com" });
    const query = sign({ code: "c", shop: SHOP, state: state.nonce, timestamp: "1" });
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, deps())).toEqual({ ok: false, error: "invalid_state" });
  });

  it("rejects a tampered (unsigned) callback", async () => {
    const { cookie, query } = setup();
    query.set("code", "attacker-code");
    const d = deps();
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "invalid_hmac" });
    expect(d.exchange).not.toHaveBeenCalled();
  });

  it("failed authorization: merchant declined on Shopify", async () => {
    const { cookie } = setup();
    const query = new URLSearchParams({ error: "access_denied", shop: SHOP });
    const d = deps();
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "denied" });
    expect(d.saveConnection).not.toHaveBeenCalled();
  });

  it("failed authorization: Shopify rejects the code exchange", async () => {
    const { cookie, query } = setup();
    const d = deps({ exchange: vi.fn(async () => Promise.reject(new Error("400"))) });
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "exchange_failed" });
    expect(d.saveConnection).not.toHaveBeenCalled();
  });

  it("refuses when fewer scopes were granted than required", async () => {
    const { cookie, query } = setup();
    const d = deps({ exchange: vi.fn(async () => ({ ...TOKENS, scopes: ["read_products"] })) });
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "missing_scopes" });
    expect(d.saveConnection).not.toHaveBeenCalled();
  });

  it("tenant binding: another logged-in user can't finish someone else's flow", async () => {
    const { cookie, query } = setup("user-1", "store-1");
    const d = deps();
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-2" }, d)).toEqual({ ok: false, error: "session_mismatch" });
    expect(d.exchange).not.toHaveBeenCalled();
  });

  it("tenant binding: the user must still be allowed to manage imports of that store", async () => {
    const { cookie, query } = setup();
    const d = deps({ canManageImports: vi.fn(async () => false) });
    expect(await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, d)).toEqual({ ok: false, error: "forbidden" });
    expect(d.exchange).not.toHaveBeenCalled();
  });

  it("never returns tokens in the result", async () => {
    const { cookie, query } = setup();
    const result = await handleShopifyCallback({ query, stateCookie: cookie, sessionUserId: "user-1" }, deps());
    expect(JSON.stringify(result)).not.toContain("shpat_");
    expect(JSON.stringify(result)).not.toContain("shprt_");
  });
});

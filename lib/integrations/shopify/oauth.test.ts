import crypto from "crypto";
import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  buildAuthorizeUrl,
  createOAuthState,
  exchangeCodeForToken,
  normalizeShopDomain,
  openOAuthState,
  refreshAccessToken,
  STATE_TTL_MS,
  verifyOAuthHmac,
} from "./oauth";
import { missingScopes } from "./config";
import { verifyWebhookHmac } from "./webhooks";
import { SourceApiError } from "@/lib/integrations/import/errors";

/** Awaits a promise that must reject and returns its error. */
async function failure(promise: Promise<unknown>): Promise<SourceApiError> {
  return promise.then(
    () => {
      throw new Error("expected a failure");
    },
    (e: unknown) => e as SourceApiError,
  );
}


const SECRET = "shpss_test_secret";

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  process.env.SHOPIFY_CLIENT_ID = "client-id";
  process.env.SHOPIFY_CLIENT_SECRET = SECRET;
  process.env.APP_URL = "https://app.casho.store";
});

function signedQuery(params: Record<string, string>, secret = SECRET) {
  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const hmac = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return new URLSearchParams({ ...params, hmac });
}

describe("shop domain validation", () => {
  it.each([
    ["acme", "acme.myshopify.com"],
    ["ACME.myshopify.com", "acme.myshopify.com"],
    ["https://acme-store.myshopify.com/admin/products", "acme-store.myshopify.com"],
    ["admin.shopify.com/store/acme", "acme.myshopify.com"],
    ["https://admin.shopify.com/store/acme/orders", "acme.myshopify.com"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeShopDomain(input)).toBe(expected);
  });

  it.each([
    "",
    "evil.com",
    "acme.myshopify.com.evil.com",
    "evil.com?x=acme.myshopify.com",
    "-acme.myshopify.com",
    "acme_store.myshopify.com",
    "javascript:alert(1)",
  ])("rejects %s", (input) => {
    expect(normalizeShopDomain(input)).toBeNull();
  });
});

describe("authorize URL", () => {
  it("requests the read-only scopes and our redirect URI", () => {
    const url = new URL(buildAuthorizeUrl("acme.myshopify.com", "nonce123"));
    expect(url.origin).toBe("https://acme.myshopify.com");
    expect(url.pathname).toBe("/admin/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe("nonce123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.casho.store/api/integrations/shopify/oauth/callback");
    const scopes = url.searchParams.get("scope")!.split(",");
    expect(scopes).toEqual(["read_products", "read_inventory", "read_customers", "read_orders"]);
    expect(scopes.some((s) => s.startsWith("write_"))).toBe(false);
  });
});

describe("OAuth HMAC", () => {
  const params = { code: "abc", shop: "acme.myshopify.com", state: "s1", timestamp: "1700000000" };

  it("accepts a correctly signed callback", () => {
    expect(verifyOAuthHmac(signedQuery(params), SECRET)).toBe(true);
  });

  it("rejects a tampered parameter", () => {
    const q = signedQuery(params);
    q.set("shop", "evil.myshopify.com");
    expect(verifyOAuthHmac(q, SECRET)).toBe(false);
  });

  it("rejects a signature made with another secret, or no signature", () => {
    expect(verifyOAuthHmac(signedQuery(params, "other"), SECRET)).toBe(false);
    expect(verifyOAuthHmac(new URLSearchParams(params), SECRET)).toBe(false);
  });
});

describe("sealed state cookie", () => {
  // A long id: a two-letter one ("u1") turns up by chance in the random
  // base64 of the sealed cookie every few dozen runs.
  const input = { userId: "user-plaintext-id-0042", storeId: "s1", shop: "acme.myshopify.com" };

  it("round-trips", () => {
    const { state, cookie } = createOAuthState(input);
    expect(openOAuthState(cookie)).toEqual(state);
    expect(cookie).not.toContain(input.userId);
  });

  it("rejects tampered, foreign and expired cookies", () => {
    const { cookie } = createOAuthState(input, 1_000);
    expect(openOAuthState(cookie, 1_000 + STATE_TTL_MS + 1)).toBeNull();
    const fresh = createOAuthState(input).cookie;
    const parts = fresh.split(":");
    parts[3] = Buffer.from("{\"userId\":\"attacker\"}").toString("base64");
    expect(openOAuthState(parts.join(":"))).toBeNull();
    expect(openOAuthState("not-a-cookie")).toBeNull();
    expect(openOAuthState(undefined)).toBeNull();
  });
});

describe("scopes", () => {
  it("detects missing scopes and accepts write_* as superset", () => {
    expect(missingScopes(["read_products", "read_inventory", "read_customers", "read_orders"])).toEqual([]);
    expect(missingScopes(["write_products", "read_inventory", "read_customers", "read_orders"])).toEqual([]);
    expect(missingScopes(["read_products"])).toEqual(["read_inventory", "read_customers", "read_orders"]);
  });
});

describe("token exchange", () => {
  it("asks for expiring offline tokens and parses the response", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = new URLSearchParams(String(init?.body));
      expect(body.get("expiring")).toBe("1");
      expect(body.get("code")).toBe("the-code");
      return new Response(
        JSON.stringify({
          access_token: "shpat_secret",
          scope: "read_products,read_orders",
          expires_in: 3600,
          refresh_token: "shprt_secret",
          refresh_token_expires_in: 7776000,
        }),
      );
    });
    const tokens = await exchangeCodeForToken("acme.myshopify.com", "the-code", fetchImpl as typeof fetch);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://acme.myshopify.com/admin/oauth/access_token");
    expect(tokens.accessToken).toBe("shpat_secret");
    expect(tokens.refreshToken).toBe("shprt_secret");
    expect(tokens.scopes).toEqual(["read_products", "read_orders"]);
    expect(tokens.accessTokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("fails without leaking the response body", async () => {
    const fetchImpl = vi.fn(async () => new Response('{"error":"invalid_request","code":"the-code"}', { status: 400 }));
    const err = await failure(refreshAccessToken("acme.myshopify.com", "shprt_x", fetchImpl as typeof fetch));
    expect(err).toBeInstanceOf(SourceApiError);
    expect(err.kind).toBe("unauthorized");
    expect(String(err.message)).not.toContain("the-code");
    expect(String(err.message)).not.toContain("shprt_x");
  });

  it("never posts to a non-Shopify host", async () => {
    const fetchImpl = vi.fn();
    await expect(exchangeCodeForToken("evil.com", "c", fetchImpl as unknown as typeof fetch)).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("webhook HMAC", () => {
  it("verifies base64 HMAC of the raw body", () => {
    const body = '{"shop_domain":"acme.myshopify.com"}';
    const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64");
    expect(verifyWebhookHmac(body, sig, SECRET)).toBe(true);
    expect(verifyWebhookHmac(`${body} `, sig, SECRET)).toBe(false);
    expect(verifyWebhookHmac(body, null, SECRET)).toBe(false);
  });
});

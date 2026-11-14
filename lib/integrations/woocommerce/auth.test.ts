import crypto from "crypto";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { encryptSecret } from "@/lib/secrets";
import { SourceApiError } from "@/lib/integrations/import/errors";
import {
  buildAuthorizeUrl,
  decryptCredentials,
  encryptCredentials,
  isWooKeyPair,
  openAuthState,
  sealAuthState,
  STATE_TTL_MS,
} from "./auth";
import { handleWooCommerceCallback, handleWooCommerceReturn, type CallbackDeps } from "./callback";

const CK = "ck_0123456789abcdef0123456789abcdef01234567";
const CS = "cs_fedcba9876543210fedcba9876543210fedcba98";
const STATE_INPUT = { userId: "owner-a", storeId: "store-A", home: "https://www.acme.com", name: "Acme" };

beforeAll(() => {
  process.env.PAYMENT_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  process.env.APP_URL = "https://app.casho.store";
});

describe("sealed state", () => {
  it("round-trips and is URL-safe without encoding", () => {
    const { token, state } = sealAuthState(STATE_INPUT);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(openAuthState(token)).toEqual(state);
    expect(token).not.toContain("owner-a");
  });

  it("rejects tampered, expired and malformed tokens", () => {
    const now = Date.now();
    const { token } = sealAuthState(STATE_INPUT, now);
    const flipped = token.slice(0, -4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(openAuthState(flipped, now)).toBeNull();
    expect(openAuthState(token, now + STATE_TTL_MS + 1)).toBeNull();
    for (const bad of [undefined, null, 42, "", "short", "has spaces and + / ="]) expect(openAuthState(bad)).toBeNull();
  });

  it("never accepts unencrypted JSON (decryptSecret passes it through)", () => {
    const forged = Buffer.from(JSON.stringify({ ...STATE_INPUT, nonce: "x".repeat(32), exp: Date.now() + 60_000 })).toString("base64url");
    expect(openAuthState(forged)).toBeNull();
  });

  it("rejects a sealed state whose home isn't https", () => {
    const sealed = encryptSecret(JSON.stringify({ ...STATE_INPUT, home: "http://acme.com", nonce: "n", exp: Date.now() + 60_000 }));
    expect(openAuthState(Buffer.from(sealed).toString("base64url"))).toBeNull();
  });

  it("builds the read-only approval URL on the site's home", () => {
    const url = new URL(buildAuthorizeUrl("https://www.acme.com/shop", "TOKEN_123"));
    expect(url.origin + url.pathname).toBe("https://www.acme.com/shop/wc-auth/v1/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      app_name: "Casho",
      scope: "read",
      user_id: "TOKEN_123",
      return_url: "https://app.casho.store/api/integrations/woocommerce/oauth/return",
      callback_url: "https://app.casho.store/api/integrations/woocommerce/oauth/callback",
    });
  });
});

describe("credentials", () => {
  it("validates the key pair shape", () => {
    expect(isWooKeyPair(CK, CS)).toBe(true);
    expect(isWooKeyPair(CS, CK)).toBe(false);
    expect(isWooKeyPair("ck_short", CS)).toBe(false);
    expect(isWooKeyPair(CK, `${CS}"; DROP`)).toBe(false);
  });

  it("encrypts both halves into one value", () => {
    const enc = encryptCredentials({ consumerKey: CK, consumerSecret: CS });
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain(CK.slice(3));
    expect(decryptCredentials(enc)).toEqual({ consumerKey: CK, consumerSecret: CS });
  });

  it("unreadable credentials surface as 'unauthorized' (reconnect)", () => {
    for (const bad of [null, "", "plaintext", encryptSecret("not json"), encryptSecret('{"ck":"x","cs":"y"}')]) {
      expect(() => decryptCredentials(bad)).toThrow(SourceApiError);
      try {
        decryptCredentials(bad);
      } catch (err) {
        expect((err as SourceApiError).kind).toBe("unauthorized");
      }
    }
  });
});

function deps(overrides: Partial<CallbackDeps> = {}): CallbackDeps {
  return {
    canManageImports: vi.fn(async () => true),
    saveConnection: vi.fn(async () => {}),
    ...overrides,
  };
}

function body(token: string, extra: Record<string, unknown> = {}) {
  return { key_id: 7, user_id: token, consumer_key: CK, consumer_secret: CS, key_permissions: "read", ...extra };
}

describe("key callback", () => {
  it("saves the connection for the store and site in the sealed state", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    const d = deps();
    expect(await handleWooCommerceCallback({ body: body(token) }, d)).toEqual({ ok: true, storeId: "store-A", site: "www.acme.com" });
    expect(d.saveConnection).toHaveBeenCalledWith({
      storeId: "store-A",
      userId: "owner-a",
      home: "https://www.acme.com",
      name: "Acme",
      credentials: { consumerKey: CK, consumerSecret: CS },
      permissions: "read",
    });
  });

  it("rejects anything without our sealed state", async () => {
    const d = deps();
    expect(await handleWooCommerceCallback({ body: body("forged-user-id-forged-user-id-forged-user-id") }, d)).toEqual({ ok: false, error: "invalid_state" });
    expect(await handleWooCommerceCallback({ body: null }, d)).toEqual({ ok: false, error: "invalid_request" });
    expect(await handleWooCommerceCallback({ body: "x" }, d)).toEqual({ ok: false, error: "invalid_request" });
    expect(d.saveConnection).not.toHaveBeenCalled();
  });

  it("rejects an expired approval", async () => {
    const now = Date.now();
    const { token } = sealAuthState(STATE_INPUT, now);
    expect(await handleWooCommerceCallback({ body: body(token), now: now + STATE_TTL_MS + 1 }, deps())).toEqual({ ok: false, error: "invalid_state" });
  });

  it("rejects malformed keys and write-only keys", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    expect((await handleWooCommerceCallback({ body: body(token, { consumer_key: "ck_<script>" }) }, deps())).ok).toBe(false);
    expect(await handleWooCommerceCallback({ body: body(token, { key_permissions: "write" }) }, deps())).toEqual({ ok: false, error: "missing_scopes" });
  });

  it("re-checks that the user may still manage imports", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    const d = deps({ canManageImports: vi.fn(async () => false) });
    expect(await handleWooCommerceCallback({ body: body(token) }, d)).toEqual({ ok: false, error: "forbidden" });
    expect(d.saveConnection).not.toHaveBeenCalled();
  });
});

describe("browser return", () => {
  const connected = { status: "ACTIVE", externalShopId: "www.acme.com", get updatedAt() { return new Date(); } };

  function query(token: string, success = "1") {
    return new URLSearchParams({ success, user_id: token });
  }

  it("reports success only to the user who started the flow", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    const findConnection = vi.fn(async () => connected);
    expect((await handleWooCommerceReturn({ query: query(token), sessionUserId: "owner-a" }, { findConnection })).ok).toBe(true);
    expect(await handleWooCommerceReturn({ query: query(token), sessionUserId: "someone-else" }, { findConnection })).toEqual({ ok: false, error: "session_mismatch" });
    expect(await handleWooCommerceReturn({ query: query(token), sessionUserId: null }, { findConnection })).toEqual({ ok: false, error: "session_mismatch" });
  });

  it("denied on WordPress", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    expect(await handleWooCommerceReturn({ query: query(token, "0"), sessionUserId: "owner-a" }, { findConnection: vi.fn() })).toEqual({ ok: false, error: "denied" });
  });

  it("approved but the key never reached us", async () => {
    const { token } = sealAuthState(STATE_INPUT);
    const now = new Date();
    const stale = { status: "ACTIVE", externalShopId: "www.acme.com", updatedAt: new Date(Date.now() - 2 * STATE_TTL_MS) };
    for (const connection of [null, stale, { status: "ACTIVE", externalShopId: "other.com", updatedAt: now }, { status: "DISCONNECTED", externalShopId: "www.acme.com", updatedAt: now }]) {
      expect(await handleWooCommerceReturn({ query: query(token), sessionUserId: "owner-a" }, { findConnection: vi.fn(async () => connection) })).toEqual({
        ok: false,
        error: "callback_failed",
      });
    }
  });
});

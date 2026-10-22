/**
 * Shopify OAuth (authorization code grant, expiring offline tokens).
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 *
 * CSRF / tenant binding: the `state` nonce is sealed (AES-256-GCM, so it can't be
 * read or forged) into an httpOnly cookie together with the Casho user, store
 * and shop it was issued for. The callback only accepts a request whose
 * Shopify HMAC is valid AND whose state, shop and logged-in user all match.
 */
import crypto from "crypto";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { SourceApiError } from "@/lib/integrations/import/errors";
import { getShopifyConfig } from "./config";

export const SHOPIFY_STATE_COOKIE = "shopify_oauth_state";
export const STATE_TTL_MS = 10 * 60 * 1000;

const SHOP_DOMAIN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

export function isValidShopDomain(shop: string | null | undefined): shop is string {
  return typeof shop === "string" && SHOP_DOMAIN.test(shop);
}

/**
 * Accepts what merchants actually paste — "acme", "acme.myshopify.com",
 * "https://acme.myshopify.com/admin", "admin.shopify.com/store/acme" — and
 * returns "acme.myshopify.com", or null. Custom domains are rejected (they
 * can't be verified as Shopify shops).
 */
export function normalizeShopDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^https?:\/\//, "");

  const adminStore = value.match(/^admin\.shopify\.com\/store\/([a-z0-9][a-z0-9-]*)/);
  if (adminStore) value = adminStore[1];

  value = value.split(/[/?#]/)[0];
  if (!value.includes(".")) value = `${value}.myshopify.com`;
  return isValidShopDomain(value) ? value : null;
}

export function buildAuthorizeUrl(shop: string, state: string) {
  const { clientId, scopes, redirectUri } = getShopifyConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(","),
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Verifies the `hmac` Shopify adds to OAuth redirects. */
export function verifyOAuthHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get("hmac");
  if (!hmac) return false;
  const entries = [...query.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  // Shopify signs the sorted `key=value` string; encoded and raw forms are both
  // accepted since they only differ for unusual characters.
  const encoded = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const raw = entries.map(([k, v]) => `${k}=${v}`).join("&");

  return [encoded, raw].some((message) =>
    safeEqualHex(crypto.createHmac("sha256", secret).update(message).digest("hex"), hmac.toLowerCase()),
  );
}

// ─── State cookie ────────────────────────────────────────────────────────────

export type OAuthState = { nonce: string; userId: string; storeId: string; shop: string; exp: number };

export function createOAuthState(input: { userId: string; storeId: string; shop: string }, now = Date.now()) {
  const state: OAuthState = { ...input, nonce: crypto.randomBytes(24).toString("hex"), exp: now + STATE_TTL_MS };
  return { state, cookie: encryptSecret(JSON.stringify(state)) };
}

/** Null when missing, tampered with, malformed or expired. */
export function openOAuthState(cookie: string | undefined, now = Date.now()): OAuthState | null {
  if (!cookie || !cookie.startsWith("v1:")) return null;
  try {
    const parsed = JSON.parse(decryptSecret(cookie)) as Partial<OAuthState>;
    if (
      typeof parsed.nonce !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.storeId !== "string" ||
      typeof parsed.shop !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < now
    ) {
      return null;
    }
    return parsed as OAuthState;
  } catch {
    return null;
  }
}

export function stateMatches(expected: string, received: string | null) {
  return !!received && safeEqualHex(expected, received);
}

// ─── Token endpoints ─────────────────────────────────────────────────────────

export type ShopifyTokenSet = {
  accessToken: string;
  scopes: string[];
  accessTokenExpiresAt: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
};

type TokenResponse = {
  access_token?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

async function postToken(shop: string, body: Record<string, string>, fetchImpl: typeof fetch): Promise<ShopifyTokenSet> {
  if (!isValidShopDomain(shop)) throw new SourceApiError("client", "invalid shop domain");
  let res: Response;
  try {
    res = await fetchImpl(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new SourceApiError("network", "token request failed (network)");
  }
  // Never include the response body: it may echo the code or a token.
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new SourceApiError("unauthorized", `token request rejected (${res.status})`, res.status);
  }
  if (!res.ok) throw new SourceApiError(res.status >= 500 ? "server" : "client", `token request failed (${res.status})`, res.status);

  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!json.access_token) throw new SourceApiError("client", "token response without access token");

  const now = Date.now();
  return {
    accessToken: json.access_token,
    scopes: (json.scope ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    accessTokenExpiresAt: json.expires_in ? new Date(now + json.expires_in * 1000) : null,
    refreshToken: json.refresh_token ?? null,
    refreshTokenExpiresAt: json.refresh_token_expires_in ? new Date(now + json.refresh_token_expires_in * 1000) : null,
  };
}

export function exchangeCodeForToken(shop: string, code: string, fetchImpl: typeof fetch = fetch) {
  const { clientId, clientSecret } = getShopifyConfig();
  return postToken(shop, { client_id: clientId, client_secret: clientSecret, code, expiring: "1" }, fetchImpl);
}

export function refreshAccessToken(shop: string, refreshToken: string, fetchImpl: typeof fetch = fetch) {
  const { clientId, clientSecret } = getShopifyConfig();
  return postToken(
    shop,
    { client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refreshToken },
    fetchImpl,
  );
}

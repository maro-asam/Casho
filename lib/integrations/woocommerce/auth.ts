/**
 * WooCommerce key approval ("wc-auth"):
 * https://woocommerce.github.io/woocommerce-rest-api-docs/#rest-api-keys
 *
 *   1. We send the merchant to {home}/wc-auth/v1/authorize with app_name,
 *      scope=read, user_id, return_url and callback_url.
 *   2. They log into their own WordPress and approve.
 *   3. WooCommerce POSTs {consumer_key, consumer_secret, key_permissions,
 *      user_id} to callback_url — server to server, no browser cookies — and
 *      only then redirects the browser to return_url?success=1&user_id=….
 *
 * Because step 3 has no session, `user_id` carries a sealed state (AES-256-GCM
 * via lib/secrets, so it can't be read or forged) binding the flow to the
 * Casho user, store and site it was issued for. WooCommerce passes user_id
 * through its login redirect without URL-encoding it, so the token is
 * base64url (no "+", "/" or "=").
 */
import crypto from "crypto";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { SourceApiError } from "@/lib/integrations/import/errors";
import { getWooCommerceConfig } from "./config";

/** Long enough to log into WordPress (2FA included) and approve. */
export const STATE_TTL_MS = 30 * 60 * 1000;

export type AuthState = {
  nonce: string;
  userId: string;
  storeId: string;
  /** Canonical https home URL found by discovery. */
  home: string;
  name: string;
  exp: number;
};

export function sealAuthState(input: Omit<AuthState, "nonce" | "exp">, now = Date.now()) {
  const state: AuthState = { ...input, nonce: crypto.randomBytes(16).toString("hex"), exp: now + STATE_TTL_MS };
  return { state, token: Buffer.from(encryptSecret(JSON.stringify(state)), "utf8").toString("base64url") };
}

/** Null when missing, tampered with, malformed or expired. */
export function openAuthState(token: unknown, now = Date.now()): AuthState | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 2000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  const sealed = Buffer.from(token, "base64url").toString("utf8");
  // decryptSecret passes non-"v1:" input through as plaintext — never accept that.
  if (!sealed.startsWith("v1:")) return null;
  try {
    const parsed = JSON.parse(decryptSecret(sealed)) as Partial<AuthState>;
    if (
      typeof parsed.nonce !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.storeId !== "string" ||
      typeof parsed.home !== "string" ||
      !parsed.home.startsWith("https://") ||
      typeof parsed.name !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < now
    ) {
      return null;
    }
    return parsed as AuthState;
  } catch {
    return null;
  }
}

export function buildAuthorizeUrl(home: string, token: string) {
  const { appName, callbackUrl, returnUrl } = getWooCommerceConfig();
  const params = new URLSearchParams({
    app_name: appName,
    scope: "read",
    user_id: token,
    return_url: returnUrl,
    callback_url: callbackUrl,
  });
  return `${home}/wc-auth/v1/authorize?${params.toString()}`;
}

// ─── Key pair ────────────────────────────────────────────────────────────────

export type WooCredentials = { consumerKey: string; consumerSecret: string };

const KEY = /^ck_[A-Za-z0-9]{20,64}$/;
const SECRET = /^cs_[A-Za-z0-9]{20,64}$/;

export function isWooKeyPair(consumerKey: unknown, consumerSecret: unknown): boolean {
  return typeof consumerKey === "string" && typeof consumerSecret === "string" && KEY.test(consumerKey) && SECRET.test(consumerSecret);
}

/** One encrypted value for ImportConnection.accessTokenEnc. */
export function encryptCredentials(c: WooCredentials) {
  return encryptSecret(JSON.stringify({ ck: c.consumerKey, cs: c.consumerSecret }));
}

export function decryptCredentials(enc: string | null | undefined): WooCredentials {
  if (!enc || !enc.startsWith("v1:")) throw new SourceApiError("unauthorized", "WooCommerce credentials missing");
  try {
    const parsed = JSON.parse(decryptSecret(enc)) as { ck?: unknown; cs?: unknown };
    if (!isWooKeyPair(parsed.ck, parsed.cs)) throw new Error("malformed");
    return { consumerKey: parsed.ck as string, consumerSecret: parsed.cs as string };
  } catch {
    throw new SourceApiError("unauthorized", "WooCommerce credentials unreadable");
  }
}

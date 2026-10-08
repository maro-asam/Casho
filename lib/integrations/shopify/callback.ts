/**
 * OAuth callback logic, separated from the route so every check is unit-tested.
 * Order matters: nothing touches Shopify until the request is proven to be
 * (1) signed by Shopify, (2) the answer to OUR state for (3) this logged-in
 * user and shop, and (4) the user may still manage imports for that store.
 */
import { missingScopes } from "./config";
import {
  isValidShopDomain,
  openOAuthState,
  stateMatches,
  verifyOAuthHmac,
  type ShopifyTokenSet,
} from "./oauth";
import type { ShopInfo } from "./source";

export type CallbackError =
  | "denied"
  | "invalid_request"
  | "invalid_hmac"
  | "invalid_state"
  | "session_mismatch"
  | "forbidden"
  | "missing_scopes"
  | "exchange_failed";

export type CallbackResult = { ok: true; shop: string; storeId: string } | { ok: false; error: CallbackError };

export type SaveConnectionInput = {
  storeId: string;
  userId: string;
  shop: ShopInfo;
  tokens: ShopifyTokenSet;
};

export type CallbackDeps = {
  clientSecret: string;
  canManageImports(userId: string, storeId: string): Promise<boolean>;
  exchange(shop: string, code: string): Promise<ShopifyTokenSet>;
  fetchShop(shop: string, accessToken: string): Promise<ShopInfo>;
  saveConnection(input: SaveConnectionInput): Promise<void>;
};

export async function handleShopifyCallback(
  input: { query: URLSearchParams; stateCookie: string | undefined; sessionUserId: string | null; now?: number },
  deps: CallbackDeps,
): Promise<CallbackResult> {
  const { query } = input;

  const state = openOAuthState(input.stateCookie, input.now);
  if (!state) return { ok: false, error: "invalid_state" };

  if (query.get("error")) return { ok: false, error: "denied" };

  const shop = query.get("shop");
  const code = query.get("code");
  if (!isValidShopDomain(shop) || !code) return { ok: false, error: "invalid_request" };

  if (!verifyOAuthHmac(query, deps.clientSecret)) return { ok: false, error: "invalid_hmac" };

  if (!stateMatches(state.nonce, query.get("state")) || state.shop !== shop) {
    return { ok: false, error: "invalid_state" };
  }

  // The browser that finishes OAuth must be the Kasho user who started it.
  if (!input.sessionUserId || input.sessionUserId !== state.userId) return { ok: false, error: "session_mismatch" };
  if (!(await deps.canManageImports(state.userId, state.storeId))) return { ok: false, error: "forbidden" };

  let tokens: ShopifyTokenSet;
  let shopInfo: ShopInfo;
  try {
    tokens = await deps.exchange(shop, code);
  } catch {
    return { ok: false, error: "exchange_failed" };
  }
  if (missingScopes(tokens.scopes).length > 0) return { ok: false, error: "missing_scopes" };
  try {
    shopInfo = await deps.fetchShop(shop, tokens.accessToken);
  } catch {
    return { ok: false, error: "exchange_failed" };
  }

  await deps.saveConnection({ storeId: state.storeId, userId: state.userId, shop: shopInfo, tokens });
  return { ok: true, shop, storeId: state.storeId };
}

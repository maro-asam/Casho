/**
 * Shopify app configuration (env only — never hardcode credentials).
 *
 *   SHOPIFY_CLIENT_ID      — app Client ID (Shopify Dev Dashboard → app → Settings)
 *   SHOPIFY_CLIENT_SECRET  — app Client secret (signs OAuth callbacks + webhooks)
 *   SHOPIFY_API_VERSION    — optional, Admin GraphQL version (default below)
 *   SHOPIFY_SCOPES         — optional, comma list; default = minimum for the import
 *   APP_URL                — used to build the OAuth redirect URI
 *
 * Tokens are encrypted with PAYMENT_ENCRYPTION_KEY (lib/secrets.ts).
 * Setup guide: docs/integrations/shopify-import.md
 */

/** Latest stable Admin API version at the time of writing (released 2026-10-01). */
export const DEFAULT_SHOPIFY_API_VERSION = "2026-10";

/** Read-only scopes — the import never writes to the merchant's Shopify store. */
export const REQUIRED_SHOPIFY_SCOPES = ["read_products", "read_inventory", "read_customers", "read_orders"] as const;

/** Optional: orders older than 60 days need this (Shopify must approve it for public apps). */
export const ALL_ORDERS_SCOPE = "read_all_orders";

export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super("Shopify integration is not configured");
    this.name = "ShopifyNotConfiguredError";
  }
}

export function isShopifyConfigured() {
  return Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET && process.env.APP_URL);
}

export function getShopifyConfig() {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!clientId || !clientSecret || !appUrl) throw new ShopifyNotConfiguredError();

  const scopes = (process.env.SHOPIFY_SCOPES?.trim() || REQUIRED_SHOPIFY_SCOPES.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    clientId,
    clientSecret,
    apiVersion: process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_SHOPIFY_API_VERSION,
    scopes,
    redirectUri: `${appUrl}/api/integrations/shopify/oauth/callback`,
  };
}

/** Granted scopes satisfy the import (a write_* scope implies its read_*). */
export function missingScopes(granted: readonly string[]) {
  const set = new Set(granted.map((s) => s.trim()));
  return REQUIRED_SHOPIFY_SCOPES.filter((scope) => !set.has(scope) && !set.has(scope.replace(/^read_/, "write_")));
}

/**
 * WooCommerce import configuration.
 *
 * Unlike Shopify there is no Casho app to register: every merchant approves a
 * read-only REST key on their own WordPress site (WooCommerce's built-in
 * /wc-auth/v1/authorize screen), and WooCommerce POSTs the key pair to our
 * callback. The only requirements are:
 *
 *   APP_URL                 — must be https:// (WooCommerce refuses a non-SSL callback)
 *   PAYMENT_ENCRYPTION_KEY  — encrypts the merchant's key pair at rest (lib/secrets.ts)
 *
 * Guide: docs/integrations/woocommerce-import.md
 */

export const WOO_APP_NAME = "Casho";

export class WooCommerceNotConfiguredError extends Error {
  constructor() {
    super("WooCommerce integration is not configured");
    this.name = "WooCommerceNotConfiguredError";
  }
}

function appUrl() {
  return process.env.APP_URL?.trim().replace(/\/$/, "") ?? "";
}

export function isWooCommerceConfigured() {
  return appUrl().startsWith("https://") && Boolean(process.env.PAYMENT_ENCRYPTION_KEY?.trim());
}

export function getWooCommerceConfig() {
  const base = appUrl();
  if (!base.startsWith("https://")) throw new WooCommerceNotConfiguredError();
  return {
    appName: WOO_APP_NAME,
    /** WooCommerce POSTs the key pair here (server to server). */
    callbackUrl: `${base}/api/integrations/woocommerce/oauth/callback`,
    /** WooCommerce sends the merchant's browser back here (?success=0|1&user_id=…). */
    returnUrl: `${base}/api/integrations/woocommerce/oauth/return`,
  };
}

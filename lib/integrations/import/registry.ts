import type { ImportConnection, ImportProvider } from "@prisma/client";
import { decryptSecret } from "@/lib/secrets";
import { logger } from "@/lib/logger";
import { isShopifyConfigured } from "@/lib/integrations/shopify/config";
import { createShopifySource, fetchPreviewCounts as fetchShopifyPreviewCounts } from "@/lib/integrations/shopify/source";
import { isWooCommerceConfigured } from "@/lib/integrations/woocommerce/config";
import { createWooCommerceSource, fetchPreviewCounts as fetchWooPreviewCounts } from "@/lib/integrations/woocommerce/source";
import { errorLogContext } from "./errors";
import type { ImportSource, PreviewCounts } from "./types";

/** One entry per provider — a new platform plugs in here. */
export function createImportSource(connection: ImportConnection): ImportSource {
  switch (connection.provider) {
    case "SHOPIFY":
      return createShopifySource(connection);
    case "WOOCOMMERCE":
      return createWooCommerceSource(connection);
  }
}

export function isProviderConfigured(provider: ImportProvider): boolean {
  switch (provider) {
    case "SHOPIFY":
      return isShopifyConfigured();
    case "WOOCOMMERCE":
      return isWooCommerceConfigured();
  }
}

export async function fetchPreviewCounts(connection: ImportConnection): Promise<PreviewCounts> {
  switch (connection.provider) {
    case "SHOPIFY":
      return fetchShopifyPreviewCounts(connection);
    case "WOOCOMMERCE":
      return fetchWooPreviewCounts(connection);
  }
}

/**
 * Best effort: withdraw Casho's access on the source side when the merchant
 * disconnects. WooCommerce keys can't be deleted with a read-only key — the
 * merchant removes them from WooCommerce → Settings → Advanced → REST API.
 */
export async function revokeRemoteAccess(connection: ImportConnection): Promise<void> {
  if (connection.provider !== "SHOPIFY" || !connection.accessTokenEnc || !isShopifyConfigured()) return;
  try {
    await fetch(`https://${connection.shopDomain}/admin/api_permissions/current.json`, {
      method: "DELETE",
      headers: { "X-Shopify-Access-Token": decryptSecret(connection.accessTokenEnc) },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    logger.warn("[Shopify] Revoke on disconnect failed", { storeId: connection.storeId, ...errorLogContext(err) });
  }
}

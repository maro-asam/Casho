/**
 * Shopify OAuth callback.
 *
 * GET /api/integrations/shopify/oauth/callback?code&hmac&shop&state&timestamp
 *
 * All checks live in handleShopifyCallback (unit-tested). Tokens are encrypted
 * before they touch the database and are never sent to the browser or logged.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorLogContext } from "@/lib/integrations/import/errors";
import { userCanManageImports } from "@/lib/integrations/import/access";
import { getShopifyConfig, isShopifyConfigured } from "@/lib/integrations/shopify/config";
import { encryptedTokenFields } from "@/lib/integrations/shopify/connection";
import { handleShopifyCallback } from "@/lib/integrations/shopify/callback";
import { exchangeCodeForToken, SHOPIFY_STATE_COOKIE } from "@/lib/integrations/shopify/oauth";
import { createShopifyClient, fetchShopInfo, registerUninstallWebhook } from "@/lib/integrations/shopify/source";
import { importPageUrl, stateCookieOptions } from "@/lib/integrations/shopify/http";

function redirectClearingState(url: string) {
  const response = NextResponse.redirect(url);
  const { name, ...options } = stateCookieOptions(0);
  response.cookies.set(name, "", options);
  return response;
}

export async function GET(req: NextRequest) {
  if (!isShopifyConfigured()) return redirectClearingState(importPageUrl({ error: "not_configured" }));

  try {
    const session = await getCurrentSession();
    const cookieStore = await cookies();

    const result = await handleShopifyCallback(
      {
        query: req.nextUrl.searchParams,
        stateCookie: cookieStore.get(SHOPIFY_STATE_COOKIE)?.value,
        sessionUserId: session?.user?.id ?? null,
      },
      {
        clientSecret: getShopifyConfig().clientSecret,
        canManageImports: userCanManageImports,
        exchange: (shop, code) => exchangeCodeForToken(shop, code),
        fetchShop: (shop, accessToken) => fetchShopInfo(createShopifyClient(shop, async () => accessToken)),
        async saveConnection({ storeId, userId, shop, tokens }) {
          const data = {
            externalShopId: shop.id,
            shopName: shop.name,
            shopDomain: shop.domain,
            currencyCode: shop.currencyCode,
            scopes: tokens.scopes,
            status: "ACTIVE" as const,
            connectedByUserId: userId,
            ...encryptedTokenFields(tokens),
          };
          await prisma.importConnection.upsert({
            where: { storeId_provider: { storeId, provider: "SHOPIFY" } },
            create: { storeId, provider: "SHOPIFY", ...data },
            update: data,
          });

          // Best effort: the import works without it; we only lose the uninstall signal.
          await registerUninstallWebhook(
            createShopifyClient(shop.domain, async () => tokens.accessToken),
            getShopifyConfig().webhooksUri,
          )
            .then((errors) => errors.length && logger.warn("[Shopify OAuth] Uninstall webhook not registered", { shop: shop.domain, errors }))
            .catch((err) => logger.warn("[Shopify OAuth] Uninstall webhook failed", errorLogContext(err)));
        },
      },
    );

    if (!result.ok) {
      logger.warn("[Shopify OAuth] Callback rejected", { reason: result.error });
      return redirectClearingState(importPageUrl({ error: result.error }));
    }

    logger.info("[Shopify OAuth] Connected", { storeId: result.storeId, shop: result.shop });
    return redirectClearingState(importPageUrl({ connected: "1" }));
  } catch (err) {
    logger.error("[Shopify OAuth] Callback failed", errorLogContext(err));
    return redirectClearingState(importPageUrl({ error: "server_error" }));
  }
}

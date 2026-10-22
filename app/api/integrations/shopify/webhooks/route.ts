/**
 * Shopify webhooks: app/uninstalled + the mandatory privacy (compliance) topics.
 *
 * POST /api/integrations/shopify/webhooks
 * Configure in the app's TOML / Dev Dashboard (see docs/integrations/shopify-import.md).
 * Every request is authenticated with X-Shopify-Hmac-Sha256 (HMAC of the raw body).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getShopifyConfig, isShopifyConfigured } from "@/lib/integrations/shopify/config";
import { isValidShopDomain } from "@/lib/integrations/shopify/oauth";
import { verifyWebhookHmac } from "@/lib/integrations/shopify/webhooks";

export async function POST(req: NextRequest) {
  if (!isShopifyConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const rawBody = await req.text();
  if (!verifyWebhookHmac(rawBody, req.headers.get("x-shopify-hmac-sha256"), getShopifyConfig().clientSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shop = req.headers.get("x-shopify-shop-domain") ?? "";
  if (!isValidShopDomain(shop)) return NextResponse.json({ ok: true });

  const connections = await prisma.importConnection.findMany({
    where: { provider: "SHOPIFY", shopDomain: shop },
    select: { id: true, externalShopId: true },
  });

  switch (topic) {
    case "app/uninstalled":
      // Tokens are useless now — drop them. Import history stays with the store.
      await prisma.importConnection.updateMany({
        where: { id: { in: connections.map((c) => c.id) } },
        data: { status: "DISCONNECTED", accessTokenEnc: null, refreshTokenEnc: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null },
      });
      break;

    case "shop/redact":
      // 48h after uninstall: forget everything we hold about this Shopify shop.
      await prisma.importRecordMap.deleteMany({
        where: { provider: "SHOPIFY", externalShopId: { in: connections.map((c) => c.externalShopId) } },
      });
      await prisma.importConnection.deleteMany({ where: { id: { in: connections.map((c) => c.id) } } });
      break;

    case "customers/redact": {
      // Drop the Shopify ↔ Casho link for this customer. The Casho customer row
      // itself is the merchant's own record after migration (they are its controller).
      let payload: { customer?: { id?: number | string } } = {};
      try {
        payload = JSON.parse(rawBody || "{}");
      } catch {
        // Signed but unreadable body — nothing to redact.
      }
      if (payload.customer?.id) {
        await prisma.importRecordMap.deleteMany({
          where: {
            provider: "SHOPIFY",
            externalShopId: { in: connections.map((c) => c.externalShopId) },
            entityType: "CUSTOMER",
            externalId: `gid://shopify/Customer/${payload.customer.id}`,
          },
        });
      }
      break;
    }

    case "customers/data_request":
      // Casho keeps no Shopify-side copy of customer data beyond what the merchant
      // imported into their own store; the merchant answers from their dashboard.
      break;
  }

  logger.info("[Shopify Webhook] Handled", { topic, shop, connections: connections.length });
  return NextResponse.json({ ok: true });
}

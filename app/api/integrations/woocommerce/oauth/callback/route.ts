/**
 * WooCommerce key callback — called by the merchant's WordPress server (not a
 * browser) right after they approve:
 *
 * POST /api/integrations/woocommerce/oauth/callback
 *   { key_id, user_id, consumer_key, consumer_secret, key_permissions }
 *
 * A 200 tells WooCommerce to keep the key and send the merchant back to the
 * return URL; anything else makes WooCommerce delete the key it just created,
 * so a rejected attempt leaves nothing behind. All checks live in
 * handleWooCommerceCallback (unit-tested). The key pair is encrypted before it
 * touches the database and is never logged.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { userCanManageImports } from "@/lib/integrations/import/access";
import { errorLogContext } from "@/lib/integrations/import/errors";
import { encryptCredentials } from "@/lib/integrations/woocommerce/auth";
import { handleWooCommerceCallback } from "@/lib/integrations/woocommerce/callback";
import { isWooCommerceConfigured } from "@/lib/integrations/woocommerce/config";
import { siteKey } from "@/lib/integrations/woocommerce/site";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(req: NextRequest) {
  if (!isWooCommerceConfigured()) return NextResponse.json({ ok: false }, { status: 503 });

  let body: unknown = null;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const result = await handleWooCommerceCallback(
      { body },
      {
        canManageImports: userCanManageImports,
        async saveConnection({ storeId, userId, home, name, credentials, permissions }) {
          const key = siteKey(home);
          const data = {
            externalShopId: key,
            shopName: name,
            shopDomain: key,
            scopes: [permissions],
            status: "ACTIVE" as const,
            connectedByUserId: userId,
            accessTokenEnc: encryptCredentials(credentials),
            accessTokenExpiresAt: null,
            refreshTokenEnc: null,
            refreshTokenExpiresAt: null,
          };
          const existing = await prisma.importConnection.findUnique({
            where: { storeId_provider: { storeId, provider: "WOOCOMMERCE" } },
            select: { externalShopId: true },
          });
          await prisma.importConnection.upsert({
            where: { storeId_provider: { storeId, provider: "WOOCOMMERCE" } },
            create: { storeId, provider: "WOOCOMMERCE", currencyCode: null, ...data },
            // A different site's currency doesn't carry over; the preview refills it.
            update: existing?.externalShopId === key ? data : { ...data, currencyCode: null },
          });
        },
      },
    );

    if (!result.ok) {
      logger.warn("[WooCommerce OAuth] Callback rejected", { reason: result.error });
      return NextResponse.json({ ok: false }, { status: result.error === "forbidden" ? 403 : 400 });
    }
    logger.info("[WooCommerce OAuth] Connected", { storeId: result.storeId, site: result.site });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[WooCommerce OAuth] Callback failed", errorLogContext(err));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

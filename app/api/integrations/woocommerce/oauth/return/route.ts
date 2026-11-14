/**
 * Where WooCommerce sends the merchant's browser after the approval screen:
 *
 * GET /api/integrations/woocommerce/oauth/return?success=0|1&user_id=<sealed state>
 *
 * The connection itself was saved by the callback; this only reports the
 * outcome to the Casho user who started the flow (handleWooCommerceReturn).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { errorLogContext } from "@/lib/integrations/import/errors";
import { importPageUrl } from "@/lib/integrations/import/page-url";
import { handleWooCommerceReturn } from "@/lib/integrations/woocommerce/callback";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const outcome = await handleWooCommerceReturn(
      { query: req.nextUrl.searchParams, sessionUserId: session?.user?.id ?? null },
      {
        findConnection: (storeId) =>
          prisma.importConnection.findUnique({
            where: { storeId_provider: { storeId, provider: "WOOCOMMERCE" } },
            select: { status: true, externalShopId: true, updatedAt: true },
          }),
      },
    );
    if (!outcome.ok) {
      logger.warn("[WooCommerce OAuth] Return rejected", { reason: outcome.error });
      return NextResponse.redirect(importPageUrl("WOOCOMMERCE", { error: outcome.error }));
    }
    return NextResponse.redirect(importPageUrl("WOOCOMMERCE", { connected: "1" }));
  } catch (err) {
    logger.error("[WooCommerce OAuth] Return failed", errorLogContext(err));
    return NextResponse.redirect(importPageUrl("WOOCOMMERCE", { error: "server_error" }));
  }
}

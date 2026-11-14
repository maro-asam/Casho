/**
 * Starts the WooCommerce key approval.
 *
 * POST /api/integrations/woocommerce/oauth/initiate  (form field: site)
 *
 * POST + SameSite=Lax session cookie → a cross-site page can't start a
 * connection on the merchant's behalf. The site is checked first (public
 * https host, WordPress REST answering, WooCommerce active, pretty
 * permalinks) so the merchant gets a clear reason here instead of a broken
 * WordPress page. The sealed state rides in `user_id` (see auth.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { listUserStores } from "@/lib/store/store-guard";
import { userCanManageImports } from "@/lib/integrations/import/access";
import { errorLogContext } from "@/lib/integrations/import/errors";
import { importPageUrl } from "@/lib/integrations/import/page-url";
import { buildAuthorizeUrl, sealAuthState } from "@/lib/integrations/woocommerce/auth";
import { isWooCommerceConfigured } from "@/lib/integrations/woocommerce/config";
import { discoverSite, SiteError, siteKey } from "@/lib/integrations/woocommerce/site";

/** Discovery may probe a slow site a few times (10 s timeout each). */
export const maxDuration = 60;

function back(error: string) {
  return NextResponse.redirect(importPageUrl("WOOCOMMERCE", { error }), 303);
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.redirect(`${process.env.APP_URL}/login`, 303);

  if (!isWooCommerceConfigured()) return back("not_configured");

  const form = await req.formData().catch(() => null);
  const input = String(form?.get("site") ?? "").slice(0, 500);
  if (!input.trim()) return back("invalid_site");

  // The dashboard always works on the user's own store first (see requireStoreContext).
  const owned = await prisma.store.findFirst({ where: { userId: session.user.id }, select: { id: true } });
  const storeId = owned?.id ?? (await listUserStores(session.user.id))[0]?.id;
  if (!storeId || !(await userCanManageImports(session.user.id, storeId))) return back("forbidden");

  let site;
  try {
    site = await discoverSite(input);
  } catch (err) {
    if (err instanceof SiteError) {
      logger.info("[WooCommerce OAuth] Site check failed", { storeId, reason: err.code });
      return back(err.code);
    }
    logger.error("[WooCommerce OAuth] Site check crashed", { storeId, ...errorLogContext(err) });
    return back("server_error");
  }

  const { token } = sealAuthState({ userId: session.user.id, storeId, home: site.home, name: site.name });
  logger.info("[WooCommerce OAuth] Initiated", { storeId, site: siteKey(site.home) });
  return NextResponse.redirect(buildAuthorizeUrl(site.home, token), 303);
}

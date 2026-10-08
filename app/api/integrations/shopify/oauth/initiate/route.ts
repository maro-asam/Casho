/**
 * Starts the Shopify OAuth flow.
 *
 * POST /api/integrations/shopify/oauth/initiate  (form field: shop)
 *
 * POST + SameSite=Lax session cookie → a cross-site page can't start a
 * connection on the merchant's behalf. The sealed state cookie binds the flow
 * to this user, store and shop (checked again in the callback).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { listUserStores } from "@/lib/store/store-guard";
import { userCanManageImports } from "@/lib/integrations/import/access";
import { isShopifyConfigured } from "@/lib/integrations/shopify/config";
import { buildAuthorizeUrl, createOAuthState, normalizeShopDomain } from "@/lib/integrations/shopify/oauth";
import { importPageUrl, stateCookieOptions } from "@/lib/integrations/shopify/http";

function back(error: string) {
  return NextResponse.redirect(importPageUrl({ error }), 303);
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.redirect(`${process.env.APP_URL}/login`, 303);

  if (!isShopifyConfigured()) return back("not_configured");

  const form = await req.formData().catch(() => null);
  const shop = normalizeShopDomain(String(form?.get("shop") ?? ""));
  if (!shop) return back("invalid_shop");

  // The dashboard always works on the user's own store first (see requireStoreContext).
  const owned = await prisma.store.findFirst({ where: { userId: session.user.id }, select: { id: true } });
  const storeId = owned?.id ?? (await listUserStores(session.user.id))[0]?.id;
  if (!storeId || !(await userCanManageImports(session.user.id, storeId))) return back("forbidden");

  const { state, cookie } = createOAuthState({ userId: session.user.id, storeId, shop });
  logger.info("[Shopify OAuth] Initiated", { storeId, shop });

  const response = NextResponse.redirect(buildAuthorizeUrl(shop, state.nonce), 303);
  const { name, ...options } = stateCookieOptions();
  response.cookies.set(name, cookie, options);
  return response;
}

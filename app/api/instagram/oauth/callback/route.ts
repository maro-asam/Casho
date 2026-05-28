/**
 * Instagram OAuth callback endpoint.
 * Meta redirects here after the merchant authorizes the app.
 *
 * GET /api/instagram/oauth/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";
import { getCurrentSession } from "@/lib/auth/session";
import { exchangeCodeForToken } from "@/lib/instagram/oauth";
import {
  exchangeForLongLivedToken,
  getIgUserProfile,
  getLinkedPages,
  subscribeToWebhook,
} from "@/lib/instagram/client";

export async function GET(req: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN || "localhost";
  const appOrigin =
    rootDomain === "localhost"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : `https://app.${rootDomain}`;
  const dashboardUrl = `${appOrigin}/dashboard/integrations/instagram`;

  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.redirect(`${process.env.APP_URL}/login`);
    }

    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // User denied permissions
    if (error) {
      return NextResponse.redirect(`${dashboardUrl}?error=denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${dashboardUrl}?error=no_code`);
    }

    // Verify CSRF state
    const cookieStore = await cookies();
    const savedState = cookieStore.get("ig_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(`${dashboardUrl}?error=invalid_state`);
    }

    // Find the merchant's store
    const store = await prisma.store.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.redirect(`${dashboardUrl}?error=no_store`);
    }

    // Exchange code → short-lived token → long-lived token
    const { access_token: shortLivedToken } = await exchangeCodeForToken(code);
    const longLived = await exchangeForLongLivedToken(shortLivedToken);

    // Get Instagram user profile
    const profile = await getIgUserProfile(longLived.access_token);

    // Get linked Facebook Pages (for webhook subscription)
    let pageId: string | null = null;
    let pageName: string | null = null;
    let pageAccessToken: string | null = null;

    try {
      const pages = await getLinkedPages(longLived.access_token);
      if (pages.data.length > 0) {
        pageId = pages.data[0].id;
        pageName = pages.data[0].name;
        pageAccessToken = pages.data[0].access_token;
      }
    } catch {
      // Pages are optional — continue without them
    }

    // Token expires in N seconds from now
    const tokenExpiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000)
      : null;

    // Encrypt and store the connection
    const encryptedToken = encryptSecret(longLived.access_token);

    await prisma.instagramConnection.upsert({
      where: { storeId: store.id },
      create: {
        storeId: store.id,
        igUserId: profile.id,
        igUsername: profile.username,
        igPageId: pageId,
        igPageName: pageName,
        accessTokenEnc: encryptedToken,
        tokenExpiresAt,
        status: "ACTIVE",
      },
      update: {
        igUserId: profile.id,
        igUsername: profile.username,
        igPageId: pageId,
        igPageName: pageName,
        accessTokenEnc: encryptedToken,
        tokenExpiresAt,
        status: "ACTIVE",
      },
    });

    // Subscribe to webhook if we have a page access token
    if (pageId && pageAccessToken) {
      try {
        await subscribeToWebhook(pageId, pageAccessToken);
        await prisma.instagramConnection.update({
          where: { storeId: store.id },
          data: { webhookVerified: true },
        });
      } catch {
        // Non-fatal — merchant can still sync manually
      }
    }

    // Clear the CSRF cookie
    const response = NextResponse.redirect(`${dashboardUrl}?success=connected`);
    response.cookies.delete("ig_oauth_state");

    return response;
  } catch (err) {
    console.error("[IG OAuth Callback]", err);
    return NextResponse.redirect(`${dashboardUrl}?error=server_error`);
  }
}

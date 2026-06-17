/**
 * Instagram OAuth initiation endpoint.
 *
 * GET /api/instagram/oauth/initiate
 *
 * Sets the CSRF state cookie and redirects to Instagram's authorization page.
 * Using a GET API route (rather than a Server Action) ensures the Set-Cookie
 * and Location headers are sent in the same HTTP response, which guarantees
 * the browser persists the cookie before following the redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { buildAuthorizationUrl } from "@/lib/instagram/oauth";

export async function GET(req: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN || "localhost";
  const appOrigin =
    rootDomain === "localhost"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : `https://app.${rootDomain}`;
  const dashboardUrl = `${appOrigin}/dashboard/integrations/instagram`;

  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.redirect(`${process.env.APP_URL}/login`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = buildAuthorizationUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Set cookie domain to the root domain (e.g. .casho.store) so it is sent
  // regardless of which subdomain the OAuth callback lands on.
  const cookieDomain =
    rootDomain !== "localhost" ? `.${rootDomain}` : undefined;

  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}

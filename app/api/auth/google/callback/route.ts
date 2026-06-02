import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/auth/google";
import { signPendingGoogleAuth } from "@/lib/auth/pending-google-auth";

const PENDING_COOKIE = "pendingGoogleAuth";

function getMerchantAppUrl() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  try {
    const u = new URL(appUrl);
    if (u.hostname === rootDomain) {
      return `${u.protocol}//app.${rootDomain}`;
    }
  } catch {
    // fall through
  }
  return appUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const merchantUrl = getMerchantAppUrl();

  if (error || !code) {
    return NextResponse.redirect(`${merchantUrl}/login?error=google_cancelled`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(`${merchantUrl}/login?error=google_failed`);
    }

    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${merchantUrl}/login?error=google_unverified`);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.sub }, { email: googleUser.email }],
      },
      select: { id: true, googleId: true },
    });

    if (existingUser) {
      if (!existingUser.googleId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { googleId: googleUser.sub },
        });
      }
      await createUserSession(existingUser.id);
      return NextResponse.redirect(`${merchantUrl}/dashboard`);
    }

    // New user — store Google data in signed cookie, redirect to complete registration
    const pendingToken = signPendingGoogleAuth({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || "",
    });

    const response = NextResponse.redirect(`${merchantUrl}/register/complete-google`);
    response.cookies.set(PENDING_COOKIE, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${merchantUrl}/login?error=google_failed`);
  }
}

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  GOOGLE_STATE_COOKIE,
  googleStateCookieOptions,
} from "@/lib/auth/google";
import { logSecurityEvent } from "@/lib/auth/security-log";
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

function sameState(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Every exit clears the one-time state cookie. */
function finish(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE, "", googleStateCookieOptions(0));
  return response;
}

export async function GET(request: NextRequest) {
  return finish(await handleCallback(request));
}

async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const merchantUrl = getMerchantAppUrl();

  if (error || !code) {
    return NextResponse.redirect(`${merchantUrl}/login?error=google_cancelled`);
  }

  // Login-CSRF guard: only finish a flow this browser started.
  if (!sameState(searchParams.get("state"), request.cookies.get(GOOGLE_STATE_COOKIE)?.value)) {
    return NextResponse.redirect(`${merchantUrl}/login?error=google_failed`);
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
      select: { id: true, googleId: true, emailVerified: true, password: true },
    });

    if (existingUser) {
      if (!existingUser.googleId) {
        // Google just proved who owns this inbox. If the account was created
        // with a password nobody ever verified, that password may belong to
        // someone who registered with this email first (pre-hijack) — drop it
        // and every session it opened. The owner signs in with Google, or sets
        // a new password through "forgot password".
        const unverifiedPassword = !existingUser.emailVerified && !!existingUser.password;
        await prisma.$transaction([
          prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: googleUser.sub,
              emailVerified: true,
              ...(unverifiedPassword && { password: null }),
            },
          }),
          ...(unverifiedPassword ? [prisma.session.deleteMany({ where: { userId: existingUser.id } })] : []),
        ]);
        if (unverifiedPassword) {
          logSecurityEvent({
            event: "ALL_SESSIONS_REVOKED",
            userId: existingUser.id,
            metadata: { reason: "google_link_unverified_password" },
          });
        }
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

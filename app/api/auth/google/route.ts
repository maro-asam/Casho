import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";
import { SIGNUP_REF_COOKIE } from "@/lib/sales/attribution";
import { normalizeReferralCode } from "@/lib/sales/rules";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(getGoogleAuthUrl());

  // Carry a referral code across the Google round trip; validated again server-side at signup.
  const ref = normalizeReferralCode(req.nextUrl.searchParams.get("ref"));
  if (ref) {
    response.cookies.set(SIGNUP_REF_COOKIE, ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return response;
}

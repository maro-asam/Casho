"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildAuthorizationUrl } from "@/lib/instagram/oauth";

/**
 * Initiates the Instagram OAuth flow.
 * Generates a CSRF state token, stores it in a cookie, then redirects to Meta.
 */
export async function ConnectInstagramAction() {
  await requireUserId();

  // Generate CSRF state
  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const authUrl = buildAuthorizationUrl(state);
  redirect(authUrl);
}

import { createHmac } from "crypto";

export type PendingGoogleAuth = {
  googleId: string;
  email: string;
  name: string;
};

/** Signed Google identity of a new user, carried from the OAuth callback to /register/complete-google. */
export const PENDING_GOOGLE_COOKIE = "pendingGoogleAuth";

function cookieScope() {
  const isProduction = process.env.NODE_ENV === "production";
  // The callback runs on APP_URL's host (the bare root in production), but the
  // page that reads this is on app.<root> — so share it like the session and
  // OAuth state cookies. A host-only cookie never reached the page, which sent
  // every new Google signup back to /register.
  return { path: "/", ...(isProduction ? { domain: `.${process.env.ROOT_DOMAIN || "casho.store"}` } : {}) };
}

export function pendingGoogleCookieOptions() {
  return {
    ...cookieScope(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 10, // 10 minutes
  };
}

/** What `cookies().delete()` needs to clear the cookie written above (a delete has to name the same domain). */
export function pendingGoogleCookieDelete() {
  return { name: PENDING_GOOGLE_COOKIE, ...cookieScope() };
}

function getSecret() {
  const s = process.env.GOOGLE_CLIENT_SECRET;
  if (!s) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return s;
}

export function signPendingGoogleAuth(data: PendingGoogleAuth): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPendingGoogleAuth(token: string): PendingGoogleAuth | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;
    const payload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);
    const expectedSig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

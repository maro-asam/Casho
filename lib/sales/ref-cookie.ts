/**
 * The referral code a visitor arrived with, remembered for 30 days so a
 * merchant who opens a rep's link, leaves, and signs up days later (from the
 * landing page, Google, or a typed URL) is still attributed. No DB access, so
 * the proxy can import it.
 *
 * Last link wins: opening another `?ref=` link replaces the code. The code is
 * only a candidate — signup validates it again (`resolveSignupReferral`).
 */
export const SIGNUP_REF_COOKIE = "signupRef";

export const SIGNUP_REF_MAX_AGE = 60 * 60 * 24 * 30;

function cookieScope() {
  const isProduction = process.env.NODE_ENV === "production";
  // Shared by casho.store (landing) and app.casho.store (signup) in production;
  // host-only in dev, like the session cookie.
  return { path: "/", ...(isProduction ? { domain: `.${process.env.ROOT_DOMAIN || "casho.store"}` } : {}) };
}

export function signupRefCookieOptions() {
  return {
    ...cookieScope(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SIGNUP_REF_MAX_AGE,
  };
}

/** What `cookies().delete()` needs to clear the cookie written above (a delete has to name the same domain). */
export function signupRefCookieDelete() {
  return { name: SIGNUP_REF_COOKIE, ...cookieScope() };
}

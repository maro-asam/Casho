/** URLs + cookie options shared by the Shopify route handlers. */
import { SHOPIFY_STATE_COOKIE, STATE_TTL_MS } from "./oauth";

/** The import page on the app subdomain (same origin logic as the Instagram integration). */
export function importPageUrl(params: Record<string, string> = {}) {
  const rootDomain = process.env.ROOT_DOMAIN || "localhost";
  const appOrigin =
    rootDomain === "localhost"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : `https://app.${rootDomain}`;
  const qs = new URLSearchParams(params).toString();
  return `${appOrigin}/dashboard/integrations/shopify${qs ? `?${qs}` : ""}`;
}

/** Root-domain cookie so it reaches the callback on whichever subdomain APP_URL uses. */
export function stateCookieOptions(maxAgeSeconds = STATE_TTL_MS / 1000) {
  const rootDomain = process.env.ROOT_DOMAIN || "localhost";
  return {
    name: SHOPIFY_STATE_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: maxAgeSeconds,
    path: "/api/integrations/shopify",
    ...(rootDomain !== "localhost" ? { domain: `.${rootDomain}` } : {}),
  };
}

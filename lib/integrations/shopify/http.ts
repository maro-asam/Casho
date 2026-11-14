/** URLs + cookie options shared by the Shopify route handlers. */
import { importPageUrl as providerPageUrl } from "@/lib/integrations/import/page-url";
import { SHOPIFY_STATE_COOKIE, STATE_TTL_MS } from "./oauth";

/** The Shopify import page on the app subdomain. */
export function importPageUrl(params: Record<string, string> = {}) {
  return providerPageUrl("SHOPIFY", params);
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

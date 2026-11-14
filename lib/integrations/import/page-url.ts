import type { ImportProvider } from "@prisma/client";
import { PROVIDER_PAGE_PATHS } from "./types";

/** A provider's import page on the app subdomain (same origin logic as the Instagram integration). */
export function importPageUrl(provider: ImportProvider, params: Record<string, string> = {}) {
  const rootDomain = process.env.ROOT_DOMAIN || "localhost";
  const appOrigin =
    rootDomain === "localhost"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : `https://app.${rootDomain}`;
  const qs = new URLSearchParams(params).toString();
  return `${appOrigin}/dashboard${PROVIDER_PAGE_PATHS[provider]}${qs ? `?${qs}` : ""}`;
}

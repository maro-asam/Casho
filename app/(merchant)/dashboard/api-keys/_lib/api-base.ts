import { API_VERSION } from "@/lib/api/types";

/** Mirrors the server-side cap in `createApiKey`. */
export const MAX_ACTIVE_KEYS = 10;

export function apiBaseUrl() {
  return `${(process.env.APP_URL ?? "https://app.casho.store").replace(/\/$/, "")}/api/${API_VERSION}`;
}

/**
 * Which part of Casho a page belongs to — decided by the server from the
 * request's host and the page path, never from what the browser claims.
 * Pure (no DB): the collector then looks the store up and checks that the
 * store id the browser sent is that store's.
 */
import { AUTH_PATH_PREFIXES, INTERNAL_PATH_PREFIXES, hasPathPrefix, type AnalyticsScopeName } from "./constants";

const RESERVED = new Set(["www", "app", "casho"]);

export type PageTenant =
  | { kind: "ignore"; reason: string }
  | { kind: "scope"; scope: Exclude<AnalyticsScopeName, "STOREFRONT"> }
  | { kind: "store"; by: "slug"; slug: string; viaPath: boolean }
  | { kind: "store"; by: "domain"; domain: string };

function storeSlugFromPath(path: string): string | null {
  const m = path.match(/^\/store\/([^/?#]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return m[1].toLowerCase();
  }
}

/**
 * @param host  request host, lowercased, without port
 * @param path  the page's pathname as the browser shows it
 * @param rootDomain e.g. "casho.store" ("localhost" hosts are handled for dev)
 */
export function resolvePageTenant(host: string, path: string, rootDomain: string): PageTenant {
  const h = host.toLowerCase().split(":")[0];
  const root = rootDomain.toLowerCase();

  let sub: string | null = null;
  let ours = false;
  if (h === "localhost" || h === "127.0.0.1" || h === root || h === `www.${root}`) {
    ours = true;
  } else if (h.endsWith(".localhost")) {
    ours = true;
    sub = h.slice(0, -".localhost".length) || null;
  } else if (h.endsWith(`.${root}`)) {
    ours = true;
    sub = h.slice(0, -(root.length + 1)) || null;
  }

  // A custom domain: the whole host is one store.
  if (!ours) return { kind: "store", by: "domain", domain: h.replace(/^www\./, "") };

  // A store's own subdomain.
  if (sub && !RESERVED.has(sub)) return { kind: "store", by: "slug", slug: sub, viaPath: false };

  // Storefront pages reached through /store/<slug> on the main or app host.
  const slug = storeSlugFromPath(path);
  if (slug) return { kind: "store", by: "slug", slug, viaPath: true };

  if (sub === "app") {
    if (hasPathPrefix(path, INTERNAL_PATH_PREFIXES)) return { kind: "ignore", reason: "internal" };
    if (hasPathPrefix(path, AUTH_PATH_PREFIXES)) return { kind: "scope", scope: "MARKETING" };
    return { kind: "scope", scope: "APP" };
  }

  // Dev: the dashboard also answers on plain localhost under /dashboard.
  if (hasPathPrefix(path, INTERNAL_PATH_PREFIXES)) return { kind: "ignore", reason: "internal" };
  if (hasPathPrefix(path, ["/dashboard", "/onboarding", "/builder", "/pos"])) return { kind: "scope", scope: "APP" };
  return { kind: "scope", scope: "MARKETING" };
}

/** Hosts whose referrals are "us" for a given page (self-referrals aren't a traffic source). */
export function ownHostsFor(tenant: PageTenant, rootDomain: string, pageHost: string): string[] {
  const host = pageHost.toLowerCase().replace(/^www\./, "");
  // A storefront's own host only — a click from casho.store to a store IS a referral for the store.
  if (tenant.kind === "store") return [host];
  // Casho's own site and app — but not storefront subdomains ("Powered by Casho" links are a real source).
  const root = rootDomain.toLowerCase();
  return [root, `app.${root}`, "localhost", "app.localhost"];
}

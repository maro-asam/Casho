/** The platform address `https://<slug>.<root>` — always the Casho subdomain, whatever domain the store has. */
export function buildStoreUrl(slug: string, path = "") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";

  try {
    const url = new URL(appUrl);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${url.protocol}//${slug}.${url.host}${path === "" ? "" : cleanPath}`;
  } catch {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `https://${slug}.casho.store${path === "" ? "" : cleanPath}`;
  }
}

export type StoreAddress = { slug: string; customDomain?: string | null; customDomainStatus?: string | null };

/** The live custom domain ("shop.com"), or null while there's none or it isn't ACTIVE. */
export function activeCustomDomain(store: StoreAddress) {
  return store.customDomain && store.customDomainStatus === "ACTIVE" ? store.customDomain : null;
}

/**
 * The store's public address — what merchants copy, share and open: the custom
 * domain once it's ACTIVE, the Casho subdomain otherwise (none yet, pending,
 * or failing — so a link never points at a domain that doesn't serve).
 */
export function storePublicUrl(store: StoreAddress, path = "") {
  const domain = activeCustomDomain(store);
  if (!domain) return buildStoreUrl(store.slug, path);
  const cleanPath = path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `https://${domain}${cleanPath}`;
}

/** "https://shop.com" → "shop.com", for showing an address as text. */
export function displayHost(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * What the admin pasted to pick a Casho store: a slug ("nour"), its Casho
 * address ("https://nour.casho.store/products") or its own domain ("nour.com").
 */
export type StoreRef = { slug: string } | { domain: string };

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function parseStoreRef(input: string, rootDomain = "casho.store"): StoreRef | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  if (SLUG.test(raw)) return { slug: raw };

  let host: string;
  try {
    host = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  const root = rootDomain.toLowerCase();
  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    return SLUG.test(sub) ? { slug: sub } : null;
  }
  return host.includes(".") ? { domain: host } : null;
}

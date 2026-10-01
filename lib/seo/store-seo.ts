import { prisma } from "@/lib/prisma";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "casho.store";
const RESERVED = new Set(["www", "app", "casho"]);

/** The store's public address: live custom domain first, platform subdomain otherwise. */
export function storeBaseUrl(store: { slug: string; customDomain?: string | null; customDomainStatus?: string | null }) {
  return store.customDomain && store.customDomainStatus === "ACTIVE" ? `https://${store.customDomain}` : buildStoreUrl(store.slug);
}

/** Plain text for meta descriptions: no tags, collapsed spaces, cut on a word. */
export function metaText(input: string | null | undefined, max = 155) {
  const text = String(input ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

export const isPlaceholderImage = (src?: string | null) => !src || src.includes("product-placeholder");

/** Absolute URL for an image path (OG / JSON-LD require absolute URLs). */
export function absoluteUrl(src: string | null | undefined, base: string) {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  try {
    return new URL(src, base).toString();
  } catch {
    return undefined;
  }
}

/**
 * Which store a request host belongs to — for host-level files like
 * /robots.txt and /sitemap.xml that live outside /store/[slug].
 */
export async function storeSlugFromHost(rawHost: string | null): Promise<string | null> {
  const host = (rawHost ?? "").split(":")[0].toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;

  for (const root of [ROOT_DOMAIN, "localhost"]) {
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -(root.length + 1));
      return sub && !sub.includes(".") && !RESERVED.has(sub) ? sub : null;
    }
  }

  const bare = host.replace(/^www\./, "");
  const store = await prisma.store
    .findFirst({ where: { customDomain: { in: [host, bare, `www.${bare}`] }, customDomainStatus: "ACTIVE" }, select: { slug: true } })
    .catch(() => null);
  return store?.slug ?? null;
}

/** <script type="application/ld+json"> payload, safe to inline. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

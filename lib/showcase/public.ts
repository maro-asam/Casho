import type { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isStorefrontOpen } from "@/lib/subscriptions";
import { displayHost, storePublicUrl } from "@/helpers/BuildStoreURL";
import { showcaseCategory, type ShowcaseCategory } from "./catalog";

/** What the landing renders for one example — no ids of stores or owners. */
export type ShowcaseCard = {
  id: string;
  name: string;
  category: ShowcaseCategory;
  url: string;
  host: string;
  imageUrl: string;
};

export type ShowcaseRow = {
  id: string;
  name: string;
  category: string;
  url: string;
  imageUrl: string;
  store: {
    slug: string;
    customDomain: string | null;
    customDomainStatus: string | null;
    subscriptionStatus: SubscriptionStatus;
  } | null;
};

/**
 * A published row → its card, or null when it must not show: a linked store
 * whose storefront is closed (an example that opens on "store unavailable"
 * hurts more than it helps). A linked store links to its live address.
 */
export function toShowcaseCard(row: ShowcaseRow): ShowcaseCard | null {
  if (row.store && !isStorefrontOpen(row.store.subscriptionStatus)) return null;
  const url = row.store ? storePublicUrl(row.store) : row.url;
  return {
    id: row.id,
    name: row.name,
    category: showcaseCategory(row.category),
    url,
    host: displayHost(url),
    imageUrl: resizeCloudinary(row.imageUrl, 960),
  };
}

/**
 * Cloudinary uploads get a width cap + automatic format/quality, so a 1440px
 * full-page screenshot doesn't ship at full size. Other hosts pass through.
 */
export function resizeCloudinary(url: string, width: number) {
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (!url.startsWith("https://res.cloudinary.com/") || at === -1) return url;
  const rest = url.slice(at + marker.length);
  // Already transformed (first segment is a transformation like "w_800,c_fill").
  if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;
  return `${url.slice(0, at + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

/** Published examples in the admin's order. Never throws — the landing must render without them. */
export async function getPublishedShowcase(): Promise<ShowcaseCard[]> {
  try {
    const rows = await prisma.showcaseSite.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 48,
      select: {
        id: true,
        name: true,
        category: true,
        url: true,
        imageUrl: true,
        store: { select: { slug: true, customDomain: true, customDomainStatus: true, subscriptionStatus: true } },
      },
    });
    return rows.map(toShowcaseCard).filter((card): card is ShowcaseCard => card !== null);
  } catch (error) {
    console.error("[showcase] failed to load examples", error);
    return [];
  }
}

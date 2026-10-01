import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { storeBaseUrl, storeSlugFromHost } from "@/lib/seo/store-seo";

const BASE_URL = process.env.APP_URL || "https://casho.store";

/** Host-aware: the platform gets its own rules; each store (subdomain / custom domain) gets its own. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const slug = await storeSlugFromHost(h.get("x-forwarded-host") ?? h.get("host"));

  if (slug) {
    const store = await prisma.store
      .findUnique({
        where: { slug },
        select: { slug: true, customDomain: true, customDomainStatus: true, settings: { select: { isIndexed: true } } },
      })
      .catch(() => null);
    if (store) {
      const base = storeBaseUrl(store);
      if (store.settings?.isIndexed === false) return { rules: [{ userAgent: "*", disallow: "/" }] };
      return {
        rules: [{ userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/order/", "/store/", "/api/", "/*?*sort=", "/*?*coupon="] }],
        sitemap: `${base}/sitemap.xml`,
        host: base,
      };
    }
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/", "/admin/", "/api/", "/store/"] }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

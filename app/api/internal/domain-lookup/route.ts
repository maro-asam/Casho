import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

// Called by the proxy, two ways:
//  ?domain=shop.com → { slug } — which store a custom domain serves. Only
//    ACTIVE domains route, so pending/failed ones never serve a store.
//    "www.shop.com" and "shop.com" resolve to the same store.
//  ?slug=mystore → { redirectTo } — the custom domain slug.casho.store should
//    redirect to, when the merchant turned the subdomain off. Null unless that
//    domain is ACTIVE, so the subdomain comes back on its own if it breaks.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (slug) {
    try {
      const store = await prisma.store.findUnique({
        where: { slug },
        select: { customDomain: true, customDomainStatus: true, subdomainEnabled: true },
      });
      const redirectTo =
        store && !store.subdomainEnabled && store.customDomain && store.customDomainStatus === "ACTIVE" ? store.customDomain : null;
      return NextResponse.json({ redirectTo }, { headers: CACHE });
    } catch {
      return NextResponse.json({ redirectTo: null });
    }
  }

  const raw = req.nextUrl.searchParams.get("domain")?.toLowerCase().trim();
  if (!raw) return NextResponse.json({ slug: null });

  const bare = raw.replace(/^www\./, "");
  const candidates = [...new Set([raw, bare, `www.${bare}`])];

  try {
    const store = await prisma.store.findFirst({
      where: { customDomain: { in: candidates }, customDomainStatus: "ACTIVE" },
      select: { slug: true },
    });
    return NextResponse.json({ slug: store?.slug ?? null }, { headers: CACHE });
  } catch {
    return NextResponse.json({ slug: null });
  }
}

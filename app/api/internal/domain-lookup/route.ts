import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by the proxy to resolve a custom domain to a store slug.
// Only ACTIVE domains route, so pending/failed ones never serve a store.
// "www.shop.com" and "shop.com" resolve to the same store.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("domain")?.toLowerCase().trim();
  if (!raw) return NextResponse.json({ slug: null });

  const bare = raw.replace(/^www\./, "");
  const candidates = [...new Set([raw, bare, `www.${bare}`])];

  try {
    const store = await prisma.store.findFirst({
      where: { customDomain: { in: candidates }, customDomainStatus: "ACTIVE" },
      select: { slug: true },
    });
    return NextResponse.json(
      { slug: store?.slug ?? null },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ slug: null });
  }
}

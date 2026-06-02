import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by middleware to resolve a custom domain to a store slug.
// Only returns a slug when the domain is ACTIVE so pending/failed domains don't route.
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return NextResponse.json({ slug: null });

  try {
    const store = await prisma.store.findFirst({
      where: { customDomain: domain, customDomainStatus: "ACTIVE" },
      select: { slug: true },
    });

    return NextResponse.json({ slug: store?.slug ?? null });
  } catch {
    return NextResponse.json({ slug: null });
  }
}

/**
 * Re-checks custom domains: activates PENDING ones whose DNS is now right and
 * flags ACTIVE ones that broke. Trigger from an external scheduler (e.g.
 * cron-job.org, every 10–30 min) with `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDomainCheck } from "@/lib/custom-domain/verify";

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stores = await prisma.store.findMany({
    where: { customDomain: { not: null } },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
    take: 500,
  });

  const results: Record<string, number> = { ACTIVE: 0, PENDING: 0, FAILED: 0 };
  for (const store of stores) {
    try {
      const report = await runDomainCheck({ ...store, customDomain: store.customDomain! });
      results[report.status] += 1;
    } catch (error) {
      console.error("[verify-domains]", store.customDomain, error);
    }
  }

  return NextResponse.json({ checked: stores.length, ...results });
}

export const GET = handler;
export const POST = handler;

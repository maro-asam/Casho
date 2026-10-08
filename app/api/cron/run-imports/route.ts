/**
 * Advances store imports (Shopify…) while nobody has the import page open.
 * Trigger from an external scheduler (e.g. cron-job.org, every minute) with
 * `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from "next/server";
import { runDueImportJobs } from "@/lib/integrations/import/engine";

export const maxDuration = 60;

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await runDueImportJobs({ totalBudgetMs: 50_000 }));
}

export const GET = handler;
export const POST = handler;

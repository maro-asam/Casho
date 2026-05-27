/**
 * Cron job endpoint — processes queued Instagram AI analysis jobs.
 *
 * Called every 2 minutes via Vercel Cron or external cron service.
 * Requires Authorization: Bearer {CRON_SECRET} header for security.
 *
 * POST /api/instagram/process-job/run
 */

import { NextRequest, NextResponse } from "next/server";
import { runPendingJobs } from "@/lib/queue/ig-job-runner";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Require a secret token to prevent unauthorized triggering
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPendingJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[IG Job Runner]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Also allow GET for Vercel Cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}

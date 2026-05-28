/**
 * Instagram job processor — external cron endpoint.
 *
 * This endpoint is intentionally NOT registered in vercel.json because the
 * Vercel Hobby plan only allows one cron execution per day. Instead, trigger
 * it from an external scheduler such as cron-job.org every 2 minutes.
 *
 * ─── cron-job.org setup ────────────────────────────────────────────────────
 *  URL:     https://casho.store/api/instagram/process-job/run
 *  Method:  POST  (or GET — both are accepted)
 *  Schedule: Every 2 minutes 
  
//  *  Headers: Authorization: Bearer <CRON_SECRET>
//  *
//  *  Where <CRON_SECRET> matches the CRON_SECRET environment variable set in
//  *  your Vercel project settings (Settings → Environment Variables).
//  * ───────────────────────────────────────────────────────────────────────────
//  *
//  * Security: requests without a valid Bearer token are rejected with 401.
//  */

import { NextRequest, NextResponse } from "next/server";
import { runPendingJobs } from "@/lib/queue/ig-job-runner";

async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPendingJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[IG Job Runner]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;

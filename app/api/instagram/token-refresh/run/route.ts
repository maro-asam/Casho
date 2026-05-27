/**
 * Token refresh cron endpoint.
 *
 * Triggered weekly by Vercel Cron (vercel.json: "0 6 * * 1" — Monday 06:00 UTC).
 * Requires Authorization: Bearer {CRON_SECRET} header.
 *
 * Also accepts POST for manual triggers.
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshExpiringTokens } from "@/lib/instagram/token-refresh";
import { logger } from "@/lib/logger";

async function handler(req: NextRequest) {
  const authHeader  = req.headers.get("authorization");
  const cronSecret  = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("[TokenRefresh Route] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("[TokenRefresh Route] Starting token refresh run");
    const result = await refreshExpiringTokens();

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[TokenRefresh Route] Unhandled error", { err: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const GET  = handler;
export const POST = handler;

/**
 * Internal cron endpoint — processes the webhook retry queue.
 * Trigger via Vercel Cron or an external scheduler every minute.
 *
 * Requires INTERNAL_API_SECRET in env (the route refuses every call without it).
 * Example cron config (vercel.json):
 *   { "crons": [{ "path": "/api/internal/webhooks/process", "schedule": "* * * * *" }] }
 */

import { processRetryQueue } from "@/lib/webhooks/engine";

export async function POST(req: Request) {
  // Fail closed: without a configured secret nobody may trigger the queue.
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processRetryQueue(100);
  return Response.json({ ok: true, processed });
}

// Also allow GET for Vercel Cron (which uses GET by default)
export async function GET(req: Request) {
  return POST(req);
}

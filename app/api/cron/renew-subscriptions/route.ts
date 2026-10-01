/**
 * Renews due subscriptions from the store balance, moves unpaid ones through
 * grace → past due, and warns stores whose balance won't cover the next
 * renewal. Trigger from an external scheduler (e.g. cron-job.org, every hour)
 * with `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from "next/server";
import { sweepSubscriptions } from "@/lib/billing/renewal";

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await sweepSubscriptions());
}

export const GET = handler;
export const POST = handler;

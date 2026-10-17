/**
 * Renews due subscriptions from the store balance, moves unpaid ones through
 * grace → past due, and warns stores whose balance won't cover the next
 * renewal, then re-syncs sales commissions for recent ledger activity (a safety
 * net for any missed billing hook — lib/sales/engine), and releases stock held
 * by unpaid Kashier orders. Trigger from an external scheduler (e.g. cron-job.org, every hour)
 * with `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from "next/server";
import { sweepSubscriptions } from "@/lib/billing/renewal";
import { sweepSalesCommissions } from "@/lib/sales/engine";
import { releaseUnpaidOnlineOrders } from "@/lib/inventory/order-stock";

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await sweepSubscriptions();
  const sales = await sweepSalesCommissions().catch((error) => {
    console.error("[cron] sales commissions", error);
    return { error: "sales sweep failed" };
  });
  // Same hourly run: give back stock held by card orders nobody paid and
  // cash orders nobody confirmed.
  const unpaidOrders = await releaseUnpaidOnlineOrders().catch((error) => {
    console.error("[cron] unpaid orders", error);
    return { error: "unpaid orders sweep failed" };
  });
  return NextResponse.json({ ...subscriptions, sales, unpaidOrders });
}

export const GET = handler;
export const POST = handler;

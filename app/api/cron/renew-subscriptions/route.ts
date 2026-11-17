/**
 * Renews due subscriptions from the store balance, moves unpaid ones through
 * grace → past due, and warns stores whose balance won't cover the next
 * renewal, then re-syncs sales commissions for recent ledger activity (a safety
 * net for any missed billing hook — lib/sales/engine), alerts reps about trials
 * ending unpaid and paid stores that closed (lib/sales/notify), releases stock held
 * by unpaid online (Paymob) orders, and renews domains Casho registered for stores
 * (lib/domains), and applies analytics retention (lib/analytics/retention). Trigger from an external scheduler (e.g. cron-job.org, every hour)
 * with `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from "next/server";
import { sweepSubscriptions } from "@/lib/billing/renewal";
import { sweepSalesCommissions } from "@/lib/sales/engine";
import { sweepRepAlerts } from "@/lib/sales/notify";
import { releaseUnpaidOnlineOrders } from "@/lib/inventory/order-stock";
import { sweepDomainRegistrations } from "@/lib/domains/purchase";
import { sweepAnalytics } from "@/lib/analytics/retention";

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
  // After renewals ran: tell reps about trials ending unpaid and paid stores that just closed.
  const salesAlerts = await sweepRepAlerts().catch((error) => {
    console.error("[cron] sales alerts", error);
    return { error: "sales alerts sweep failed" };
  });
  // Same hourly run: give back stock held by card orders nobody paid and
  // cash orders nobody confirmed.
  const unpaidOrders = await releaseUnpaidOnlineOrders().catch((error) => {
    console.error("[cron] unpaid orders", error);
    return { error: "unpaid orders sweep failed" };
  });
  const domains = await sweepDomainRegistrations().catch((error) => {
    console.error("[cron] domains", error);
    return { error: "domains sweep failed" };
  });
  // Analytics Center retention: drop raw events / visits past the configured age.
  const analytics = await sweepAnalytics().catch((error) => {
    console.error("[cron] analytics retention", error);
    return { error: "analytics retention failed" };
  });
  return NextResponse.json({ ...subscriptions, sales, salesAlerts, unpaidOrders, domains, analytics });
}

export const GET = handler;
export const POST = handler;

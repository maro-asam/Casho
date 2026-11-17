/**
 * Campaigns: UTM-tagged traffic, attributed verified signups / paid stores /
 * revenue, and — only where an admin entered real spend — cost per
 * acquisition and ROAS. No spend entered = no CPA/ROAS (never estimated).
 */
import { prisma } from "@/lib/prisma";
import { isStorefrontView, type AnalyticsFilter } from "../filters";
import { getAttributed, getBreakdown, getOrdersBy, type AttributionModel } from "./breakdowns";

const DAY_MS = 86_400_000;

export type CampaignCostRow = {
  id: string;
  campaign: string;
  source: string | null;
  startDate: string;
  endDate: string;
  amount: number;
  note: string | null;
};

/** Spend that falls inside the range: each entry spread evenly over its days. */
export function proratedCost(entry: { startDate: Date; endDate: Date; amount: number }, from: Date, to: Date): number {
  const start = entry.startDate.getTime();
  const end = entry.endDate.getTime() + DAY_MS; // endDate is inclusive
  const days = Math.max(1, Math.round((end - start) / DAY_MS));
  const overlap = Math.max(0, Math.min(end, to.getTime()) - Math.max(start, from.getTime()));
  return Math.round((entry.amount * Math.round(overlap / DAY_MS)) / days);
}

export async function getCampaigns(f: AnalyticsFilter, model: AttributionModel) {
  const storefront = isStorefrontView(f);
  const [traffic, conversions, costRows] = await Promise.all([
    getBreakdown(f, "campaign", 100),
    storefront ? getOrdersBy(f, "campaign") : getAttributed(f, "campaign", model),
    prisma.analyticsCampaignCost.findMany({ orderBy: { startDate: "desc" }, take: 300 }),
  ]);

  const costByCampaign = new Map<string, number>();
  for (const row of costRows) {
    const key = row.campaign.trim().toLowerCase();
    costByCampaign.set(key, (costByCampaign.get(key) ?? 0) + proratedCost(row, f.from, f.to));
  }

  return {
    storefront,
    traffic,
    conversions,
    costs: costRows.map(
      (r): CampaignCostRow => ({
        id: r.id,
        campaign: r.campaign,
        source: r.source,
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        amount: r.amount,
        note: r.note,
      }),
    ),
    costByCampaign: Object.fromEntries(costByCampaign),
  };
}

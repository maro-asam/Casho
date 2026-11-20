/**
 * Who may see what in the Analytics Center.
 *
 *   MEDIA_BUYER  aggregate dashboards, heatmaps, funnels, exports — Casho's own
 *               traffic only (marketing site + merchant dashboard, never a merchant's
 *               storefront: no store filter, no Stores tab, no storefront funnels),
 *               no settings tab; may add and delete campaign costs
 *   ADMIN        aggregate dashboards over everything, exports (exports are audit-logged)
 *   SUPER_ADMIN  + individual visitor journeys (every view audit-logged), settings,
 *                data deletion, funnel and campaign-cost edits
 *
 * Every page and route reads its filter through `readAnalyticsFilter` /
 * `analyticsFilterFor`, which pins a media buyer to Casho's own traffic.
 *
 * Merchants never reach these routes (admin layout + guards); a future
 * merchant view must call the queries with `storeId` pinned from the session.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getPanelUser } from "@/lib/admin/page-guard";
import { MEDIA_BUYER_HOME } from "@/lib/admin/panel-roles";
import { logSecurityEvent, type SecurityEvent } from "@/lib/auth/security-log";
import { parseAnalyticsFilter, withoutStorefronts, type AnalyticsFilter } from "./filters";

export type AnalyticsViewer = {
  id: string;
  email: string;
  role: UserRole;
  superAdmin: boolean;
  /** Casho's own traffic only — see the table above. */
  mediaBuyer: boolean;
};

/** Signed out → /login; signed in without access → throws (pages 404 via the admin layout, routes answer 403). */
export async function requireAnalyticsViewer(): Promise<AnalyticsViewer> {
  const user = await getPanelUser();
  if (!user) throw new Error("Unauthorized");
  return { ...user, superAdmin: user.role === UserRole.SUPER_ADMIN, mediaBuyer: user.role === UserRole.MEDIA_BUYER };
}

export async function requireAnalyticsSuperAdmin(): Promise<AnalyticsViewer> {
  const viewer = await requireAnalyticsViewer();
  if (!viewer.superAdmin) throw new Error("Unauthorized");
  return viewer;
}

/** Merchants' storefront data: everyone but a media buyer. */
export const canSeeStorefronts = (viewer: Pick<AnalyticsViewer, "mediaBuyer">) => !viewer.mediaBuyer;

/** Ad spend per campaign: the media buyer enters what they spent. */
export const canEditCampaignCosts = (viewer: Pick<AnalyticsViewer, "superAdmin" | "mediaBuyer">) => viewer.superAdmin || viewer.mediaBuyer;

/** Pages for storefront data only (the Stores tab): a media buyer goes back to the overview. */
export async function requireStorefrontViewer(): Promise<AnalyticsViewer> {
  const viewer = await requireAnalyticsViewer();
  if (!canSeeStorefronts(viewer)) redirect(MEDIA_BUYER_HOME);
  return viewer;
}

/** The URL's filters as this viewer may see them. */
export function analyticsFilterFor(viewer: Pick<AnalyticsViewer, "mediaBuyer">, params: Record<string, string | string[] | undefined>): AnalyticsFilter {
  const f = parseAnalyticsFilter(params);
  return canSeeStorefronts(viewer) ? f : withoutStorefronts(f);
}

/** A page's viewer and its filters, in one call — the only way analytics pages read their filters. */
export async function readAnalyticsFilter(params: Record<string, string | string[] | undefined>) {
  const viewer = await requireAnalyticsViewer();
  return { viewer, f: analyticsFilterFor(viewer, params) };
}

export async function auditAnalytics(
  viewer: Pick<AnalyticsViewer, "id">,
  event: Extract<SecurityEvent, `ANALYTICS_${string}`>,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
  } catch {
    // outside a request
  }
  logSecurityEvent({ event, userId: viewer.id, ipAddress, userAgent, metadata });
}

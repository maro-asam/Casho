/**
 * Who may see what in the Analytics Center.
 *
 *   ADMIN        aggregate dashboards, heatmaps, funnels, exports (exports are audit-logged)
 *   SUPER_ADMIN  + individual visitor journeys (every view audit-logged), settings,
 *                data deletion, funnel and campaign-cost edits
 *
 * Merchants never reach these routes (admin layout + guards); a future
 * merchant view must call the queries with `storeId` pinned from the session.
 */
import { headers } from "next/headers";
import { UserRole } from "@prisma/client";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { logSecurityEvent, type SecurityEvent } from "@/lib/auth/security-log";

export type AnalyticsViewer = { id: string; email: string; role: UserRole; superAdmin: boolean };

export async function requireAnalyticsViewer(): Promise<AnalyticsViewer> {
  const user = await requireAdmin();
  return { ...user, superAdmin: user.role === UserRole.SUPER_ADMIN };
}

export async function requireAnalyticsSuperAdmin(): Promise<AnalyticsViewer> {
  const viewer = await requireAnalyticsViewer();
  if (!viewer.superAdmin) throw new Error("Unauthorized");
  return viewer;
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

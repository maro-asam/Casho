/**
 * Who opens the admin panel, and how far.
 *
 *   ADMIN / SUPER_ADMIN  every page and action
 *   MEDIA_BUYER          the Analytics Center only (/admin/analytics), Casho's own
 *                        traffic (marketing site + merchant dashboard — never a
 *                        merchant's storefront), plus campaign costs. Every other
 *                        admin page sends them to MEDIA_BUYER_HOME.
 *
 * The admin layout only decides who gets the shell. Layouts don't re-render on
 * client navigation, so each page enforces its own rule: `requireAdminPage()`
 * (lib/admin/page-guard.ts) outside the Analytics Center, the viewer from
 * `requireAnalyticsViewer()` (lib/analytics/access.ts) inside it.
 */
import type { UserRole } from "@prisma/client"; // type only: the nav (a client component) uses this file

export const MEDIA_BUYER_HOME = "/admin/analytics";

export const isAdminRole = (role: UserRole) => role === "ADMIN" || role === "SUPER_ADMIN";

export const isMediaBuyer = (role: UserRole) => role === "MEDIA_BUYER";

/** May open /admin at all (the shell). Pages then apply their own rule. */
export const canOpenAdminPanel = (role: UserRole) => isAdminRole(role) || isMediaBuyer(role);

/** Analytics Center sections a media buyer doesn't get: merchants' stores, and the center's own configuration. */
export const MEDIA_BUYER_HIDDEN_ANALYTICS = ["/admin/analytics/stores", "/admin/analytics/settings"] as const;

export function mediaBuyerMayOpen(pathname: string): boolean {
  const inCenter = pathname === MEDIA_BUYER_HOME || pathname.startsWith(`${MEDIA_BUYER_HOME}/`);
  return inCenter && !MEDIA_BUYER_HIDDEN_ANALYTICS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

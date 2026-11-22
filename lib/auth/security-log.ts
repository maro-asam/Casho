/**
 * Security event logger — fire-and-forget, never throws.
 * All events are persisted in SecurityLog for audit trails.
 */

import { prisma } from "@/lib/prisma";

export type SecurityEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGIN_BLOCKED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "EMAIL_VERIFIED"
  | "EMAIL_CHANGED"
  | "ACCOUNT_LOCKED"
  | "SESSION_REVOKED"
  | "ALL_SESSIONS_REVOKED"
  | "ROLE_CHANGED"
  | "ACCOUNT_DELETED"
  | "STORE_DELETED"
  | "BRANCH_CREATED"
  | "BRANCH_ACTIVATED"
  | "BRANCH_DEACTIVATED"
  | "BRANCH_DELETED"
  | "MEMBER_BRANCHES_CHANGED"
  /** Written by lib/orders/track-order (awaited there, for its rate limit). */
  | "ORDER_TRACK_FAILED"
  /** Analytics Center (lib/analytics/access): who looked at / exported / changed what. */
  | "ANALYTICS_JOURNEY_VIEWED"
  | "ANALYTICS_EXPORTED"
  | "ANALYTICS_SETTINGS_CHANGED"
  | "ANALYTICS_DATA_DELETED"
  | "ANALYTICS_FUNNEL_CHANGED"
  | "ANALYTICS_COST_CHANGED"
  /** Lead Management (lib/leads/audit.ts): bulk and sensitive actions on the leads database. */
  | "LEADS_EXPORTED"
  | "LEADS_IMPORTED"
  | "LEADS_BULK_ASSIGNED"
  | "LEADS_BULK_STATUS"
  | "LEAD_DELETED"
  | "LEAD_LINKED"
  /** Store families (lib/store-family): a sandbox account opened another store / switched between its stores. */
  | "STORE_FAMILY_STORE_CREATED"
  | "STORE_FAMILY_SWITCHED";

export function logSecurityEvent(opts: {
  event: SecurityEvent;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  // Fire-and-forget — auth flow must never fail due to logging
  prisma.securityLog
    .create({
      data: {
        event: opts.event,
        userId: opts.userId ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
        metadata: opts.metadata ?? undefined,
      },
    })
    .catch((err) => console.error("[SecurityLog] write failed:", err));
}

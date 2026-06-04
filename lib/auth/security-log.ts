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
  | "ACCOUNT_LOCKED"
  | "SESSION_REVOKED"
  | "ALL_SESSIONS_REVOKED"
  | "ROLE_CHANGED";

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

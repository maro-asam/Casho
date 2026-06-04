/**
 * DB-backed brute-force / credential-stuffing protection.
 *
 * Strategy (layered):
 *   1. Per-email  — 5 failures in 15 min  → 15-min lockout
 *   2. Per-IP     — 20 failures in 15 min → 30-min lockout (catches stuffing)
 *
 * All state lives in the LoginAttempt table — no Redis / in-memory required.
 * Old records are cleaned up lazily to avoid unbounded table growth.
 */

import { prisma } from "@/lib/prisma";

const EMAIL_WINDOW_MS     = 15 * 60 * 1000; // 15 minutes
const EMAIL_MAX_FAILURES  = 5;
const EMAIL_LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

const IP_WINDOW_MS        = 15 * 60 * 1000; // 15 minutes
const IP_MAX_FAILURES     = 20;
const IP_LOCKOUT_MS       = 30 * 60 * 1000; // 30 minutes

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: Date; reason: "email" | "ip" };

export async function checkLoginRateLimit(
  email: string,
  ipAddress: string | null,
): Promise<RateLimitResult> {
  const now = Date.now();

  // ── Email lockout check ────────────────────────────────────────────────────
  const emailWindowStart = new Date(now - EMAIL_WINDOW_MS);
  const emailFailures = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: { gte: emailWindowStart },
    },
  });

  if (emailFailures >= EMAIL_MAX_FAILURES) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: emailWindowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfter = new Date((oldest?.createdAt.getTime() ?? now) + EMAIL_LOCKOUT_MS);
    return { allowed: false, retryAfter, reason: "email" };
  }

  // ── IP lockout check ───────────────────────────────────────────────────────
  if (ipAddress) {
    const ipWindowStart = new Date(now - IP_WINDOW_MS);
    const ipFailures = await prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: ipWindowStart },
      },
    });

    if (ipFailures >= IP_MAX_FAILURES) {
      const oldest = await prisma.loginAttempt.findFirst({
        where: {
          ipAddress,
          success: false,
          createdAt: { gte: ipWindowStart },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const retryAfter = new Date((oldest?.createdAt.getTime() ?? now) + IP_LOCKOUT_MS);
      return { allowed: false, retryAfter, reason: "ip" };
    }
  }

  return { allowed: true };
}

export async function recordLoginAttempt(opts: {
  email: string;
  ipAddress: string | null;
  success: boolean;
  userId?: string | null | undefined;
}) {
  await prisma.loginAttempt.create({
    data: {
      email: opts.email.toLowerCase(),
      ipAddress: opts.ipAddress,
      success: opts.success,
      userId: opts.userId ?? null,
    },
  });

  // Lazy cleanup: delete records older than 24 h to keep table small
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prisma.loginAttempt
      .deleteMany({ where: { createdAt: { lt: cutoff } } })
      .catch(() => {});
  }
}

export function formatRetryAfter(retryAfter: Date): string {
  const diffMs = retryAfter.getTime() - Date.now();
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes <= 1) return "دقيقة واحدة";
  return `${minutes} دقيقة`;
}

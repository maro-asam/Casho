import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent, type SecurityEvent } from "@/lib/auth/security-log";

/** Bulk and sensitive lead actions go to the security log too (per-lead history is LeadActivity). */
export async function auditLeads(userId: string, event: Extract<SecurityEvent, `LEAD${string}`>, metadata: Record<string, string | number | boolean | null> = {}) {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
  } catch {
    // outside a request
  }
  logSecurityEvent({ event, userId, ipAddress, userAgent, metadata });
}

/** Exports are capped per admin per hour — the whole database shouldn't walk out in a loop. */
export async function exportsInLastHour(userId: string) {
  return prisma.securityLog.count({ where: { userId, event: "LEADS_EXPORTED", createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
}

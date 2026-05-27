/**
 * Per-store AI rate limiting for Instagram job processing.
 *
 * Limits:
 *   MAX_AI_JOBS_PER_DAY — max OpenAI calls per store per calendar day
 *
 * Uses IgAiUsageLog rows (one per store per day) as a lightweight counter.
 * Not a hard atomic lock — under parallel load a few extra calls may slip through,
 * which is acceptable for this non-billing use case.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const MAX_AI_JOBS_PER_DAY = 100;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

/**
 * Returns true if the store is under the daily limit.
 * Does NOT increment — call incrementUsage() after a successful job.
 */
export async function checkRateLimit(storeId: string): Promise<boolean> {
  const date = todayKey();

  const record = await prisma.igAiUsageLog.findUnique({
    where: { storeId_date: { storeId, date } },
    select: { jobCount: true },
  });

  const count = record?.jobCount ?? 0;

  if (count >= MAX_AI_JOBS_PER_DAY) {
    logger.warn("[RateLimit] Store hit daily AI job limit", {
      storeId,
      date,
      count,
      limit: MAX_AI_JOBS_PER_DAY,
    });
    return false;
  }

  return true;
}

/**
 * Increments the daily usage counter for the store.
 * Call this after a successful OpenAI extraction (regardless of outcome).
 */
export async function incrementUsage(storeId: string): Promise<void> {
  const date = todayKey();

  await prisma.igAiUsageLog.upsert({
    where: { storeId_date: { storeId, date } },
    update: { jobCount: { increment: 1 } },
    create: { storeId, date, jobCount: 1 },
  });
}

/**
 * Returns today's usage count for a store (admin/debug use).
 */
export async function getUsageToday(storeId: string): Promise<number> {
  const date = todayKey();

  const record = await prisma.igAiUsageLog.findUnique({
    where: { storeId_date: { storeId, date } },
    select: { jobCount: true },
  });

  return record?.jobCount ?? 0;
}

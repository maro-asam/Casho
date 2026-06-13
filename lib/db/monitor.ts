/**
 * Database monitoring utilities.
 * Import and call from server actions, API routes, or cron jobs.
 */

import { prisma } from "@/lib/prisma";

// ─── Query timing helper ─────────────────────────────────────────────────────

/**
 * Wraps any async operation and logs its duration.
 * Useful for measuring the wall-clock cost of complex action chains.
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    if (ms > 200) {
      console.warn(`[DB TIMING] ${label} took ${ms}ms`);
    }
    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    console.error(`[DB TIMING] ${label} failed after ${ms}ms`, err);
    throw err;
  }
}

// ─── Health check ────────────────────────────────────────────────────────────

type DbHealthResult =
  | { status: "ok"; latencyMs: number }
  | { status: "error"; latencyMs: number; error: string };

/**
 * Lightweight health check — runs a single cheap query against the DB.
 * Safe to call from a /api/health endpoint.
 */
export async function checkDbHealth(): Promise<DbHealthResult> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);
    return { status: "ok", latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);
    console.error("[DB HEALTH] check failed:", error);
    return { status: "error", latencyMs, error };
  }
}

// ─── In-process query counter ────────────────────────────────────────────────

/**
 * Simple counter that can be incremented from server actions or middleware
 * when you want to track query volume without full APM tooling.
 *
 * Usage:
 *   queryCounter.increment()
 *   console.log(queryCounter.get())
 */
const _counter = { value: 0 };

export const queryCounter = {
  increment: () => { _counter.value++; },
  get: () => _counter.value,
  reset: () => { _counter.value = 0; },
};

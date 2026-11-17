/**
 * Shared pieces of the Analytics Center queries: Cairo-time buckets, the
 * result cache, and number coercion. Query results are plain JSON (numbers,
 * strings, ISO dates) so they can be cached between renders.
 */
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { addDaysToKey, cairoDayKey, cairoParts } from "@/app/(merchant)/dashboard/reports/_lib/range";
import type { AnalyticsFilter, Granularity } from "../filters";

export const ANALYTICS_CACHE_TAG = "analytics";

/**
 * Dashboard reads are cached for a minute: a page full of panels is one set
 * of queries per minute, however many admins look or how often they reload.
 */
export function cachedQuery<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, revalidate = 60) {
  return unstable_cache(fn, ["analytics", name], { revalidate, tags: [ANALYTICS_CACHE_TAG] });
}

/** Cairo-local timestamp of a UTC column. */
export const cairo = (col: Prisma.Sql) => Prisma.sql`((${col} AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo')`;

export function bucketSql(col: Prisma.Sql, g: Granularity): Prisma.Sql {
  const local = cairo(col);
  if (g === "hour") return Prisma.sql`to_char(date_trunc('hour', ${local}), 'YYYY-MM-DD"T"HH24')`;
  if (g === "week") return Prisma.sql`to_char(date_trunc('week', ${local}), 'YYYY-MM-DD')`;
  return Prisma.sql`to_char(${local}, 'YYYY-MM-DD')`;
}

const dayLabel = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", timeZone: "UTC" });
const hourLabel = new Intl.DateTimeFormat("ar-EG", { hour: "numeric", timeZone: "UTC" });

export type Bucket = { key: string; label: string };

function mondayOf(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  return addDaysToKey(key, -shift);
}

/** Every bucket of a range, in order (so empty hours/days show as 0, not as gaps). */
export function bucketsFor(fromKey: string, toKey: string, g: Granularity, now = new Date()): Bucket[] {
  const out: Bucket[] = [];
  if (g === "hour") {
    const today = cairoDayKey(now);
    const nowHour = cairoParts(now).hour;
    for (let key = fromKey; key <= toKey; key = addDaysToKey(key, 1)) {
      for (let h = 0; h < 24; h++) {
        if (key === today && h > nowHour) break;
        const hh = String(h).padStart(2, "0");
        const hour = hourLabel.format(new Date(Date.UTC(2000, 0, 1, h)));
        out.push({ key: `${key}T${hh}`, label: fromKey === toKey ? hour : `${dayLabel.format(new Date(`${key}T00:00:00Z`))} ${hour}` });
      }
    }
    return out;
  }
  if (g === "week") {
    for (let key = mondayOf(fromKey); key <= toKey; key = addDaysToKey(key, 7)) {
      out.push({ key, label: dayLabel.format(new Date(`${key}T00:00:00Z`)) });
    }
    return out;
  }
  for (let key = fromKey; key <= toKey; key = addDaysToKey(key, 1)) {
    out.push({ key, label: dayLabel.format(new Date(`${key}T00:00:00Z`)) });
  }
  return out;
}

/** Previous-period buckets, same granularity, aligned by position with the current ones. */
export function previousBuckets(f: AnalyticsFilter, now = new Date()): Bucket[] {
  if (!f.prevFromKey || !f.prevToKey) return [];
  return bucketsFor(f.prevFromKey, f.prevToKey, f.granularity, now);
}

export const num = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v) || 0;
  return 0;
};

export const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : num(v));

export const rangeSql = (col: Prisma.Sql, from: Date, to: Date) => Prisma.sql`${col} >= ${from} AND ${col} < ${to}`;

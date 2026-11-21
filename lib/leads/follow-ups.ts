/**
 * Follow-up buckets and Cairo-day boundaries (pure, unit-tested).
 *
 *   overdue    pending, due before now
 *   today      pending, due from now until the end of today (Cairo)
 *   upcoming   pending, due after today
 *   completed  done (canceled ones only show in a lead's history)
 */
import { cairoDayStart, SALES_TIMEZONE } from "@/lib/sales/rules";

export const FOLLOW_UP_BUCKETS = ["overdue", "today", "upcoming", "completed"] as const;
export type FollowUpBucket = (typeof FOLLOW_UP_BUCKETS)[number];

export const BUCKET_LABELS: Record<FollowUpBucket, string> = {
  overdue: "متأخرة",
  today: "النهارده",
  upcoming: "الجاية",
  completed: "خلصت",
};

const dayParts = new Intl.DateTimeFormat("en-US", { timeZone: SALES_TIMEZONE, year: "numeric", month: "numeric", day: "numeric" });

/** 00:00 of the instant's day in Cairo, and 00:00 of the next day. */
export function cairoDayBounds(at: Date): { start: Date; end: Date } {
  const parts = dayParts.formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const [y, m, d] = [get("year"), get("month"), get("day")];
  return { start: cairoDayStart(y, m, d), end: cairoDayStart(y, m, d + 1) };
}

export function followUpBucket(f: { status: "PENDING" | "DONE" | "CANCELED"; dueAt: Date }, now: Date): FollowUpBucket | null {
  if (f.status === "DONE") return "completed";
  if (f.status === "CANCELED") return null;
  if (f.dueAt.getTime() < now.getTime()) return "overdue";
  return f.dueAt.getTime() < cairoDayBounds(now).end.getTime() ? "today" : "upcoming";
}

/** Prisma `where` on dueAt/status for a bucket. */
export function bucketWhere(bucket: FollowUpBucket, now: Date) {
  const { end } = cairoDayBounds(now);
  switch (bucket) {
    case "overdue":
      return { status: "PENDING" as const, dueAt: { lt: now } };
    case "today":
      return { status: "PENDING" as const, dueAt: { gte: now, lt: end } };
    case "upcoming":
      return { status: "PENDING" as const, dueAt: { gte: end } };
    case "completed":
      return { status: "DONE" as const };
  }
}

/** A follow-up can't be put in the past (a minute of slack for slow forms) or more than a year out. */
export function validateDueAt(dueAt: Date, now: Date): string | null {
  if (Number.isNaN(dueAt.getTime())) return "الميعاد مش صحيح";
  if (dueAt.getTime() < now.getTime() - 60_000) return "الميعاد لازم يكون بعد دلوقتي";
  if (dueAt.getTime() > now.getTime() + 366 * 86_400_000) return "الميعاد بعيد قوي — خليه خلال سنة";
  return null;
}

/** The hourly cron reminds once, an hour ahead (or late, if it was missed). */
export const REMINDER_LEAD_MS = 60 * 60 * 1000;

export function reminderDue(f: { status: string; dueAt: Date; reminderSentAt: Date | null }, now: Date): boolean {
  return f.status === "PENDING" && !f.reminderSentAt && f.dueAt.getTime() <= now.getTime() + REMINDER_LEAD_MS;
}

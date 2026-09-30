// Report date ranges, always in Cairo time: a merchant's "today" starts at
// midnight Cairo, not at the server's midnight.

export const TIME_ZONE = "Africa/Cairo";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_CUSTOM_DAYS = 366;

export type RangePreset = "today" | "7d" | "30d" | "90d" | "mtd" | "12m" | "custom";
export type Granularity = "hour" | "day" | "month";

export type ReportRange = {
  preset: RangePreset;
  /** Inclusive start (Cairo midnight). */
  from: Date;
  /** Exclusive end. */
  to: Date;
  /** Same length, immediately before. */
  prevFrom: Date;
  prevTo: Date;
  /** YYYY-MM-DD, Cairo. `toKey` is the last included day. */
  fromKey: string;
  toKey: string;
  prevFromKey: string;
  prevToKey: string;
  days: number;
  prevDays: number;
  granularity: Granularity;
};

export const RANGE_PRESETS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "7d", label: "٧ أيام" },
  { value: "30d", label: "٣٠ يوم" },
  { value: "90d", label: "٩٠ يوم" },
  { value: "mtd", label: "الشهر ده" },
  { value: "12m", label: "١٢ شهر" },
];

const keyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  weekday: "short",
});

/** Cairo calendar day of an instant, as YYYY-MM-DD. */
export const cairoDayKey = (date: Date) => keyFormat.format(date);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Cairo wall-clock parts of an instant (weekday 0 = Sunday). */
export function cairoParts(date: Date) {
  const parts = Object.fromEntries(partsFormat.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Milliseconds Cairo is ahead of UTC at `date` (handles DST). */
function cairoOffset(date: Date) {
  const p = cairoParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant of Cairo midnight at the start of `key` (YYYY-MM-DD). */
export function cairoMidnight(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - cairoOffset(new Date(guess));
  // Re-check in case the offset changed between the guess and the real instant.
  return new Date(guess - cairoOffset(new Date(first)));
}

/** Shift a YYYY-MM-DD key by whole days (calendar arithmetic, no time zone). */
export function addDaysToKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const daysBetween = (fromKey: string, toKey: string) =>
  Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS) + 1;

const isKey = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

const LEGACY_PERIODS: Record<string, RangePreset> = { "7": "7d", "30": "30d", "90": "90d", "365": "12m" };

export function parseRange(params: { range?: string; from?: string; to?: string; period?: string }, now = new Date()): ReportRange {
  const todayKey = cairoDayKey(now);
  let preset: RangePreset = (params.range as RangePreset) ?? LEGACY_PERIODS[params.period ?? ""] ?? "30d";
  let fromKey: string;
  let toKey = todayKey;

  switch (preset) {
    case "today":
      fromKey = todayKey;
      break;
    case "7d":
      fromKey = addDaysToKey(todayKey, -6);
      break;
    case "90d":
      fromKey = addDaysToKey(todayKey, -89);
      break;
    case "mtd":
      fromKey = `${todayKey.slice(0, 8)}01`;
      break;
    case "12m": {
      // 12 whole months including the current one.
      const [y, m] = todayKey.split("-").map(Number);
      fromKey = new Date(Date.UTC(y, m - 12, 1)).toISOString().slice(0, 10);
      break;
    }
    case "custom":
      if (isKey(params.from) && isKey(params.to)) {
        [fromKey, toKey] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
        if (toKey > todayKey) toKey = todayKey;
        if (fromKey > toKey) fromKey = toKey;
        if (daysBetween(fromKey, toKey) > MAX_CUSTOM_DAYS) fromKey = addDaysToKey(toKey, -(MAX_CUSTOM_DAYS - 1));
        break;
      }
      preset = "30d";
      fromKey = addDaysToKey(todayKey, -29);
      break;
    default:
      preset = "30d";
      fromKey = addDaysToKey(todayKey, -29);
  }

  const days = daysBetween(fromKey, toKey);
  const from = cairoMidnight(fromKey);
  const to = cairoMidnight(addDaysToKey(toKey, 1));

  // What to compare with: the same days of last month for "this month", the
  // same months of last year for "12 months", otherwise the equal-length
  // stretch right before.
  let prevFromKey: string;
  let prevToKey: string;
  if (preset === "mtd") {
    prevFromKey = shiftMonths(fromKey, -1);
    prevToKey = shiftMonths(toKey, -1);
  } else if (preset === "12m") {
    prevFromKey = shiftMonths(fromKey, -12);
    prevToKey = shiftMonths(toKey, -12);
  } else {
    prevToKey = addDaysToKey(fromKey, -1);
    prevFromKey = addDaysToKey(prevToKey, -(days - 1));
  }

  return {
    preset,
    from,
    to,
    prevFrom: cairoMidnight(prevFromKey),
    prevTo: cairoMidnight(addDaysToKey(prevToKey, 1)),
    fromKey,
    toKey,
    prevFromKey,
    prevToKey,
    days,
    prevDays: daysBetween(prevFromKey, prevToKey),
    granularity: days === 1 ? "hour" : days <= 93 ? "day" : "month",
  };
}

/** Same day-of-month N months away, clamped to that month's length (31 → 30). */
function shiftMonths(key: string, months: number) {
  const [y, m, d] = key.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

const longDate = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", timeZone: "UTC" });

const keyToUtc = (key: string) => new Date(`${key}T00:00:00Z`);

/** "١ سبتمبر – ٣٠ سبتمبر ٢٠٢٦" */
export function formatRange(fromKey: string, toKey: string) {
  if (fromKey === toKey) return longDate.format(keyToUtc(fromKey));
  const sameYear = fromKey.slice(0, 4) === toKey.slice(0, 4);
  const start = sameYear ? shortDate.format(keyToUtc(fromKey)) : longDate.format(keyToUtc(fromKey));
  return `${start} – ${longDate.format(keyToUtc(toKey))}`;
}

// ── Buckets for the time series ─────────────────────────────────

export type Bucket = { key: string; label: string };

const monthLabel = new Intl.DateTimeFormat("ar-EG", { month: "short", year: "2-digit", timeZone: "UTC" });
const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "ص" : "م"}`;

/** Which bucket an instant falls in, matching `buildBuckets` keys. */
export function bucketKey(date: Date, granularity: Granularity) {
  if (granularity === "hour") return String(cairoParts(date).hour);
  const key = cairoDayKey(date);
  return granularity === "month" ? key.slice(0, 7) : key;
}

export function buildBuckets(fromKey: string, days: number, granularity: Granularity): Bucket[] {
  if (granularity === "hour") {
    return Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: hourLabel(h) }));
  }
  if (granularity === "day") {
    return Array.from({ length: days }, (_, i) => {
      const key = addDaysToKey(fromKey, i);
      return { key, label: shortDate.format(keyToUtc(key)) };
    });
  }
  const lastKey = addDaysToKey(fromKey, days - 1).slice(0, 7);
  const buckets: Bucket[] = [];
  const [y, m] = fromKey.split("-").map(Number);
  for (let i = 0; ; i++) {
    const date = new Date(Date.UTC(y, m - 1 + i, 1));
    const key = date.toISOString().slice(0, 7);
    buckets.push({ key, label: monthLabel.format(date) });
    if (key >= lastKey) break;
  }
  return buckets;
}

export { hourLabel };

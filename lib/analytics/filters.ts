/**
 * The Analytics Center's filters (date range, comparison, scope, store,
 * device) — parsed from the URL, so every view is linkable — and the one SQL
 * fragment every query uses to apply them. Tenant isolation lives here: a
 * store filter always pins `scope = STOREFRONT AND storeId = …`, and there is
 * no other way for a query to see a store's rows.
 */
import { Prisma } from "@prisma/client";
import { addDaysToKey, cairoDayKey, cairoMidnight } from "@/app/(merchant)/dashboard/reports/_lib/range";

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "month" | "last_month" | "custom";
export type CompareMode = "previous" | "year" | "none";
export type ScopeFilter = "marketing" | "app" | "storefront" | "all";
export type DeviceFilter = "all" | "desktop" | "tablet" | "mobile";
export type Granularity = "hour" | "day" | "week";

export type AnalyticsFilter = {
  preset: RangePreset;
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
  days: number;
  compare: CompareMode;
  prevFrom: Date | null;
  prevTo: Date | null;
  prevFromKey: string | null;
  prevToKey: string | null;
  scope: ScopeFilter;
  storeId: string | null;
  device: DeviceFilter;
  granularity: Granularity;
};

export const RANGE_OPTIONS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "yesterday", label: "امبارح" },
  { value: "7d", label: "آخر ٧ أيام" },
  { value: "30d", label: "آخر ٣٠ يوم" },
  { value: "90d", label: "آخر ٩٠ يوم" },
  { value: "month", label: "الشهر ده" },
  { value: "last_month", label: "الشهر اللي فات" },
];

export const SCOPE_OPTIONS: { value: ScopeFilter; label: string; hint: string }[] = [
  { value: "marketing", label: "موقع كاشو", hint: "casho.store وصفحات التسجيل والدخول" },
  { value: "app", label: "لوحة التاجر", hint: "استخدام التجار للداشبورد" },
  { value: "storefront", label: "المتاجر", hint: "زوار متاجر التجار" },
  { value: "all", label: "الكل", hint: "كل اللي فوق مع بعض" },
];

export const DEVICE_OPTIONS: { value: DeviceFilter; label: string }[] = [
  { value: "all", label: "كل الأجهزة" },
  { value: "desktop", label: "كمبيوتر" },
  { value: "tablet", label: "تابلت" },
  { value: "mobile", label: "موبايل" },
];

const MAX_DAYS = 400;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isKey = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000) + 1;

function monthStart(key: string, shift = 0) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + shift, 1)).toISOString().slice(0, 10);
}

function yearBack(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const last = new Date(Date.UTC(y - 1, m, 0)).getUTCDate();
  return new Date(Date.UTC(y - 1, m - 1, Math.min(d, last))).toISOString().slice(0, 10);
}

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, key: string) => {
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
};

export function parseAnalyticsFilter(params: Params, now = new Date()): AnalyticsFilter {
  const today = cairoDayKey(now);
  let preset = (one(params, "range") as RangePreset) || "30d";
  let fromKey: string;
  let toKey = today;

  switch (preset) {
    case "today":
      fromKey = today;
      break;
    case "yesterday":
      fromKey = toKey = addDaysToKey(today, -1);
      break;
    case "7d":
      fromKey = addDaysToKey(today, -6);
      break;
    case "90d":
      fromKey = addDaysToKey(today, -89);
      break;
    case "month":
      fromKey = monthStart(today);
      break;
    case "last_month":
      fromKey = monthStart(today, -1);
      toKey = addDaysToKey(monthStart(today), -1);
      break;
    case "custom": {
      const f = one(params, "from");
      const t = one(params, "to");
      if (isKey(f) && isKey(t)) {
        [fromKey, toKey] = f <= t ? [f, t] : [t, f];
        if (toKey > today) toKey = today;
        if (fromKey > toKey) fromKey = toKey;
        if (daysBetween(fromKey, toKey) > MAX_DAYS) fromKey = addDaysToKey(toKey, -(MAX_DAYS - 1));
        break;
      }
      preset = "30d";
      fromKey = addDaysToKey(today, -29);
      break;
    }
    default:
      preset = "30d";
      fromKey = addDaysToKey(today, -29);
  }

  const days = daysBetween(fromKey, toKey);
  const compareRaw = one(params, "compare");
  const compare: CompareMode = compareRaw === "year" || compareRaw === "none" ? compareRaw : "previous";

  let prevFromKey: string | null = null;
  let prevToKey: string | null = null;
  if (compare === "year") {
    prevFromKey = yearBack(fromKey);
    prevToKey = yearBack(toKey);
  } else if (compare === "previous") {
    if (preset === "month" || preset === "last_month") {
      // The same days of the month before.
      const [y, m] = fromKey.split("-").map(Number);
      prevFromKey = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
      const lastOfPrev = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
      const endDay = Math.min(Number(toKey.slice(8, 10)), lastOfPrev);
      prevToKey = `${prevFromKey.slice(0, 8)}${String(endDay).padStart(2, "0")}`;
    } else {
      prevToKey = addDaysToKey(fromKey, -1);
      prevFromKey = addDaysToKey(prevToKey, -(days - 1));
    }
  }

  const storeRaw = one(params, "store");
  const storeId = storeRaw && UUID.test(storeRaw) ? storeRaw.toLowerCase() : null;
  const scopeRaw = one(params, "scope") as ScopeFilter | undefined;
  const scope: ScopeFilter = storeId ? "storefront" : scopeRaw && ["marketing", "app", "storefront", "all"].includes(scopeRaw) ? scopeRaw : "marketing";
  const deviceRaw = one(params, "device") as DeviceFilter | undefined;
  const device: DeviceFilter = deviceRaw && ["desktop", "tablet", "mobile"].includes(deviceRaw) ? deviceRaw : "all";

  return {
    preset,
    from: cairoMidnight(fromKey),
    to: cairoMidnight(addDaysToKey(toKey, 1)),
    fromKey,
    toKey,
    days,
    compare,
    prevFrom: prevFromKey ? cairoMidnight(prevFromKey) : null,
    prevTo: prevToKey ? cairoMidnight(addDaysToKey(prevToKey, 1)) : null,
    prevFromKey,
    prevToKey,
    scope,
    storeId,
    device,
    granularity: days <= 2 ? "hour" : days <= 120 ? "day" : "week",
  };
}

/** The filter as URL params (for links that keep the current view). */
export function filterParams(f: AnalyticsFilter, overrides: Record<string, string | null> = {}): string {
  const p = new URLSearchParams();
  if (f.preset !== "30d") p.set("range", f.preset);
  if (f.preset === "custom") {
    p.set("from", f.fromKey);
    p.set("to", f.toKey);
  }
  if (f.compare !== "previous") p.set("compare", f.compare);
  if (f.storeId) p.set("store", f.storeId);
  else if (f.scope !== "marketing") p.set("scope", f.scope);
  if (f.device !== "all") p.set("device", f.device);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function cacheKeyOf(f: AnalyticsFilter) {
  return [f.from.toISOString(), f.to.toISOString(), f.prevFrom?.toISOString() ?? "-", f.scope, f.storeId ?? "-", f.device].join("|");
}

/**
 * WHERE fragment for a table with "scope", "storeId" and "device" columns,
 * e.g. scopeWhere(f, "s") → s."scope" = 'MARKETING' AND s."device" = 'mobile'.
 */
export function scopeWhere(f: Pick<AnalyticsFilter, "scope" | "storeId" | "device">, alias: string): Prisma.Sql {
  const t = Prisma.raw(`"${alias.replace(/[^a-z_]/gi, "")}"`);
  const parts: Prisma.Sql[] = [];
  if (f.storeId) {
    parts.push(Prisma.sql`${t}."scope" = 'STOREFRONT' AND ${t}."storeId" = ${f.storeId}`);
  } else if (f.scope === "marketing") {
    parts.push(Prisma.sql`${t}."scope" = 'MARKETING'`);
  } else if (f.scope === "app") {
    parts.push(Prisma.sql`${t}."scope" = 'APP'`);
  } else if (f.scope === "storefront") {
    parts.push(Prisma.sql`${t}."scope" = 'STOREFRONT'`);
  }
  if (f.device !== "all") parts.push(Prisma.sql`${t}."device" = ${f.device}`);
  return parts.length ? Prisma.join(parts, " AND ") : Prisma.sql`TRUE`;
}

/** Is this a Casho view (signups, subscriptions) or a storefront view (orders)? */
export const isStorefrontView = (f: Pick<AnalyticsFilter, "scope" | "storeId">) => f.scope === "storefront" || !!f.storeId;

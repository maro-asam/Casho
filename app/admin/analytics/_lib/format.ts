// Formatting + labels for the Analytics Center (Arabic, Cairo time).
import { CHANNEL_LABELS, type Channel } from "@/lib/analytics/channel";
import { KNOWN_EVENTS } from "@/lib/analytics/constants";

const nf = new Intl.NumberFormat("ar-EG");
const nf1 = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("ar-EG", { notation: "compact", maximumFractionDigits: 1 });
const pct0 = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 0 });
const pct1 = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const timeFmt = new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" });
const dateTimeFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
const rangeDate = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const fmtNum = (n: number) => nf.format(Math.round(n));
export const fmtDec = (n: number | null) => (n === null ? "—" : nf1.format(n));
export const fmtCompact = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : nf.format(Math.round(n)));
/** Fractions → "٤٥٪" (one decimal under 10 %). */
export const fmtPct = (r: number | null) => (r === null ? "—" : Math.abs(r) < 0.1 && r !== 0 ? pct1.format(r) : pct0.format(r));
/** Piasters → "١٬٢٣٤ ج.م." */
export const fmtMoney = (piasters: number) => money.format(Math.round(piasters) / 100);
export const fmtTime = (iso: string | Date) => timeFmt.format(new Date(iso));
export const fmtDateTime = (iso: string | Date) => dateTimeFmt.format(new Date(iso));

/** ms → "٢ د ٥ ث" / "٤٥ ث" / "١ س ٣ د". */
export function fmtDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${nf.format(s)} ث`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${nf.format(m)} د ${nf.format(s % 60)} ث`;
  return `${nf.format(Math.floor(m / 60))} س ${nf.format(m % 60)} د`;
}

/** "منذ ٣ د" — for live sessions. */
export function fmtSince(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${nf.format(s)} ث`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${nf.format(m)} د`;
  return `${nf.format(Math.floor(m / 60))} س ${nf.format(m % 60)} د`;
}

export function fmtRangeKeys(fromKey: string, toKey: string) {
  const f = rangeDate.format(new Date(`${fromKey}T00:00:00Z`));
  if (fromKey === toKey) return f;
  return `${f} – ${rangeDate.format(new Date(`${toKey}T00:00:00Z`))}`;
}

export const channelLabel = (c: string | null) => (c ? (CHANNEL_LABELS[c as Channel] ?? c) : "—");

export const DEVICE_LABELS: Record<string, string> = { desktop: "كمبيوتر", tablet: "تابلت", mobile: "موبايل" };
export const deviceLabel = (d: string | null) => (d ? (DEVICE_LABELS[d] ?? d) : "—");

export const SCOPE_LABELS: Record<string, string> = { MARKETING: "موقع كاشو", APP: "لوحة التاجر", STOREFRONT: "متجر" };

export const eventLabel = (name: string) => KNOWN_EVENTS[name as keyof typeof KNOWN_EVENTS] ?? name;

let regionNames: Intl.DisplayNames | null = null;
let languageNames: Intl.DisplayNames | null = null;

export function countryName(code: string | null) {
  if (!code) return "غير معروف";
  try {
    regionNames ??= new Intl.DisplayNames(["ar"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageName(code: string | null) {
  if (!code) return "غير معروف";
  try {
    languageNames ??= new Intl.DisplayNames(["ar"], { type: "language" });
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** 🇪🇬 from "EG" (regional indicator letters). */
export function flagOf(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Path shown in tables: "/" as "الرئيسية /". */
export const pathLabel = (p: string | null) => (p === null ? "—" : p === "/" ? "/ (الرئيسية)" : p);

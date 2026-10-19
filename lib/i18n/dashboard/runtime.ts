/**
 * Merchant-dashboard i18n runtime.
 *
 * The Arabic source text IS the message key: `tr("الطلبات")` renders "Orders"
 * for English users and the original Arabic otherwise. Anything without a
 * translation falls back to Arabic, so a missing entry never breaks a page.
 *
 * `tr()` is a plain function usable anywhere *during render* — server
 * components, client components and the helpers they call. The active locale
 * is resolved per environment:
 *   - RSC: a per-request React.cache store filled by `loadDashboardLocale()`
 *     (every dashboard layout/page awaits it before rendering).
 *   - SSR of client components: React context (read with `use`).
 *   - Browser: a module variable set by <DashboardI18nProvider> (one user).
 */
import * as React from "react";
import { LocaleContext } from "./context";

export type Locale = "ar" | "en";
export const LOCALES: Locale[] = ["ar", "en"];
export type Dictionary = Record<string, string>;

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}

// ---------------------------------------------------------------------------
// Locale resolution
// ---------------------------------------------------------------------------

// The react-server build has no createContext: that's how we know we're in RSC.
const IS_RSC = typeof (React as { createContext?: unknown }).createContext !== "function";

type RscStore = { locale: Locale | null };
let rscStore: (() => RscStore) | null = null;

/** Per-request store (RSC only). */
export function getRscStore(): RscStore | null {
  if (!IS_RSC) return null;
  if (!rscStore) {
    const cache = (React as unknown as { cache: <T>(fn: () => T) => () => T }).cache;
    rscStore = cache(() => ({ locale: null }));
  }
  return rscStore();
}

let browserLocale: Locale = "ar";

/** Called by the provider while it renders (browser only). */
export function setBrowserLocale(locale: Locale) {
  browserLocale = locale;
}

export function currentLocale(): Locale {
  if (IS_RSC) return getRscStore()?.locale ?? "ar";
  if (typeof window === "undefined") {
    // SSR of a client component: only ever called during render.
    try {
      // Only reached while a client component renders on the server, where
      // reading context from a plain helper is safe.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.use(LocaleContext);
    } catch {
      return "ar";
    }
  }
  return browserLocale;
}

export function isRtl(locale: Locale = currentLocale()) {
  return locale === "ar";
}

/** `dir` attribute value for the active locale. */
export function tdir(): "rtl" | "ltr" {
  return isRtl() ? "rtl" : "ltr";
}

// ---------------------------------------------------------------------------
// Dictionary + translation
// ---------------------------------------------------------------------------

let english: Dictionary | null = null;
let patterns: { re: RegExp; template: string; slots: number[] }[] | null = null;

export function registerEnglish(dict: Dictionary) {
  if (english === dict) return;
  english = dict;
  patterns = null;
}

export function hasEnglish() {
  return english !== null;
}

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Keys like "{0} منتج" also match fully-formed runtime strings ("12 منتج"). */
function buildPatterns(dict: Dictionary) {
  const out: NonNullable<typeof patterns> = [];
  for (const [key, template] of Object.entries(dict)) {
    if (!/\{\d+\}/.test(key)) continue;
    // Require real fixed text, so "{0}" alone never swallows arbitrary data.
    const fixed = key.replace(/\{\d+\}/g, "");
    if (fixed.replace(/[\s\p{P}]/gu, "").length < 2) continue;
    const slots: number[] = [];
    const source = key
      .split(/(\{\d+\})/)
      .map((part) => {
        const m = part.match(/^\{(\d+)\}$/);
        if (m) {
          slots.push(Number(m[1]));
          return "(.+?)";
        }
        return escapeRe(part);
      })
      .join("");
    out.push({ re: new RegExp(`^${source}$`, "s"), template, slots });
  }
  return out;
}

function interpolate(template: string, args: readonly unknown[]) {
  if (args.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (match, i) => {
    const value = args[Number(i)];
    return value === undefined || value === null ? match : String(value);
  });
}

function lookup(source: string, depth = 0): string | null {
  if (!english) return null;
  const direct = english[source];
  if (direct !== undefined) return direct;
  const normalized = normalize(source);
  if (normalized !== source && english[normalized] !== undefined) return english[normalized];
  patterns ??= buildPatterns(english);
  for (const p of patterns) {
    const m = normalized.match(p.re);
    if (!m) continue;
    const values: string[] = [];
    // Captured values can themselves be known text ("باقة سيلفر (شهري)").
    p.slots.forEach((slot, idx) => (values[slot] = (depth < 2 && lookup(m[idx + 1], depth + 1)) || m[idx + 1]));
    return interpolate(p.template, values);
  }
  return null;
}

/**
 * Translate Arabic source text. Placeholders are positional: `tr("{0} منتج", n)`.
 * Non-string input (null/undefined) passes through as an empty string.
 */
export function tr(source: string | null | undefined, ...args: unknown[]): string {
  if (source === null || source === undefined) return "";
  if (currentLocale() === "ar") return interpolate(source, args);
  const translated = lookup(source);
  return interpolate(translated ?? source, args);
}

/**
 * Translate a value of unknown shape (server-action messages, error props):
 * strings are looked up, anything else passes through untouched.
 */
export function trv<T>(value: T): T {
  return (typeof value === "string" ? tr(value) : value) as T;
}

/**
 * Module-level arrays of Arabic strings: elements are translated when read
 * (at render), not when the module loads.
 */
export function lazyList<T extends readonly unknown[]>(list: T): T {
  return new Proxy(list, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return typeof prop === "string" && /^\d+$/.test(prop) && typeof value === "string" ? tr(value) : value;
    },
  });
}

/** Translate with an explicit locale (route handlers, exports, emails). */
export function trIn(locale: Locale, source: string, ...args: unknown[]): string {
  if (locale === "ar") return interpolate(source, args);
  return interpolate(lookup(source) ?? source, args);
}

// ---------------------------------------------------------------------------
// Intl
// ---------------------------------------------------------------------------

export function intlLocale(locale: Locale = currentLocale()) {
  return locale === "ar" ? "ar-EG" : "en-US";
}

type NumberOpts = Intl.NumberFormatOptions | undefined;
type DateOpts = Intl.DateTimeFormatOptions | undefined;

const nfCache = new Map<string, Intl.NumberFormat>();
const dfCache = new Map<string, Intl.DateTimeFormat>();
const rfCache = new Map<string, Intl.RelativeTimeFormat>();

function cached<T>(map: Map<string, T>, key: string, make: () => T): T {
  let v = map.get(key);
  if (!v) {
    v = make();
    map.set(key, v);
  }
  return v;
}

export function numberFormat(opts?: NumberOpts, locale: Locale = currentLocale()) {
  const tag = intlLocale(locale);
  return cached(nfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.NumberFormat(tag, opts));
}

export function dateTimeFormat(opts?: DateOpts, locale: Locale = currentLocale()) {
  const tag = intlLocale(locale);
  return cached(dfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.DateTimeFormat(tag, opts));
}

export function relativeTimeFormat(opts?: Intl.RelativeTimeFormatOptions, locale: Locale = currentLocale()) {
  const tag = intlLocale(locale);
  return cached(rfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.RelativeTimeFormat(tag, opts));
}

/**
 * Drop-in replacements for module-level `new Intl.*Format("ar-EG", opts)`:
 * the locale is resolved at call time (render), not at import time.
 */
export const lazyIntl = {
  number(opts?: NumberOpts) {
    return {
      format: (value: number | bigint) => numberFormat(opts).format(value),
      formatToParts: (value: number | bigint) => numberFormat(opts).formatToParts(value),
      resolvedOptions: () => numberFormat(opts).resolvedOptions(),
    };
  },
  date(opts?: DateOpts) {
    return {
      format: (value?: Date | number) => dateTimeFormat(opts).format(value),
      formatToParts: (value?: Date | number) => dateTimeFormat(opts).formatToParts(value),
      formatRange: (a: Date | number, b: Date | number) => dateTimeFormat(opts).formatRange(a, b),
      resolvedOptions: () => dateTimeFormat(opts).resolvedOptions(),
    };
  },
  relative(opts?: Intl.RelativeTimeFormatOptions) {
    return {
      format: (value: number, unit: Intl.RelativeTimeFormatUnit) => relativeTimeFormat(opts).format(value, unit),
    };
  },
};

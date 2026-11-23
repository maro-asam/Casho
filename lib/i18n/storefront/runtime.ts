/**
 * Storefront i18n runtime — the shopper-facing twin of lib/i18n/dashboard.
 *
 * The Arabic source text IS the message key: `st("أضف للسلة")` renders
 * "Add to cart" in a store whose language is English, and the original Arabic
 * otherwise. Anything without a translation falls back to Arabic.
 *
 * The locale is the STORE's language (StoreSettings.storeLanguage, the Studio
 * draft while the owner previews), not the visitor's. It is resolved per
 * environment:
 *   - RSC: a per-request React.cache store filled by `loadStoreLocale(slug)`
 *     (the store layout and every storefront page await it before rendering).
 *   - SSR of client components: React context (read with `use`).
 *   - Browser: a module variable set by <StorefrontI18nProvider> (one store).
 *
 * `st()` is a plain function usable anywhere *during render* — and, in the
 * browser, in event handlers too (toasts, confirm dialogs).
 */
import * as React from "react";
import { StoreCurrencyContext, StoreLocaleContext } from "./context";
import { DEFAULT_STORE_CURRENCY, type StoreCurrency } from "@/lib/store/currency";
import { createCatalog, interpolate, type Dictionary } from "../catalog";

export type StoreLocale = "ar" | "en";
export type { Dictionary };

export function isStoreLocale(value: unknown): value is StoreLocale {
  return value === "ar" || value === "en";
}

/** Normalize a stored `storeLanguage` value. */
export function toStoreLocale(value: unknown): StoreLocale {
  return value === "en" ? "en" : "ar";
}

// ---------------------------------------------------------------------------
// Locale resolution
// ---------------------------------------------------------------------------

// The react-server build has no createContext: that's how we know we're in RSC.
const IS_RSC = typeof (React as { createContext?: unknown }).createContext !== "function";

type RscStore = { locale: StoreLocale | null; currency: StoreCurrency | null };
let rscStore: (() => RscStore) | null = null;

/** Per-request store (RSC only). */
export function getStoreRscStore(): RscStore | null {
  if (!IS_RSC) return null;
  if (!rscStore) {
    const cache = (React as unknown as { cache: <T>(fn: () => T) => () => T }).cache;
    rscStore = cache(() => ({ locale: null, currency: null }));
  }
  return rscStore();
}

let browserLocale: StoreLocale = "ar";
let browserCurrency: StoreCurrency = DEFAULT_STORE_CURRENCY;

/** Called by the provider while it renders (browser only). */
export function setBrowserStoreLocale(locale: StoreLocale) {
  browserLocale = locale;
}

/** Called by the provider while it renders (browser only). */
export function setBrowserStoreCurrency(currency: StoreCurrency) {
  browserCurrency = currency;
}

/**
 * The currency the store shows prices in (StoreSettings.storeCurrency),
 * resolved like the locale: RSC request store → React context → browser.
 */
export function storeCurrency(): StoreCurrency {
  if (IS_RSC) return getStoreRscStore()?.currency ?? DEFAULT_STORE_CURRENCY;
  if (typeof window === "undefined") {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.use(StoreCurrencyContext);
    } catch {
      return DEFAULT_STORE_CURRENCY;
    }
  }
  return browserCurrency;
}

export function storeLocale(): StoreLocale {
  if (IS_RSC) return getStoreRscStore()?.locale ?? "ar";
  if (typeof window === "undefined") {
    try {
      // Only reached while a client component renders on the server, where
      // reading context from a plain helper is safe.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.use(StoreLocaleContext);
    } catch {
      return "ar";
    }
  }
  return browserLocale;
}

/** `dir` attribute value for a store language (the active one by default). */
export function storeDir(locale: StoreLocale = storeLocale()): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

// ---------------------------------------------------------------------------
// Dictionary + translation
// ---------------------------------------------------------------------------

const catalog = createCatalog();

export function registerStoreEnglish(dict: Dictionary) {
  catalog.register(dict);
}

export function hasStoreEnglish() {
  return catalog.has();
}

/**
 * Translate storefront Arabic source text. Placeholders are positional:
 * `st("{0} منتج", n)`. null/undefined pass through as an empty string.
 */
export function st(source: string | null | undefined, ...args: unknown[]): string {
  if (source === null || source === undefined) return "";
  if (storeLocale() === "ar") return interpolate(source, args);
  return interpolate(catalog.lookup(source) ?? source, args);
}

/**
 * Translate a sentence whose slots hold elements (a bold number, a link):
 * `stRich("عرض {0} من {1} منتج", <b>1–20</b>, <b>45</b>)`. The whole
 * sentence is one key, so word order follows the language. Count words
 * (`{1|item|items}`) read the slot's text when it is a string or number.
 */
export function stRich(source: string, ...args: React.ReactNode[]): React.ReactNode {
  const counts = args.map((a) => (typeof a === "string" || typeof a === "number" ? a : textOf(a)));
  const template = (storeLocale() === "ar" ? source : (catalog.lookup(source) ?? source)).replace(
    /\{(\d+)\|([^|{}]*)\|([^|{}]*)\}/g,
    (match, i, one, other) => interpolate(`{0|${one}|${other}}`, [counts[Number(i)]]),
  );
  const parts = template.split(/\{(\d+)\}/);
  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, i) => (i % 2 === 0 ? part : (args[Number(part)] ?? `{${part}}`))),
  );
}

/** Plain text inside a simple element (`<b>45</b>`), for count words. */
function textOf(node: React.ReactNode): string | null {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: React.ReactNode }).children);
  return null;
}

/**
 * Translate a value of unknown shape (server-action messages, error props):
 * strings are looked up, anything else passes through untouched.
 */
export function stv<T>(value: T): T {
  return (typeof value === "string" ? st(value) : value) as T;
}

/**
 * Module-level arrays of Arabic strings: elements are translated when read
 * (at render), not when the module loads.
 */
export function stList<T extends readonly unknown[]>(list: T): T {
  return new Proxy(list, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return typeof prop === "string" && /^\d+$/.test(prop) && typeof value === "string" ? st(value) : value;
    },
  });
}

/** Translate with an explicit store language (emails, route handlers, server actions). */
export function stIn(locale: StoreLocale, source: string, ...args: unknown[]): string {
  if (locale === "ar") return interpolate(source, args);
  return interpolate(catalog.lookup(source) ?? source, args);
}

// ---------------------------------------------------------------------------
// Intl — Arabic stores keep Arabic-Indic digits, English ones Western digits.
// ---------------------------------------------------------------------------

export function storeIntlLocale(locale: StoreLocale = storeLocale()) {
  return locale === "en" ? "en-US" : "ar-EG";
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

export function storeNumberFormat(opts?: NumberOpts, locale: StoreLocale = storeLocale()) {
  const tag = storeIntlLocale(locale);
  return cached(nfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.NumberFormat(tag, opts));
}

export function storeDateFormat(opts?: DateOpts, locale: StoreLocale = storeLocale()) {
  const tag = storeIntlLocale(locale);
  return cached(dfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.DateTimeFormat(tag, opts));
}

export function storeRelativeFormat(opts?: Intl.RelativeTimeFormatOptions, locale: StoreLocale = storeLocale()) {
  const tag = storeIntlLocale(locale);
  return cached(rfCache, tag + JSON.stringify(opts ?? {}), () => new Intl.RelativeTimeFormat(tag, opts));
}

/**
 * Drop-in replacements for module-level `new Intl.*Format("ar-EG", opts)`:
 * the locale is resolved at call time (render), not at import time.
 */
export const lazyStoreIntl = {
  number(opts?: NumberOpts) {
    return {
      format: (value: number | bigint) => storeNumberFormat(opts).format(value),
      formatToParts: (value: number | bigint) => storeNumberFormat(opts).formatToParts(value),
      resolvedOptions: () => storeNumberFormat(opts).resolvedOptions(),
    };
  },
  date(opts?: DateOpts) {
    return {
      format: (value?: Date | number) => storeDateFormat(opts).format(value),
      formatToParts: (value?: Date | number) => storeDateFormat(opts).formatToParts(value),
      formatRange: (a: Date | number, b: Date | number) => storeDateFormat(opts).formatRange(a, b),
      resolvedOptions: () => storeDateFormat(opts).resolvedOptions(),
    };
  },
  relative(opts?: Intl.RelativeTimeFormatOptions) {
    return {
      format: (value: number, unit: Intl.RelativeTimeFormatUnit) => storeRelativeFormat(opts).format(value, unit),
    };
  },
  /** Amounts in the store's currency (resolved at call time): `money({ maximumFractionDigits: 2 })`. */
  money(opts?: Omit<Intl.NumberFormatOptions, "style" | "currency">) {
    return {
      format: (value: number | bigint) => storeNumberFormat({ ...opts, style: "currency", currency: storeCurrency() }).format(value),
    };
  },
};

/** A price in the store's currency (whole units) — "١٬٢٠٠ ج.م.‏" / "EGP 1,200" / "١٢٬٧٠٠ ج.س.". */
export function formatPrice(value: number) {
  return storeNumberFormat({ style: "currency", currency: storeCurrency(), maximumFractionDigits: 0 }).format(value);
}

/** A date in the store language (same defaults as lib/utils `formatDate`). */
export function formatStoreDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return storeDateFormat({ year: "numeric", month: "long", day: "numeric", ...options }).format(d);
}

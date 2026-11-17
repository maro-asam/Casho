/**
 * URL and text hygiene for everything the collector stores: paths lose their
 * ids, query strings lose secrets and contact details, free text loses
 * emails and long numbers. Pure — shared by the collector and its tests.
 */
import { BUILTIN_EXCLUDED_PARAMS, LIMITS, hasPathPrefix } from "./constants";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_HEX = /^[0-9a-f]{16,}$/i;
const LONG_NUMBER = /^\d{5,}$/;
/** cuid / signed tokens: long runs mixing letters and digits with no "-" (slugs keep their dashes). */
const TOKEN = /^(?=[A-Za-z0-9_]*\d)(?=[A-Za-z0-9_]*[A-Za-z])[A-Za-z0-9_]{20,}$|^[A-Za-z0-9_-]{40,}$/;

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * "/orders/3f2a…-…/edit?x=1#y" → "/orders/:id/edit". Arabic product slugs
 * stay readable (decoded); trailing slashes go; empty → "/".
 */
export function normalisePath(rawPath: string): string {
  let path = rawPath.split(/[?#]/)[0] || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const s = decodeSegment(segment);
      if (UUID.test(s) || LONG_HEX.test(s) || LONG_NUMBER.test(s)) return ":id";
      if (TOKEN.test(s)) return ":token";
      return s;
    });
  const out = `/${segments.join("/")}`;
  return out.length > LIMITS.maxPath ? out.slice(0, LIMITS.maxPath) : out;
}

/** Storefront pages served at /store/<slug>/… (root or app host) are stored store-relative. */
export function stripStorePrefix(path: string, slug: string | null | undefined): string {
  if (!slug) return path;
  for (const prefix of [`/store/${slug}`, `/store/${encodeURIComponent(slug)}`]) {
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length) || "/";
  }
  return path;
}

/** The query string with excluded/sensitive parameters removed and values that look personal masked. */
export function sanitiseQuery(search: string, extraExcluded: readonly string[] = []): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;
  const excluded = new Set([...BUILTIN_EXCLUDED_PARAMS, ...extraExcluded].map((p) => p.trim().toLowerCase()).filter(Boolean));
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }
  const kept: string[] = [];
  for (const [key, value] of params) {
    const k = key.toLowerCase();
    if (excluded.has(k) || k.startsWith("utm_")) continue;
    kept.push(`${encodeURIComponent(key)}=${encodeURIComponent(maskText(value).slice(0, 80))}`);
  }
  if (!kept.length) return null;
  const out = kept.join("&");
  return out.length > LIMITS.maxQuery ? out.slice(0, LIMITS.maxQuery) : out;
}

/** True when a path falls under one of the excluded prefixes ("/checkout", "/policies/privacy"). */
export function isExcludedPath(path: string, excluded: readonly string[]) {
  const clean = excluded.map((p) => p.trim()).filter((p) => p.startsWith("/"));
  return clean.length > 0 && hasPathPrefix(path, clean);
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const DIGITS = /(?:\+?\d[\d\s-]{4,}\d)/g;
const ARABIC_DIGITS = /[٠-٩۰-۹]{5,}/g;

/** Masks emails and long digit runs (phones, card or order numbers) in free text. */
export function maskText(text: string): string {
  return text.replace(EMAIL, "[email]").replace(DIGITS, "[n]").replace(ARABIC_DIGITS, "[n]");
}

/** Error messages and labels: masked, single line, capped. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const s = maskText(value.replace(/\s+/g, " ").trim());
  if (!s) return null;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** A URL inside an event (link href, failed request): own-site → normalised path, other sites → host only. */
export function describeUrl(raw: string, pageHost: string): string | null {
  if (!raw) return null;
  if (/^(mailto|tel|sms|whatsapp):/i.test(raw)) return raw.split(":")[0].toLowerCase();
  try {
    const url = new URL(raw, `https://${pageHost}`);
    if (url.host === pageHost) return normalisePath(url.pathname);
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

/** Host of a referrer URL, lowercased, without "www.". */
export function referrerHostOf(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export type UtmTags = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  clickIds: { gclid: boolean; msclkid: boolean; fbclid: boolean; ttclid: boolean };
};

/** UTM tags (trimmed, capped) and click-id presence from a landing URL's query. Click-id values are dropped. */
export function readUtm(search: string): UtmTags {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    params = new URLSearchParams();
  }
  // Campaign ids are long numbers (Meta's {{campaign.id}}), so only emails are masked here.
  const tag = (key: string) => {
    const v = params.get(key)?.trim();
    return v ? v.replace(EMAIL, "[email]").slice(0, 100) : null;
  };
  return {
    utmSource: tag("utm_source")?.toLowerCase() ?? null,
    utmMedium: tag("utm_medium")?.toLowerCase() ?? null,
    utmCampaign: tag("utm_campaign"),
    utmContent: tag("utm_content"),
    utmTerm: tag("utm_term"),
    clickIds: {
      gclid: params.has("gclid") || params.has("gbraid") || params.has("wbraid"),
      msclkid: params.has("msclkid"),
      fbclid: params.has("fbclid"),
      ttclid: params.has("ttclid"),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Domains sold through Casho — pure rules (client-safe, unit-tested).
//
//  Vercel's registrar quotes in USD; the store pays in piasters from its
//  balance. Price = USD × admin rate × (1 + markup), rounded up to 5 EGP.
//  Registrar calls: ./registrar.ts · money + lifecycle: ./purchase.ts
// ─────────────────────────────────────────────────────────────────────────────

/** TLDs offered in search, in display order (all sold by Vercel). */
export const SEARCH_TLDS = ["com", "net", "store", "shop", "online", "co", "org", "site", "me", "info"] as const;

/** A name priced above this (USD, first year or renewal) isn't sold — premium and niche registries. */
export const MAX_USD_PRICE = 100;

/** Renewal is charged from the balance starting this many days before expiry. */
export const RENEW_WINDOW_DAYS = 30;
/** After expiry, renewal keeps being tried this long before the domain is let go. */
export const EXPIRY_GRACE_DAYS = 7;

export type DomainPricing = {
  /** Piasters per 1 USD. */
  usdRate: number;
  /** Basis points on top of Vercel's price (2000 = 20%). */
  markupBps: number;
};

const DAY = 86_400_000;
const ROUND_TO = 500; // 5 EGP

export function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

/** USD (Vercel's price) → piasters the store pays, rounded up to the next 5 EGP. */
export function sellPrice(usd: number, pricing: DomainPricing) {
  const raw = (usdToCents(usd) * pricing.usdRate * (10_000 + pricing.markupBps)) / 1_000_000;
  return Math.ceil(raw / ROUND_TO) * ROUND_TO;
}

/** One name from the registrar's search (USD). */
export type SearchHit =
  | { domain: string; available: false }
  | { domain: string; available: true; years: number; price: number; renewalPrice: number; premium: boolean };

/** What the store sees for a name: piasters only — Vercel's cost never leaves the server. */
export type DomainOffer =
  | { domain: string; available: true; price: number; renewalPrice: number }
  /** premium = priced as a premium name; unsupported = too expensive, or not sold by the year. */
  | { domain: string; available: false; reason: "taken" | "premium" | "unsupported" };

export function toOffer(hit: SearchHit, pricing: DomainPricing): DomainOffer {
  if (!hit.available) return { domain: hit.domain, available: false, reason: "taken" };
  if (hit.premium) return { domain: hit.domain, available: false, reason: "premium" };
  if (hit.years !== 1 || hit.price > MAX_USD_PRICE || hit.renewalPrice > MAX_USD_PRICE) {
    return { domain: hit.domain, available: false, reason: "unsupported" };
  }
  return { domain: hit.domain, available: true, price: sellPrice(hit.price, pricing), renewalPrice: sellPrice(hit.renewalPrice, pricing) };
}

export type DomainQuery = { label: string; tld: string | null };

/**
 * What the merchant typed → a name to search.
 * "https://www.My Store.com/x" → { label: "mystore", tld: "com" }; "متجري" → null.
 */
export function parseDomainQuery(input: string): DomainQuery | null {
  let value = String(input ?? "").trim().toLowerCase();
  value = value.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "");
  const [rawLabel, ...rest] = value.split(".");
  const label = rawLabel
    .replace(/[\s_]+/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  if (label.length < 2 || label.length > 63) return null;
  const tld = rest.join(".").replace(/[^a-z0-9.]/g, "").replace(/^\.+|\.+$/g, "");
  return { label, tld: tld || null };
}

/** Names to look up for a query: the exact one typed first, then the usual TLDs. */
export function candidateDomains(query: DomainQuery) {
  const tlds = query.tld ? [query.tld, ...SEARCH_TLDS.filter((t) => t !== query.tld)] : [...SEARCH_TLDS];
  return tlds.map((tld) => `${query.label}.${tld}`);
}

/** Egyptian names (.eg, .com.eg…) can't be bought through the registrar. */
export function isEgyptianTld(tld: string | null) {
  return tld === "eg" || Boolean(tld?.endsWith(".eg"));
}

/** What a registration needs from the renewal sweep right now. */
export function renewalAction(
  reg: { autoRenew: boolean; expiresAt: Date | null },
  now: Date,
): "none" | "renew" | "expire" {
  if (!reg.expiresAt) return "none";
  const left = reg.expiresAt.getTime() - now.getTime();
  if (left < -EXPIRY_GRACE_DAYS * DAY) return "expire";
  if (!reg.autoRenew) return left < 0 ? "expire" : "none";
  return left <= RENEW_WINDOW_DAYS * DAY ? "renew" : "none";
}

/**
 * Whether to remind the owner that the balance won't cover the renewal:
 * every 5 days, then daily in the last 3 days.
 */
export function shouldSendRenewalNotice(expiresAt: Date, lastNotice: Date | null, now: Date) {
  if (!lastNotice) return true;
  const since = now.getTime() - lastNotice.getTime();
  const left = expiresAt.getTime() - now.getTime();
  return since >= (left <= 3 * DAY ? 1 : 5) * DAY;
}

/** Next expiry after a one-year renewal: a year after the current one (or now, if already past). */
export function nextExpiry(current: Date, now: Date) {
  const base = current.getTime() > now.getTime() ? current : now;
  const next = new Date(base);
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

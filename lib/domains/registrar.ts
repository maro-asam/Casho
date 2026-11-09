// ─────────────────────────────────────────────────────────────────────────────
//  Vercel Domains Registrar API — search, price, buy and renew domains on
//  Casho's Vercel team (same token as ../custom-domain/vercel.ts).
//  Prices are USD. Search needs no token; buying and renewing do, and are
//  charged to the team's card on Vercel.
//
//  Env: VERCEL_API_TOKEN, VERCEL_TEAM_ID (optional)
// ─────────────────────────────────────────────────────────────────────────────

import type { SearchHit } from "./pricing";
import type { Registrant } from "./registrant";

const TOKEN = process.env.VERCEL_API_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID;

/** Buying/renewing needs the token; searching works without it. */
export const registrarConfigured = Boolean(TOKEN);

export type RegistrarResult<T> =
  | { ok: true; data: T }
  /**
   * `definite` = Vercel answered with a refusal (4xx) — nothing was bought.
   * Otherwise (network error, timeout, 5xx) the outcome is unknown.
   */
  | { ok: false; status: number; code?: string; message?: string; definite: boolean };

function url(path: string) {
  const u = new URL(`https://api.vercel.com${path}`);
  if (TEAM) u.searchParams.set("teamId", TEAM);
  return u.toString();
}

async function call<T>(method: string, path: string, body?: unknown, timeoutMs = 20_000): Promise<RegistrarResult<T>> {
  try {
    const res = await fetch(url(path), {
      method,
      headers: { ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }), "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = (await res.json().catch(() => null)) as (T & { code?: string; message?: string; error?: { code?: string; message?: string } }) | null;
    if (res.ok) return { ok: true, data: data as T };
    const code = data?.code ?? data?.error?.code;
    const message = data?.message ?? data?.error?.message;
    console.error("[registrar]", method, path, res.status, code, message);
    return { ok: false, status: res.status, code, message, definite: res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429 };
  } catch (error) {
    console.error("[registrar]", method, path, error);
    return { ok: false, status: 0, definite: false };
  }
}

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);

/** Availability + first-year and renewal price (USD) for up to 200 names, in input order. */
export async function searchDomains(domains: string[]): Promise<SearchHit[] | null> {
  const res = await call<{ results: SearchHit[] }>("POST", "/v1/registrar/domains/search", { domains }, 12_000);
  return res.ok ? res.data.results : null;
}

/** Current purchase and renewal price (USD) of one name. */
export async function getDomainPrice(domain: string) {
  const res = await call<{ years: number; purchasePrice: number | string; renewalPrice: number | string }>(
    "GET",
    `/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`,
  );
  if (!res.ok) return null;
  const purchase = num(res.data.purchasePrice);
  const renewal = num(res.data.renewalPrice);
  return Number.isFinite(renewal) && renewal > 0 ? { purchase: Number.isFinite(purchase) ? purchase : null, renewal } : null;
}

/** Places a one-year order. Vercel's auto-renew stays off: Casho renews after charging the store. */
export function buyDomain(domain: string, input: { expectedPrice: number; contact: Registrant }) {
  return call<{ orderId: string }>("POST", `/v1/registrar/domains/${encodeURIComponent(domain)}/buy`, {
    autoRenew: false,
    years: 1,
    expectedPrice: input.expectedPrice,
    contactInformation: input.contact,
  });
}

/** Renews for one year. */
export function renewDomain(domain: string, input: { expectedPrice: number }) {
  return call<{ orderId: string }>("POST", `/v1/registrar/domains/${encodeURIComponent(domain)}/renew`, {
    years: 1,
    expectedPrice: input.expectedPrice,
  });
}

export type OrderOutcome = "pending" | "completed" | "failed";

/**
 * Where an order stands for one of its domains. null = no answer (including a
 * 404 — a fresh order may not be visible yet; callers fall back to checking
 * the team's domains once the order is old).
 */
export async function getOrderOutcome(orderId: string, domain: string): Promise<{ outcome: OrderOutcome; error?: string } | null> {
  const res = await call<{
    status: "draft" | "purchasing" | "completed" | "failed";
    domains: { domainName: string; status: "pending" | "completed" | "failed" | "refunded" | "refund-failed"; error?: { code?: string } }[];
    error?: { code?: string };
  }>("GET", `/v1/registrar/orders/${encodeURIComponent(orderId)}`);
  if (!res.ok) return null;

  const item = res.data.domains?.find((d) => d.domainName.toLowerCase() === domain);
  if (item?.status === "completed") return { outcome: "completed" };
  if (item && item.status !== "pending") return { outcome: "failed", error: item.error?.code ?? item.status };
  if (res.data.status === "failed") return { outcome: "failed", error: res.data.error?.code ?? "order-failed" };
  return { outcome: "pending" };
}

/**
 * The domain as Vercel holds it on the team. "missing" = not on the team
 * (Vercel said 404); null = couldn't ask.
 */
export async function getTeamDomain(domain: string): Promise<{ expiresAt: Date | null; boughtAt: Date | null } | "missing" | null> {
  const res = await call<{ domain: { expiresAt: number | null; boughtAt: number | null } }>("GET", `/v5/domains/${encodeURIComponent(domain)}`);
  if (!res.ok) return res.status === 404 ? "missing" : null;
  if (!res.data.domain) return null;
  const { expiresAt, boughtAt } = res.data.domain;
  return { expiresAt: expiresAt ? new Date(expiresAt) : null, boughtAt: boughtAt ? new Date(boughtAt) : null };
}

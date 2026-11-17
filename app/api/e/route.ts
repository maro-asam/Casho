/**
 * First-party analytics collector (Analytics Center — lib/analytics).
 *
 *   GET  /api/e?s=m|a|s   → the SDK's config for this scope (+ whether to ask for consent)
 *   POST /api/e           → a batch of page views / events, or a count-only storefront visit
 *
 * Same origin as the page on every host (casho.store, app.casho.store, store
 * subdomains, custom domains — the proxy lets /api through untouched). The
 * store and scope come from the request's host and the page path; the store
 * id the browser sends must match. Nothing here throws at the client: bad
 * input gets a 4xx, a database error a 204 (and a log line), so a broken
 * collector can never break a page.
 */
import { NextResponse, type NextRequest } from "next/server";

import { LIMITS, COOKIE_TEAM, type AnalyticsScopeName, type ScopeCode } from "@/lib/analytics/constants";
import { SESSION_COOKIE_NAME, countAnonymousVisit, readViewer, resolveTenantStore, writeBatch } from "@/lib/analytics/collector";
import { RateLimiter, isInternalIp } from "@/lib/analytics/guard";
import { normaliseBatch } from "@/lib/analytics/ingest";
import { getAnalyticsSettings, publicConfig, scopeEnabled } from "@/lib/analytics/settings";
import { ownHostsFor, resolvePageTenant } from "@/lib/analytics/tenant";
import { isBotUserAgent, parseUserAgent } from "@/lib/analytics/ua";
import { batchSchema, visitPingSchema } from "@/lib/analytics/wire";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || "casho.store").toLowerCase();
/** Batches per minute per IP, per server instance. A normal visitor sends a few. */
const limiter = new RateLimiter(120);

const noContent = () => new NextResponse(null, { status: 204 });
const stop = () => NextResponse.json({ stop: true }, { status: 200 });

function requestHost(req: NextRequest) {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().split(":")[0].toLowerCase();
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

/** Approximate location from the host's IP geolocation headers (Vercel; Cloudflare country as a fallback). */
function geoOf(req: NextRequest) {
  const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "").toUpperCase();
  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v).slice(0, 80) || null;
    } catch {
      return null;
    }
  };
  return {
    country: /^[A-Z]{2}$/.test(country) && country !== "XX" && country !== "T1" ? country : null,
    region: decode(req.headers.get("x-vercel-ip-country-region")),
    city: decode(req.headers.get("x-vercel-ip-city")),
  };
}

function pathnameOf(raw: string) {
  return raw.split(/[?#]/)[0] || "/";
}

// ─── Config ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s");
  const scope: ScopeCode = s === "a" || s === "s" ? s : "m";
  const settings = await getAnalyticsSettings();
  return NextResponse.json(publicConfig(settings, scope, geoOf(req).country), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

// ─── Collect ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > LIMITS.maxBody) return new NextResponse(null, { status: 413 });

  const ua = req.headers.get("user-agent");
  if (isBotUserAgent(ua)) return noContent();

  const ip = clientIp(req);
  if (!limiter.take(ip ?? "unknown")) return new NextResponse(null, { status: 429 });

  const host = requestHost(req);
  // Only the page's own origin may post (blocks other sites forging traffic for a store).
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).hostname.toLowerCase() !== host) return new NextResponse(null, { status: 403 });
    } catch {
      return new NextResponse(null, { status: 403 });
    }
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > LIMITS.maxBody) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const settings = await getAnalyticsSettings();
    if (isInternalIp(ip, settings.internalIps)) return noContent();
    if (settings.excludeTeam && req.cookies.get(COOKIE_TEAM)?.value === "1") return stop();

    // ── Count-only storefront visit ──────────────────────────────────────
    const ping = visitPingSchema.safeParse(body);
    if (ping.success) {
      const referer = req.headers.get("referer");
      const pagePath = referer ? new URL(referer, `https://${host}`).pathname : "/";
      const tenant = resolvePageTenant(host, pagePath, ROOT_DOMAIN);
      if (tenant.kind !== "store") return new NextResponse(null, { status: 400 });
      const store = await resolveTenantStore(tenant);
      if (!store || store.id !== ping.data.st) return new NextResponse(null, { status: 400 });
      const viewer = await readViewer(req.cookies.get(SESSION_COOKIE_NAME)?.value, store.id);
      if (viewer && (viewer.ownsStore || (settings.excludeTeam && viewer.staff))) return noContent();
      await countAnonymousVisit(store.id);
      return noContent();
    }

    // ── Batch ────────────────────────────────────────────────────────────
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return new NextResponse(null, { status: 400 });
    const batch = parsed.data;

    const landingPath = pathnameOf(batch.ss.lp);
    const tenant = resolvePageTenant(host, landingPath, ROOT_DOMAIN);
    if (tenant.kind === "ignore") return noContent();

    let storeId: string | null = null;
    let storeSlugInPath: string | null = null;
    let scopeOf: (pathname: string) => AnalyticsScopeName | null;

    if (tenant.kind === "store") {
      if (batch.sc !== "s") return new NextResponse(null, { status: 400 });
      if (!scopeEnabled(settings, "s")) return noContent();
      const store = await resolveTenantStore(tenant);
      // Tenant isolation: events land on the store whose address the page is on — nowhere else.
      if (!store || store.id !== batch.st) return new NextResponse(null, { status: 400 });
      storeId = store.id;
      storeSlugInPath = tenant.by === "slug" && tenant.viaPath ? tenant.slug : null;
      scopeOf = (pathname) => {
        const t = resolvePageTenant(host, pathname, ROOT_DOMAIN);
        if (t.kind !== "store") return null;
        if (t.by === "slug" && t.slug !== store.slug) return null; // another store's path on the same host
        return "STOREFRONT";
      };
    } else {
      if (batch.sc === "s" || batch.st) return new NextResponse(null, { status: 400 });
      // Per page: one session can run from the signup page (Casho site) into the dashboard (app).
      scopeOf = (pathname) => {
        const t = resolvePageTenant(host, pathname, ROOT_DOMAIN);
        if (t.kind !== "scope") return null;
        return scopeEnabled(settings, t.scope === "APP" ? "a" : "m") ? t.scope : null;
      };
    }

    // First batch of a session: who is it? Staff and the store's own team aren't visitors.
    const isFirstBatch = batch.e.some((item) => item.k === "pv" && item.q === 1);
    const viewer = isFirstBatch ? await readViewer(req.cookies.get(SESSION_COOKIE_NAME)?.value, storeId) : null;
    if (viewer && settings.excludeTeam && viewer.staff) return stop();
    if (viewer && storeId && viewer.ownsStore) return stop();

    const normalised = normaliseBatch(batch, {
      now: Date.now(),
      scopeOf,
      storeId,
      storeSlugInPath,
      ownHosts: ownHostsFor(tenant, ROOT_DOMAIN, host),
      ua: parseUserAgent(ua ?? "", batch.ss.tch ?? 0),
      geo: geoOf(req),
      // Shoppers on a storefront are never tied to a Casho account.
      userId: storeId ? null : (viewer?.userId ?? null),
      settings,
    });
    if (!normalised) return noContent();

    const result = await writeBatch(normalised, { countVisit: !batch.nv });
    if (!result.ok) return new NextResponse(null, { status: 409 });
    return noContent();
  } catch (error) {
    console.error("[analytics] collect", error);
    return noContent();
  }
}

/**
 * Turns a validated batch into the rows the collector writes — pure, so the
 * privacy rules (what is dropped, masked or kept) are unit-tested.
 */
import { classifyChannel, sourceLabel, type Channel } from "./channel";
import { KNOWN_EVENTS, LIMITS, SERVER_ONLY_EVENTS, type AnalyticsScopeName } from "./constants";
import { cleanText, isExcludedPath, normalisePath, readUtm, referrerHostOf, sanitiseQuery, stripStorePrefix } from "./paths";
import type { AnalyticsSettingsValue } from "./settings";
import type { UaInfo } from "./ua";
import type { Batch } from "./wire";

export type IngestContext = {
  /** Server time, ms. */
  now: number;
  /**
   * Scope of a page from its raw pathname (decided by the host + path, see
   * tenant.ts); null = never collected (internal tools). A storefront batch
   * returns STOREFRONT for everything.
   */
  scopeOf: (pathname: string) => AnalyticsScopeName | null;
  storeId: string | null;
  /** Set when the storefront is reached through /store/<slug> — stripped from paths. */
  storeSlugInPath: string | null;
  ownHosts: string[];
  ua: UaInfo;
  geo: { country: string | null; region: string | null; city: string | null };
  userId: string | null;
  settings: Pick<
    AnalyticsSettingsValue,
    | "excludedPaths"
    | "excludedQueryParams"
    | "trackClicks"
    | "trackForms"
    | "trackErrors"
    | "trackVitals"
    | "trackCustomEvents"
    | "trackScroll"
    | "heatmapsEnabled"
    | "heatmapPrivatePages"
  >;
};

export type SessionRow = {
  id: string;
  visitorId: string;
  scope: AnalyticsScopeName;
  storeId: string | null;
  startedAt: Date;
  lastSeenAt: Date;
  isReturning: boolean;
  entryPath: string;
  exitPath: string;
  channel: Channel;
  source: string;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  device: string;
  browser: string;
  os: string;
  screen: string | null;
  viewportW: number;
  viewportH: number;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userId: string | null;
};

export type PageViewRow = {
  id: string;
  sessionId: string;
  visitorId: string;
  scope: AnalyticsScopeName;
  storeId: string | null;
  path: string;
  title: string | null;
  query: string | null;
  prevPath: string | null;
  seq: number;
  startedAt: Date;
  docHeight: number | null;
  viewportW: number;
  viewportH: number | null;
  device: string;
};

export type PageUpdateRow = { id: string; engagedMs: number; scrollPct: number; docHeight: number | null };

export type EventRow = {
  id: string;
  sessionId: string;
  visitorId: string;
  scope: AnalyticsScopeName;
  storeId: string | null;
  name: string;
  path: string | null;
  ts: Date;
  device: string;
  x: number | null;
  y: number | null;
  vw: number | null;
  dh: number | null;
  sel: string | null;
  ex: number | null;
  ey: number | null;
  value: number | null;
  props: Record<string, string | number | boolean> | null;
};

export type NormalisedBatch = {
  session: SessionRow;
  pageviews: PageViewRow[];
  updates: PageUpdateRow[];
  events: EventRow[];
  dropped: number;
};

const ERROR_EVENTS = new Set(["js_error", "resource_error", "request_failed"]);
const FORM_EVENTS = new Set(["form_started", "form_submitted"]);
/** Props that may carry page text — never kept from the private dashboard. */
const TEXT_PROPS = new Set(["label", "text", "title"]);

const round = (n: number | undefined, digits = 4) => (n === undefined ? null : Math.round(n * 10 ** digits) / 10 ** digits);
const int = (n: number | undefined) => (n === undefined ? null : Math.round(n));

function splitUrl(raw: string): { pathname: string; search: string } {
  const q = raw.indexOf("?");
  const h = raw.indexOf("#");
  const end = h === -1 ? raw.length : h;
  if (q === -1 || q > end) return { pathname: raw.slice(0, end), search: "" };
  return { pathname: raw.slice(0, q), search: raw.slice(q, end) };
}

/** null = the whole batch is dropped (it starts on a page that is never collected). */
export function normaliseBatch(batch: Batch, ctx: IngestContext): NormalisedBatch | null {
  const { settings } = ctx;
  const skew = ctx.now - batch.now;
  let dropped = 0;

  /** Client time → server time; null when stale. */
  const at = (t: number): Date | null => {
    const fixed = t + skew;
    if (fixed < ctx.now - LIMITS.maxEventAgeMs) return null;
    return new Date(Math.min(fixed, ctx.now));
  };
  const pathOf = (raw: string) => {
    const { pathname, search } = splitUrl(raw);
    const path = normalisePath(stripStorePrefix(pathname, ctx.storeSlugInPath));
    return { path, search, scope: ctx.scopeOf(pathname), excluded: isExcludedPath(path, settings.excludedPaths) };
  };

  // ── Session ──────────────────────────────────────────────────────────────
  const landing = pathOf(batch.ss.lp);
  if (!landing.scope) return null;
  const sessionScope = landing.scope;
  // Click ids only steer the classification — their values are never stored.
  const { clickIds, ...utm } = readUtm(landing.search);
  const referrerHost = referrerHostOf(batch.ss.ref);
  const channel = classifyChannel({ ...utm, clickIds, referrerHost, ownHosts: ctx.ownHosts });
  const startedAt = at(batch.ss.ts) ?? new Date(ctx.now);
  const entryPath = landing.excluded ? "/(excluded)" : landing.path;
  const isOwnReferrer = referrerHost !== null && ctx.ownHosts.includes(referrerHost);

  const session: SessionRow = {
    id: batch.sid,
    visitorId: batch.vid,
    scope: sessionScope,
    storeId: ctx.storeId,
    startedAt,
    lastSeenAt: new Date(ctx.now),
    isReturning: batch.ss.ret,
    entryPath,
    exitPath: entryPath,
    channel,
    source: sourceLabel({ utmSource: utm.utmSource, referrerHost, ownHosts: ctx.ownHosts }).slice(0, 100),
    referrerHost: isOwnReferrer ? null : referrerHost,
    ...utm,
    device: ctx.ua.device,
    browser: ctx.ua.browser,
    os: ctx.ua.os,
    screen: batch.ss.sw && batch.ss.sh ? `${Math.round(batch.ss.sw)}x${Math.round(batch.ss.sh)}` : null,
    viewportW: Math.round(batch.ss.vw),
    viewportH: Math.round(batch.ss.vh),
    language: batch.ss.lang?.slice(0, 35).toLowerCase() ?? null,
    country: ctx.geo.country,
    region: ctx.geo.region,
    city: ctx.geo.city,
    userId: ctx.userId,
  };

  const pageviews: PageViewRow[] = [];
  const updates: PageUpdateRow[] = [];
  const events: EventRow[] = [];

  for (const item of batch.e) {
    if (item.k === "pv") {
      const startedAt = at(item.t);
      const { path, search, scope, excluded } = pathOf(item.p);
      if (!startedAt || excluded || !scope) {
        dropped += 1;
        continue;
      }
      const isApp = scope === "APP";
      pageviews.push({
        id: item.id,
        sessionId: batch.sid,
        visitorId: batch.vid,
        scope,
        storeId: ctx.storeId,
        path,
        // Dashboard titles can name a customer or an order — not kept.
        title: isApp ? null : cleanText(item.ti, LIMITS.maxTitle),
        query: sanitiseQuery(search, settings.excludedQueryParams),
        prevPath: item.pp ? pathOf(item.pp).path : null,
        seq: item.q,
        startedAt,
        docHeight: int(item.dh),
        viewportW: Math.round(item.vw),
        viewportH: int(item.vh),
        device: ctx.ua.device,
      });
      continue;
    }

    if (item.k === "pu") {
      updates.push({
        id: item.id,
        engagedMs: item.em,
        scrollPct: settings.trackScroll ? item.sp : 0,
        docHeight: int(item.dh),
      });
      continue;
    }

    // ── Events ─────────────────────────────────────────────────────────────
    const ts = at(item.t);
    const name = item.n;
    const page = item.p ? pathOf(item.p) : null;
    const scope = page ? page.scope : sessionScope;
    const isApp = scope === "APP";
    const known = name in KNOWN_EVENTS;
    const allowed =
      ts !== null &&
      scope !== null &&
      !page?.excluded &&
      !SERVER_ONLY_EVENTS.has(name) &&
      (name !== "click" || (settings.trackClicks && (!isApp || settings.heatmapPrivatePages))) &&
      (!FORM_EVENTS.has(name) || settings.trackForms) &&
      (!ERROR_EVENTS.has(name) || settings.trackErrors) &&
      (name !== "web_vital" || settings.trackVitals) &&
      (known || settings.trackCustomEvents);
    if (!allowed) {
      dropped += 1;
      continue;
    }

    let props: EventRow["props"] = null;
    if (item.pr) {
      props = {};
      for (const [key, value] of Object.entries(item.pr)) {
        if (value === null) continue;
        if (isApp && TEXT_PROPS.has(key)) continue;
        if (typeof value === "string") {
          const clean = cleanText(value, LIMITS.maxPropString);
          if (clean) props[key] = clean;
        } else {
          props[key] = value;
        }
      }
      if (!Object.keys(props).length) props = null;
    }

    const withGeometry = name === "click" && settings.heatmapsEnabled && (!isApp || settings.heatmapPrivatePages);
    events.push({
      id: item.id,
      sessionId: batch.sid,
      visitorId: batch.vid,
      scope: scope!,
      storeId: ctx.storeId,
      name,
      path: page?.path ?? null,
      ts: ts!,
      device: ctx.ua.device,
      x: withGeometry ? round(item.x) : null,
      y: withGeometry ? int(item.y) : null,
      vw: int(item.vw),
      dh: withGeometry ? int(item.dh) : null,
      sel: item.sel ? item.sel.slice(0, LIMITS.maxSelector) : null,
      ex: withGeometry ? round(item.ex) : null,
      ey: withGeometry ? round(item.ey) : null,
      value: item.v === undefined ? null : Math.max(-1e9, Math.min(1e9, item.v)),
      props,
    });
  }

  return { session, pageviews, updates, events, dropped };
}

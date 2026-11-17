/**
 * Casho Analytics — the browser SDK. Loaded lazily (after the page is idle)
 * by components/analytics/CashoAnalytics.tsx; no dependencies.
 *
 * What it collects: page views (path, title, viewport), engaged time and
 * scroll depth per page, clicks (element selector + position, for heatmaps),
 * CTA clicks, form start/submit (never values), JS errors, failed requests,
 * Core Web Vitals, add-to-cart on storefronts, and custom `track()` events.
 *
 * What it never collects: field values, keystrokes (key events only mark the
 * page as "in use"), passwords, payment details, IP addresses (the server
 * doesn't store them either), or any fingerprint. Ids are random and live in
 * a first-party cookie; storefronts get their own per-store ids.
 *
 * It does nothing inside iframes (Studio preview, heatmap viewer), for
 * automated browsers, for Casho staff, under Do Not Track / GPC (when the
 * admin honours it), and — when consent is required — until the visitor
 * agrees.
 */
import type { PublicAnalyticsConfig } from "../settings";
import { selectorOf } from "./selector";
import {
  COLLECT_PATH,
  COOKIE_CONSENT_MAIN,
  COOKIE_CONSENT_STORE_PREFIX,
  COOKIE_MAIN,
  COOKIE_STORE_PREFIX,
  COOKIE_TEAM,
  INTERNAL_PATH_PREFIXES,
  PAYLOAD_VERSION,
  hasPathPrefix,
  storeCookieKey,
  type ScopeCode,
} from "../constants";

export type InitOptions = { scope: ScopeCode; storeId?: string; cookieDomain?: string };
export type VitalMetric = { name: string; value: number; rating?: string; navigationType?: string };
type Props = Record<string, string | number | boolean>;

type Item =
  | { k: "pv"; id: string; t: number; p: string; ti?: string; pp?: string; q: number; vw: number; vh: number; dh?: number }
  | { k: "pu"; id: string; em: number; sp: number; dh?: number }
  | {
      k: "ev";
      id: string;
      t: number;
      n: string;
      p?: string;
      x?: number;
      y?: number;
      vw?: number;
      dh?: number;
      sel?: string;
      ex?: number;
      ey?: number;
      v?: number;
      pr?: Props;
    };

type PageState = {
  id: string;
  path: string;
  full: string;
  em: number;
  tick: number;
  sp: number;
  sentEm: number;
  sentSp: number;
  errors: Set<string>;
  errorCount: number;
  requestCount: number;
  forms: Set<string>;
};

type State = {
  opts: InitOptions;
  cfg: PublicAnalyticsConfig;
  vid: string;
  sid: string;
  seq: number;
  last: number;
  started: number;
  returning: boolean;
  sampled: boolean;
  landing: string;
  referrer: string;
  noVisit: boolean;
  queue: Item[];
  page: PageState | null;
  prevPath: string | null;
  stopped: boolean;
  flushTimer: number | null;
  lastInput: number;
};

const CONFIG_TTL_MS = 5 * 60_000;
const MAX_BATCH = 40;
const ENGAGE_IDLE_MS = 2 * 60_000;
const HEARTBEAT_MS = 60_000;
const VISITOR_MAX_AGE_S = 395 * 24 * 60 * 60;
const INTERACTIVE =
  'a[href],button,input,select,textarea,label,summary,[role="button"],[role="link"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="switch"],[role="option"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
const TEXTUAL = /^(a|button|summary|label|h[1-6]|li|span|p|strong|b|img)$/;

let state: State | null = null;
let initCalled = false;
const preInit: Array<() => void> = [];

// ─── Small helpers ─────────────────────────────────────────────────────────

function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function readCookie(name: string): string | null {
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (part.slice(0, eq) === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeS: number, domain?: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const dom = domain ? `; Domain=${domain}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeS}; SameSite=Lax${secure}${dom}`;
}

function docHeight() {
  const d = document.documentElement;
  return Math.max(d.scrollHeight, document.body ? document.body.scrollHeight : 0, innerHeight);
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : Math.round(n * 10000) / 10000);

function maskText(text: string) {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/\+?\d[\d\s-]{4,}\d/g, "[n]");
}

/** Own-site links → path with ids blanked; other sites → host only; mailto/tel → just the scheme. */
function urlLabel(raw: string): string | null {
  if (/^(mailto|tel|sms|whatsapp):/i.test(raw)) return raw.split(":")[0].toLowerCase();
  try {
    const u = new URL(raw, location.href);
    if (u.host !== location.host) return u.host;
    return u.pathname
      .split("/")
      .map((seg) => (/^[0-9a-f-]{16,}$/i.test(seg) || /^\d{5,}$/.test(seg) || /^(?=.*\d)[A-Za-z0-9_]{20,}$/.test(seg) ? ":id" : seg))
      .join("/");
  } catch {
    return null;
  }
}

function dntOn() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  return nav.doNotTrack === "1" || win.doNotTrack === "1" || nav.msDoNotTrack === "1" || nav.globalPrivacyControl === true;
}

function cookieNames(opts: InitOptions) {
  if (opts.scope === "s" && opts.storeId) {
    const key = storeCookieKey(opts.storeId);
    return { ids: `${COOKIE_STORE_PREFIX}${key}`, consent: `${COOKIE_CONSENT_STORE_PREFIX}${key}`, domain: undefined };
  }
  return { ids: COOKIE_MAIN, consent: COOKIE_CONSENT_MAIN, domain: opts.cookieDomain };
}

/** Pages on the app host that are never collected, whatever the scope. */
function isInternalPage(path: string, scope: ScopeCode) {
  return scope !== "s" && /^app\./.test(location.hostname) && hasPathPrefix(path, INTERNAL_PATH_PREFIXES);
}

// ─── Config ────────────────────────────────────────────────────────────────

async function loadConfig(scope: ScopeCode): Promise<PublicAnalyticsConfig | null> {
  const key = `_ca_cfg_${scope}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || "null") as { at: number; cfg: PublicAnalyticsConfig } | null;
    if (cached && Date.now() - cached.at < CONFIG_TTL_MS) return cached.cfg;
  } catch {
    // storage blocked — fetch every time
  }
  try {
    const res = await fetch(`${COLLECT_PATH}?s=${scope}`, { credentials: "same-origin" });
    if (!res.ok) return null;
    const cfg = (await res.json()) as PublicAnalyticsConfig;
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), cfg }));
    } catch {
      // ignore
    }
    return cfg;
  } catch {
    return null;
  }
}

// ─── Session ───────────────────────────────────────────────────────────────

function saveIds(s: State) {
  const { ids, domain } = cookieNames(s.opts);
  const value = [s.vid, s.sid, s.last.toString(36), s.seq.toString(36), s.started.toString(36), s.sampled ? "1" : "0"].join(".");
  writeCookie(ids, value, VISITOR_MAX_AGE_S, domain);
}

function rollSample(cfg: PublicAnalyticsConfig) {
  return cfg.hm > 0 && Math.random() * 100 < cfg.hm;
}

function newSession(s: State, now: number, landing: string, referrer: string) {
  s.sid = randomId();
  s.seq = 0;
  s.started = now;
  s.last = now;
  s.landing = landing;
  s.referrer = referrer;
  s.sampled = rollSample(s.cfg);
  s.prevPath = null;
}

/** A gap longer than the timeout starts a new session (queued items of the old one go first). */
function touch(s: State) {
  const now = Date.now();
  if (now - s.last > s.cfg.to * 60_000) {
    flush(false);
    s.returning = true;
    newSession(s, now, location.pathname + location.search, "");
    if (s.page) {
      // The open page becomes the first page of the new session.
      s.page.id = randomId();
      s.seq = 1;
      s.page.sentEm = 0;
      s.page.em = 0;
      enqueue({ k: "pv", id: s.page.id, t: now, p: s.page.full, q: 1, vw: innerWidth, vh: innerHeight, dh: docHeight() });
    }
  }
  s.last = now;
}

// ─── Queue & transport ─────────────────────────────────────────────────────

function enqueue(item: Item) {
  const s = state;
  if (!s || s.stopped) return;
  s.queue.push(item);
  if (s.queue.length >= 20) flush(false);
  else schedule(item.k === "pv" ? 800 : 8_000);
}

function schedule(ms: number) {
  const s = state;
  if (!s || s.flushTimer !== null) return;
  s.flushTimer = window.setTimeout(() => {
    s.flushTimer = null;
    flush(false);
  }, ms);
}

function stopTracking() {
  const s = state;
  if (!s) return;
  s.stopped = true;
  s.queue = [];
}

function flush(beacon: boolean) {
  const s = state;
  if (!s || s.stopped || !s.queue.length) return;
  if (s.flushTimer !== null) {
    clearTimeout(s.flushTimer);
    s.flushTimer = null;
  }
  saveIds(s);
  while (s.queue.length) {
    const items = s.queue.splice(0, MAX_BATCH);
    const body = JSON.stringify({
      v: PAYLOAD_VERSION,
      now: Date.now(),
      sc: s.opts.scope,
      ...(s.opts.scope === "s" && { st: s.opts.storeId }),
      vid: s.vid,
      sid: s.sid,
      ...(s.noVisit && { nv: true }),
      ss: {
        ts: s.started,
        ret: s.returning,
        ...(s.referrer && { ref: s.referrer.slice(0, 2000) }),
        lp: s.landing.slice(0, 2000),
        vw: innerWidth,
        vh: innerHeight,
        sw: screen.width,
        sh: screen.height,
        lang: (navigator.language || "").slice(0, 35),
        tch: Math.min(20, navigator.maxTouchPoints || 0),
      },
      e: items,
    });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(COLLECT_PATH, new Blob([body], { type: "text/plain" }));
    } else {
      fetch(COLLECT_PATH, {
        method: "POST",
        body,
        keepalive: body.length < 60_000,
        credentials: "same-origin",
        headers: { "content-type": "text/plain" },
      })
        .then((res) => (res.status === 200 ? res.json() : null))
        .then((json: { stop?: boolean } | null) => {
          if (json?.stop) stopTracking();
        })
        .catch(() => {});
    }
  }
}

// ─── Pages ─────────────────────────────────────────────────────────────────

function pageUpdate(s: State, force: boolean) {
  const p = s.page;
  if (!p) return;
  tickEngagement(s);
  if (!force && p.em === p.sentEm && p.sp === p.sentSp) return;
  p.sentEm = p.em;
  p.sentSp = p.sp;
  enqueue({ k: "pu", id: p.id, em: Math.round(p.em), sp: Math.round(p.sp), dh: docHeight() });
}

function measureScroll(s: State) {
  const p = s.page;
  if (!p || !s.cfg.f.s) return;
  const depth = Math.min(100, ((scrollY + innerHeight) / docHeight()) * 100);
  if (depth > p.sp) p.sp = depth;
}

/** Called on load and on every client-side route change. */
export function page() {
  const s = state;
  if (!s || s.stopped) return;
  const path = location.pathname;
  const full = path + location.search;
  if (s.page && s.page.full === full) return;

  // Close the previous page.
  if (s.page) {
    pageUpdate(s, false);
    s.prevPath = s.page.path;
    s.page = null;
  }

  if (isInternalPage(path, s.opts.scope) || hasPathPrefix(path, s.cfg.ex)) {
    s.page = null;
    return;
  }

  touch(s);
  const now = Date.now();
  s.seq += 1;
  s.page = {
    id: randomId(),
    path,
    full,
    em: 0,
    tick: now,
    sp: 0,
    sentEm: 0,
    sentSp: 0,
    errors: new Set(),
    errorCount: 0,
    requestCount: 0,
    forms: new Set(),
  };
  enqueue({
    k: "pv",
    id: s.page.id,
    t: now,
    p: full.slice(0, 2000),
    // Dashboard titles can name a customer — the server drops them too.
    ...(s.opts.scope !== "a" && document.title && { ti: document.title.slice(0, 120) }),
    ...(s.prevPath && { pp: s.prevPath }),
    q: s.seq,
    vw: innerWidth,
    vh: innerHeight,
  });
  if (s.opts.scope === "s" && /(^|\/)checkout(\/|$)/.test(path)) event("checkout_started");
  // Above-the-fold depth once the new page has laid out.
  window.setTimeout(() => measureScroll(s), 600);
}

function tickEngagement(s: State) {
  const p = s.page;
  if (!p) return;
  const now = Date.now();
  const focused = document.visibilityState === "visible" && (typeof document.hasFocus !== "function" || document.hasFocus());
  if (focused && now - s.lastInput < ENGAGE_IDLE_MS) p.em += Math.min(now - p.tick, 2_000);
  p.tick = now;
}

// ─── Events ────────────────────────────────────────────────────────────────

function event(name: string, extra: Omit<Extract<Item, { k: "ev" }>, "k" | "id" | "t" | "n"> = {}) {
  const s = state;
  if (!s || s.stopped) return;
  touch(s);
  enqueue({ k: "ev", id: randomId(), t: Date.now(), n: name, p: s.page?.path ?? location.pathname, ...extra });
}

/** Custom events from app code: `track("pricing_toggle", { cycle: "yearly" })`. */
export function track(name: string, props?: Record<string, unknown>) {
  if (!state) {
    if (preInit.length < 50) preInit.push(() => track(name, props));
    return;
  }
  if (!state.cfg.f.cu && !/^(add_to_cart|cta_clicked)$/.test(name)) return;
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(name)) return;
  const pr: Props = {};
  let count = 0;
  for (const [key, value] of Object.entries(props ?? {})) {
    if (count >= 12 || !/^[a-z][a-z0-9_]{0,31}$/.test(key)) continue;
    if (typeof value === "string") pr[key] = maskText(value).slice(0, 120);
    else if (typeof value === "number" && Number.isFinite(value)) pr[key] = value;
    else if (typeof value === "boolean") pr[key] = value;
    else continue;
    count += 1;
  }
  event(name, count ? { pr } : {});
}

/** Core Web Vitals from next/web-vitals. */
export function vital(metric: VitalMetric) {
  if (!state) {
    if (preInit.length < 50) preInit.push(() => vital(metric));
    return;
  }
  if (!state.cfg.f.vi || !/^(LCP|INP|CLS|FCP|TTFB)$/.test(metric.name)) return;
  const value = metric.name === "CLS" ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value);
  event("web_vital", { v: value, pr: { metric: metric.name, ...(metric.rating && { rating: metric.rating }) } });
}

// ─── Clicks (heatmaps, CTAs, dead and rage clicks) ─────────────────────────

function describe(s: State, el: Element, link: HTMLAnchorElement | null): Props {
  const tag = el.tagName.toLowerCase();
  const pr: Props = { tag };
  const field = /^(input|select|textarea|option)$/.test(tag);
  if (field) {
    // Fields: what kind of control, never its value or name.
    const type = (el as HTMLInputElement).type;
    if (type) pr.type = type.slice(0, 20);
    return pr;
  }
  if (s.opts.scope !== "a") {
    const text = el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("alt") || (TEXTUAL.test(tag) ? el.textContent : "") || "";
    const label = maskText(text.replace(/\s+/g, " ").trim()).slice(0, 60);
    if (label) pr.label = label;
  }
  if (link) {
    const href = urlLabel(link.getAttribute("href") || "");
    if (href) pr.href = href.slice(0, 120);
  }
  const aid = el.closest("[data-analytics-id]")?.getAttribute("data-analytics-id");
  if (aid) pr.aid = aid.slice(0, 60);
  return pr;
}

function ctaOf(s: State, el: Element, link: HTMLAnchorElement | null): string | null {
  const tagged = el.closest("[data-cta]")?.getAttribute("data-cta");
  if (tagged) return tagged.slice(0, 40);
  if (!link || s.opts.scope === "a") return null;
  try {
    const url = new URL(link.href, location.href);
    if (/^\/register(\/|$)/.test(url.pathname)) return "signup";
    if (/^\/login(\/|$)/.test(url.pathname)) return "login";
    if (s.opts.scope === "s" && /(^|\/)checkout(\/|$)/.test(url.pathname)) return "checkout";
    if (/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)$/.test(url.hostname)) return "whatsapp";
  } catch {
    return null;
  }
  return null;
}

const recentClicks: { t: number; x: number; y: number }[] = [];
let watchingDead = false;

function onClick(e: MouseEvent) {
  const s = state;
  if (!s || s.stopped || !s.page) return;
  const target = e.target instanceof Element ? e.target : null;
  if (!target || target.closest("[data-ca-consent]")) return;
  s.lastInput = Date.now();

  const interactive = target.closest(INTERACTIVE);
  const el = interactive || target;
  const link = target.closest("a[href]") as HTMLAnchorElement | null;

  const cta = ctaOf(s, el, link);
  if (cta) {
    const pr: Props = { cta };
    const label = describe(s, el, link).label;
    if (label) pr.label = label;
    event("cta_clicked", { pr });
  }
  if (!s.cfg.ck) {
    if (link) {
      pageUpdate(s, false);
      flush(true);
    }
    return;
  }

  const pr = describe(s, el, link);
  const item: Omit<Extract<Item, { k: "ev" }>, "k" | "id" | "t" | "n"> = { sel: selectorOf(el), vw: innerWidth, pr };

  // Pointer clicks only (a keyboard "click" has no position).
  const pointer = e.detail > 0 && (e.clientX !== 0 || e.clientY !== 0);
  if (pointer && s.sampled) {
    const rect = el.getBoundingClientRect();
    const width = Math.max(document.documentElement.scrollWidth, innerWidth);
    item.x = clamp01(e.pageX / width);
    item.y = Math.max(0, Math.round(e.pageY));
    item.dh = docHeight();
    item.ex = rect.width ? clamp01((e.clientX - rect.left) / rect.width) : 0.5;
    item.ey = rect.height ? clamp01((e.clientY - rect.top) / rect.height) : 0.5;
  }

  if (pointer) {
    const now = Date.now();
    while (recentClicks.length && now - recentClicks[0].t > 1_000) recentClicks.shift();
    const near = recentClicks.filter((c) => Math.abs(c.x - e.clientX) < 30 && Math.abs(c.y - e.clientY) < 30).length;
    recentClicks.push({ t: now, x: e.clientX, y: e.clientY });
    if (near >= 2) pr.rage = true;
  }

  if (interactive || watchingDead || !document.body) {
    event("click", item);
    // A link may unload the page (another host, a full reload) before the next
    // timer — send now, with this page's running totals, by beacon (survives unload).
    if (link) {
      pageUpdate(s, false);
      flush(true);
    }
    return;
  }
  // Dead click: nothing on the page reacted within a second (no DOM change, no navigation).
  watchingDead = true;
  const before = location.href;
  let changed = false;
  const observer = new MutationObserver(() => {
    changed = true;
  });
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  window.setTimeout(() => {
    observer.disconnect();
    watchingDead = false;
    if (!changed && location.href === before) pr.dead = true;
    event("click", item);
  }, 1_000);
}

// ─── Forms (structure only — never values) ─────────────────────────────────

function formKey(form: Element) {
  const aid = form.getAttribute("data-analytics-id");
  if (aid) return aid.slice(0, 60);
  if (form.id && /^[A-Za-z][\w-]{0,50}$/.test(form.id)) return form.id;
  const name = form.getAttribute("name") || form.getAttribute("aria-label");
  if (name) return maskText(name).slice(0, 60);
  const action = form.getAttribute("action");
  if (action && action.startsWith("/")) return action.split("?")[0].slice(0, 60);
  return selectorOf(form);
}

function onFocusIn(e: FocusEvent) {
  const s = state;
  if (!s || !s.page || !s.cfg.f.fo) return;
  const target = e.target instanceof Element ? e.target : null;
  if (!target || !target.matches("input,select,textarea") || target.closest("[data-ca-consent]")) return;
  const form = target.closest("form");
  const key = formKey(form || target);
  if (s.page.forms.has(key)) return;
  s.page.forms.add(key);
  event("form_started", { pr: { form: key } });
}

function onSubmit(e: Event) {
  const s = state;
  if (!s || !s.page || !s.cfg.f.fo) return;
  const form = e.target instanceof HTMLFormElement ? e.target : null;
  if (!form) return;
  event("form_submitted", { pr: { form: formKey(form) } });
  flush(false);
}

// ─── Errors & failed requests ──────────────────────────────────────────────

function sourceOf(file: string | undefined) {
  if (!file) return undefined;
  try {
    const u = new URL(file, location.href);
    return (u.host === location.host ? u.pathname : u.host).slice(0, 120);
  } catch {
    return undefined;
  }
}

function reportError(message: string, extra: Props) {
  const s = state;
  if (!s || !s.page || !s.cfg.f.er) return;
  const clean = maskText(message.replace(/\s+/g, " ").trim()).slice(0, 200);
  if (!clean || clean === "Script error." || /ResizeObserver loop/.test(clean)) return;
  if (s.page.errors.has(clean) || s.page.errorCount >= 5) return;
  s.page.errors.add(clean);
  s.page.errorCount += 1;
  event("js_error", { pr: { message: clean, ...extra } });
}

function onError(e: ErrorEvent | Event) {
  const s = state;
  if (!s || !s.page || !s.cfg.f.er) return;
  const target = e.target;
  if (target && target !== window && target instanceof Element) {
    if (s.page.requestCount >= 10) return;
    const src = (target as HTMLImageElement).src || (target as HTMLLinkElement).href || "";
    const url = src ? urlLabel(src) : null;
    s.page.requestCount += 1;
    event("resource_error", { pr: { tag: target.tagName.toLowerCase(), ...(url && { url: url.slice(0, 120) }) } });
    return;
  }
  const err = e as ErrorEvent;
  const source = sourceOf(err.filename);
  reportError(err.message || "Error", {
    kind: "error",
    ...(source && { source }),
    ...(err.lineno && { line: err.lineno }),
    ...(err.colno && { col: err.colno }),
  });
}

function onRejection(e: PromiseRejectionEvent) {
  const reason = e.reason;
  const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled rejection";
  reportError(message, { kind: "rejection" });
}

function watchRequests() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    new PerformanceObserver((list) => {
      const s = state;
      if (!s || !s.page || !s.cfg.f.er) return;
      for (const entry of list.getEntries() as (PerformanceResourceTiming & { responseStatus?: number })[]) {
        const status = entry.responseStatus;
        if (!status || status < 400 || entry.name.includes(COLLECT_PATH)) continue;
        if (s.page.requestCount >= 10) return;
        s.page.requestCount += 1;
        const url = urlLabel(entry.name);
        event("request_failed", { v: status, pr: { status, type: entry.initiatorType.slice(0, 20), ...(url && { url: url.slice(0, 120) }) } });
      }
    }).observe({ type: "resource", buffered: true });
  } catch {
    // responseStatus not supported here — nothing to observe
  }
}

// ─── Storefront cart ───────────────────────────────────────────────────────

function onCartUpdated(e: Event) {
  const detail = (e as CustomEvent<{ productId?: string; price?: number; quantity?: number } | undefined>).detail;
  if (!detail?.productId) return;
  const qty = Math.max(1, Math.round(detail.quantity ?? 1));
  // Value in piasters, like every amount Casho stores.
  event("add_to_cart", {
    v: Math.round((detail.price ?? 0) * qty * 100),
    pr: { product: String(detail.productId).slice(0, 40), qty },
  });
}

// ─── Consent prompt ────────────────────────────────────────────────────────

function askConsent(onDecide: (ok: boolean) => void) {
  const ar = (document.documentElement.lang || "ar").toLowerCase().startsWith("ar");
  const dark = matchMedia?.("(prefers-color-scheme: dark)").matches;
  const box = document.createElement("div");
  box.setAttribute("data-ca-consent", "");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", ar ? "إذن القياس" : "Analytics consent");
  box.dir = ar ? "rtl" : "ltr";
  box.style.cssText = [
    "position:fixed",
    "bottom:16px",
    "inset-inline-start:16px",
    "z-index:2147483000",
    "max-width:min(400px,calc(100vw - 32px))",
    "padding:16px",
    "border-radius:18px",
    `background:${dark ? "#1c1c1e" : "#ffffff"}`,
    `color:${dark ? "#f5f5f7" : "#1d1d1f"}`,
    "box-shadow:0 12px 40px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.08)",
    "font:14px/1.5 inherit",
    "font-family:inherit",
  ].join(";");
  const text = document.createElement("p");
  text.style.cssText = "margin:0 0 12px";
  text.textContent = ar
    ? "بنستخدم قياس داخلي مجهول الهوية (من غير إعلانات ولا مشاركة مع حد) عشان نحسّن الموقع. توافق؟"
    : "We use anonymous first-party measurement (no ads, never shared) to improve this site. Is that OK?";
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  const button = (label: string, primary: boolean, ok: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText = [
      "border:0",
      "cursor:pointer",
      "border-radius:999px",
      "padding:8px 16px",
      "font:inherit",
      "font-weight:600",
      primary ? "background:#0071e3;color:#fff" : `background:${dark ? "#3a3a3c" : "#f2f2f7"};color:inherit`,
    ].join(";");
    b.addEventListener("click", () => {
      box.remove();
      onDecide(ok);
    });
    return b;
  };
  row.append(button(ar ? "موافق" : "Accept", true, true), button(ar ? "لا، شكرًا" : "No thanks", false, false));
  box.append(text, row);
  document.body.appendChild(box);
}

// ─── Start ─────────────────────────────────────────────────────────────────

function pingVisit(storeId: string) {
  const key = `_cs_vc_${storeCookieKey(storeId)}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // no storage: still count it
  }
  fetch(COLLECT_PATH, {
    method: "POST",
    keepalive: true,
    credentials: "same-origin",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ v: PAYLOAD_VERSION, k: "visit", st: storeId }),
  }).catch(() => {});
}

function begin(opts: InitOptions, cfg: PublicAnalyticsConfig, noVisit: boolean) {
  const now = Date.now();
  const { ids } = cookieNames(opts);
  const saved = (readCookie(ids) || "").split(".");
  const known = saved.length >= 6 && /^[\w-]{16,40}$/.test(saved[0]) && /^[\w-]{16,40}$/.test(saved[1]);
  const last = known ? parseInt(saved[2], 36) : 0;
  const continuing = known && Number.isFinite(last) && now - last <= cfg.to * 60_000;

  const s: State = {
    opts,
    cfg,
    vid: known ? saved[0] : randomId(),
    sid: "",
    seq: 0,
    last: now,
    started: now,
    returning: known,
    sampled: false,
    landing: location.pathname + location.search,
    referrer: document.referrer,
    noVisit,
    queue: [],
    page: null,
    prevPath: null,
    stopped: false,
    flushTimer: null,
    lastInput: now,
  };
  if (continuing) {
    s.sid = saved[1];
    s.seq = parseInt(saved[3], 36) || 0;
    s.started = parseInt(saved[4], 36) || now;
    s.sampled = saved[5] === "1";
  } else {
    newSession(s, now, s.landing, document.referrer);
  }
  state = s;
  saveIds(s);

  const markInput = () => {
    s.lastInput = Date.now();
  };
  // Activity marks only: key events are never read, just timestamped.
  for (const type of ["pointerdown", "keydown", "touchstart", "wheel"]) addEventListener(type, markInput, { passive: true, capture: true });
  let moveAt = 0;
  addEventListener(
    "pointermove",
    () => {
      const t = Date.now();
      if (t - moveAt > 1_000) {
        moveAt = t;
        markInput();
      }
    },
    { passive: true },
  );
  let scrollQueued = false;
  addEventListener(
    "scroll",
    () => {
      markInput();
      if (scrollQueued) return;
      scrollQueued = true;
      window.setTimeout(() => {
        scrollQueued = false;
        measureScroll(s);
      }, 250);
    },
    { passive: true },
  );
  document.addEventListener("click", onClick, { capture: true, passive: true });
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("submit", onSubmit, true);
  addEventListener("error", onError, true);
  addEventListener("unhandledrejection", onRejection);
  if (opts.scope === "s") addEventListener("casho:cart-updated", onCartUpdated);
  watchRequests();

  const leave = () => {
    pageUpdate(s, false);
    flush(true);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
    else if (s.page) s.page.tick = Date.now();
  });
  addEventListener("pagehide", leave);
  // Some navigations (a redirect to another host) never deliver pagehide in time.
  addEventListener("beforeunload", leave);

  window.setInterval(() => tickEngagement(s), 1_000);
  window.setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - s.lastInput > ENGAGE_IDLE_MS) return;
    touch(s);
    pageUpdate(s, false);
    flush(false);
  }, HEARTBEAT_MS);

  (window as Window & { cashoAnalytics?: { track: typeof track } }).cashoAnalytics = { track };
  page();
  for (const run of preInit.splice(0)) run();
}

export async function init(opts: InitOptions) {
  if (initCalled) return;
  initCalled = true;
  if (window.self !== window.top || navigator.webdriver) return;
  const cfg = await loadConfig(opts.scope);
  if (!cfg) return;
  if (cfg.tm && readCookie(COOKIE_TEAM) === "1") return;

  const { consent, domain } = cookieNames(opts);
  const decided = readCookie(consent);
  const countOnly = () => {
    if (opts.scope === "s" && opts.storeId) pingVisit(opts.storeId);
  };

  if (!cfg.on || (cfg.dnt && dntOn()) || decided === "0") {
    countOnly();
    return;
  }
  if (cfg.ask && decided !== "1") {
    // The merchant's visit counter still ticks (no ids); full analytics only after a yes.
    countOnly();
    askConsent((ok) => {
      writeCookie(consent, ok ? "1" : "0", VISITOR_MAX_AGE_S, domain);
      if (ok) begin(opts, cfg, opts.scope === "s");
    });
    return;
  }
  begin(opts, cfg, false);
}

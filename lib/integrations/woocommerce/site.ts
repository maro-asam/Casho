/**
 * The merchant's WordPress site: URL normalization, outbound-request safety and
 * discovery (is it WordPress, is WooCommerce active, what is its home URL?).
 *
 * Every request to a merchant site goes through `safeFetch`, because the URL is
 * typed by a user and fetched from our servers (SSRF): https only, no IP
 * literals or internal names, every DNS answer must be a public address, and
 * redirects are followed by hand so each hop is checked again.
 */
import dns from "node:dns/promises";
import net from "node:net";
import { SourceApiError } from "@/lib/integrations/import/errors";
import { decodeEntities } from "@/lib/integrations/import/normalize";

export const USER_AGENT = "CashoImporter/1.0 (+https://casho.store)";
const DISCOVERY_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export type SiteErrorCode =
  | "invalid_site"
  | "unreachable"
  | "not_wordpress"
  | "no_woocommerce"
  | "plain_permalinks"
  | "rest_blocked";

/** Discovery failure with a code the connect page turns into an Arabic message. */
export class SiteError extends Error {
  constructor(readonly code: SiteErrorCode) {
    super(`WooCommerce site check failed: ${code}`);
    this.name = "SiteError";
  }
}

export type LookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

const defaultLookup: LookupFn = (hostname) => dns.lookup(hostname, { all: true, verbatim: true });

// ─── URLs ────────────────────────────────────────────────────────────────────

/** Path segments that are never part of a WordPress install path. */
const WP_MARKERS = new Set([
  "wp-admin",
  "wp-json",
  "wp-login.php",
  "wp-content",
  "wp-includes",
  "index.php",
  "product",
  "product-category",
  "product-tag",
  "cart",
  "checkout",
  "my-account",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".arpa", ".test", ".invalid", ".example", ".corp", ".intranet"];

/** No IP literals, single-label names or reserved / internal TLDs. */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host.startsWith("[") || net.isIP(host) !== 0) return true;
  if (!host.includes(".") || host === "localhost") return true;
  return BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * What merchants paste — "mystore.com", "http://mystore.com/wp-admin/…",
 * "https://www.mystore.com/shop/" — becomes "https://www.mystore.com/shop".
 * Always https (WooCommerce only accepts key auth over SSL). Null when it
 * can't be a public site.
 */
export function normalizeSiteUrl(input: string): string | null {
  let value = input.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  value = value.replace(/^http:\/\//i, "https://");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  if (isBlockedHostname(url.hostname)) return null;

  const segments: string[] = [];
  for (const segment of url.pathname.split("/").filter(Boolean)) {
    if (WP_MARKERS.has(segment.toLowerCase())) break;
    segments.push(segment);
  }
  const path = segments.length ? `/${segments.join("/")}` : "";
  return `https://${url.hostname.toLowerCase()}${path}`;
}

/** "https://www.mystore.com/shop" → "www.mystore.com/shop" (stable shop id + display). */
export function siteKey(home: string): string {
  return home.replace(/^https:\/\//, "");
}

/** Inverse of siteKey. */
export function homeFromKey(key: string): string {
  return `https://${key}`;
}

// ─── Address safety ──────────────────────────────────────────────────────────

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

/** Loopback, private, link-local, CGNAT, documentation, multicast or reserved. */
export function isPrivateAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const n = ipv4ToInt(ip);
    return PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (version === 6) {
    const g = expandIpv6(ip);
    if (!g) return true;
    const embeddedV4 = () => `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
    const zeroUpTo = (end: number) => g.slice(0, end).every((x) => x === 0);
    if (zeroUpTo(8)) return true; // ::
    if (zeroUpTo(7) && g[7] === 1) return true; // ::1
    if (zeroUpTo(5) && g[5] === 0xffff) return isPrivateAddress(embeddedV4()); // ::ffff:a.b.c.d
    if (zeroUpTo(6)) return isPrivateAddress(embeddedV4()); // ::a.b.c.d (deprecated)
    if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPrivateAddress(embeddedV4()); // NAT64
    if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
    if ((g[0] & 0xff00) === 0xff00) return true; // multicast
    if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
    return false;
  }
  return true;
}

/** "2001:db8::1" / "::ffff:1.2.3.4" → eight 16-bit groups, or null. */
function expandIpv6(ip: string): number[] | null {
  let value = ip.toLowerCase().split("%")[0];
  const v4 = value.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    value = `${value.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...tail].map((h) => parseInt(h, 16));
  return groups.length === 8 && groups.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff) ? groups : null;
}

/** Throws SiteError unless every address the name resolves to is public. */
export async function assertPublicHost(hostname: string, lookup: LookupFn = defaultLookup) {
  if (isBlockedHostname(hostname)) throw new SiteError("invalid_site");
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname);
  } catch {
    throw new SiteError("unreachable");
  }
  if (addresses.length === 0) throw new SiteError("unreachable");
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new SiteError("invalid_site");
}

export type SafeFetchOptions = {
  fetchImpl?: typeof fetch;
  lookup?: LookupFn;
  /** Requests that carry credentials may only be redirected within the same origin. */
  sameOriginOnly?: boolean;
  timeoutMs?: number;
};

/**
 * fetch() for merchant-supplied URLs. Each hop is https, resolves to public
 * addresses only, and redirects are re-checked. Network failures surface as
 * the fetch error; unsafe targets as SiteError.
 */
export async function safeFetch(input: string, init: RequestInit = {}, opts: SafeFetchOptions = {}): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const checked = new Set<string>();
  let url = new URL(input);
  const origin = url.origin;

  for (let hop = 0; ; hop++) {
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
      throw new SiteError("invalid_site");
    }
    if (!checked.has(url.hostname)) {
      await assertPublicHost(url.hostname, opts.lookup);
      checked.add(url.hostname);
    }

    const res = await fetchImpl(url.toString(), {
      ...init,
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, ...(init.headers as Record<string, string> | undefined) },
      signal: init.signal ?? AbortSignal.timeout(opts.timeoutMs ?? DISCOVERY_TIMEOUT_MS),
    });

    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return res;
    if (hop >= MAX_REDIRECTS) throw new SourceApiError("client", `too many redirects (${res.status})`, res.status);

    const next = new URL(location, url);
    if (opts.sameOriginOnly && next.origin !== origin) {
      throw new SourceApiError("client", `redirected to another origin (${res.status})`, res.status);
    }
    url = next;
  }
}

// ─── JSON from WordPress ─────────────────────────────────────────────────────

/**
 * Parses a WordPress JSON response. Badly configured sites print PHP notices
 * or a BOM before the JSON, so the first top-level value is located when the
 * whole body isn't valid JSON.
 */
export function parseWordPressJson(text: string): unknown {
  const body = text.replace(/^﻿/, "").trim();
  try {
    return JSON.parse(body);
  } catch {
    // fall through
  }
  for (const marker of ["\n{", "\n[", "{\"", "[{", "[]"]) {
    const at = body.indexOf(marker);
    if (at < 0) continue;
    try {
      return JSON.parse(body.slice(marker.startsWith("\n") ? at + 1 : at));
    } catch {
      // try the next marker
    }
  }
  throw new SyntaxError("not JSON");
}

// ─── Discovery ───────────────────────────────────────────────────────────────

export type SiteInfo = {
  /** Canonical home URL, https, no trailing slash — REST + wc-auth live under it. */
  home: string;
  name: string;
};

type RestIndex = { name?: unknown; home?: unknown; url?: unknown; namespaces?: unknown };

/** The full URL first, then its site root (WordPress can live in a sub folder). */
function candidatesFor(url: string): string[] {
  const root = new URL(url).origin;
  return url === root ? [url] : [url, root];
}

type Probe =
  | { kind: "index"; index: RestIndex }
  | { kind: "plain" }
  | { kind: "blocked" }
  | { kind: "unreachable" }
  | { kind: "missing" };

async function readIndex(res: Response): Promise<RestIndex | null> {
  if (!res.ok) return null;
  try {
    const json = parseWordPressJson(await res.text());
    return json && typeof json === "object" && Array.isArray((json as RestIndex).namespaces) ? (json as RestIndex) : null;
  } catch {
    return null;
  }
}

function looksBlocked(res: Response) {
  return res.headers.has("cf-mitigated") || [401, 403, 406, 429, 503].includes(res.status);
}

async function probe(base: string, opts: SafeFetchOptions): Promise<Probe> {
  const get = (url: string) => safeFetch(url, { headers: { Accept: "application/json" } }, opts);
  let pretty: Response;
  try {
    pretty = await get(`${base}/wp-json/`);
  } catch (err) {
    if (err instanceof SiteError && err.code === "invalid_site") throw err;
    return { kind: "unreachable" };
  }
  const index = await readIndex(pretty);
  if (index) return { kind: "index", index };
  const blocked = looksBlocked(pretty);

  // Plain permalinks: the REST API only answers on ?rest_route=, and
  // WooCommerce key auth doesn't work there.
  try {
    const plain = await get(`${base}/?rest_route=/`);
    if (await readIndex(plain)) return { kind: "plain" };
    if (blocked || looksBlocked(plain)) return { kind: "blocked" };
  } catch {
    if (blocked) return { kind: "blocked" };
  }
  return { kind: "missing" };
}

/** Finds the WordPress install behind what the merchant typed and checks WooCommerce is active. */
export async function discoverSite(input: string, opts: SafeFetchOptions = {}): Promise<SiteInfo> {
  const url = normalizeSiteUrl(input);
  if (!url) throw new SiteError("invalid_site");

  let failure: SiteErrorCode = "not_wordpress";
  for (const candidate of candidatesFor(url)) {
    const result = await probe(candidate, opts);
    if (result.kind === "plain") throw new SiteError("plain_permalinks");
    // Every candidate is on the same host: if it doesn't answer, none will.
    if (result.kind === "unreachable") throw new SiteError(failure === "rest_blocked" ? failure : "unreachable");
    if (result.kind === "blocked") failure = "rest_blocked";
    if (result.kind !== "index") continue;

    const namespaces = result.index.namespaces as unknown[];
    if (!namespaces.includes("wc/v3")) throw new SiteError("no_woocommerce");

    // WordPress knows its canonical home (e.g. www. vs bare domain); REST and
    // the key-approval screen both live under it. Keep the candidate if the
    // declared home doesn't answer.
    let home = candidate;
    const declared = typeof result.index.home === "string" ? normalizeSiteUrl(result.index.home) : null;
    if (declared && declared !== candidate) {
      const check = await probe(declared, opts).catch(() => null);
      if (check?.kind === "index") home = declared;
    }

    const rawName = typeof result.index.name === "string" ? decodeEntities(result.index.name).trim() : "";
    return { home, name: rawName.slice(0, 120) || siteKey(home) };
  }
  throw new SiteError(failure);
}

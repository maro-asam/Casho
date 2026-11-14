/**
 * Minimal WooCommerce REST v3 client built for long-running imports.
 *
 *  - Auth: consumer key/secret as query parameters over HTTPS — WooCommerce's
 *    documented fallback for hosts that strip the Authorization header, so it
 *    works on any server. The URL is therefore secret: it is never logged or
 *    put in an error message.
 *  - Every request goes through safeFetch (public https hosts only, redirects
 *    only within the same origin so the key never travels elsewhere).
 *  - 401 / WooCommerce permission errors → "unauthorized" (engine pauses, asks
 *    to reconnect). Firewalls and security plugins → "blocked". 429 honours
 *    Retry-After; 5xx, network errors and garbled bodies retry with backoff.
 */
import { SourceApiError } from "@/lib/integrations/import/errors";
import { parseWordPressJson, safeFetch, SiteError, type LookupFn } from "./site";

export type WooClientOptions = {
  /** Canonical https home URL of the site. */
  home: string;
  consumerKey: string;
  consumerSecret: string;
  fetchImpl?: typeof fetch;
  lookup?: LookupFn;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  maxThrottleRetries?: number;
  timeoutMs?: number;
};

export type WooResponse<T> = { data: T; total: number | null; totalPages: number | null };

type Params = Record<string, string | number | boolean | null | undefined>;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function backoffMs(attempt: number) {
  return Math.min(20_000, 750 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

function headerInt(res: Response, name: string) {
  const value = Number(res.headers.get(name));
  return Number.isFinite(value) && res.headers.has(name) ? value : null;
}

async function errorCode(res: Response): Promise<string | null> {
  try {
    const json = parseWordPressJson(await res.text()) as { code?: unknown };
    return typeof json?.code === "string" ? json.code : null;
  } catch {
    return null;
  }
}

/** WooCommerce / WordPress error codes that mean "this key may not read that". */
function isPermissionCode(code: string | null) {
  return !!code && (code.startsWith("woocommerce_rest_") || code === "rest_forbidden" || code === "rest_cannot_view" || code === "rest_not_logged_in");
}

export class WooCommerceClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: WooClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  private url(route: string, params: Params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    query.set("consumer_key", this.opts.consumerKey);
    query.set("consumer_secret", this.opts.consumerSecret);
    return `${this.opts.home}/wp-json/wc/v3${route}?${query.toString()}`;
  }

  async get<T>(route: string, params: Params = {}): Promise<WooResponse<T>> {
    const maxRetries = this.opts.maxRetries ?? 3;
    const maxThrottleRetries = this.opts.maxThrottleRetries ?? 8;
    let failures = 0;
    let throttles = 0;

    for (;;) {
      let res: Response;
      try {
        res = await safeFetch(
          this.url(route, params),
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(this.opts.timeoutMs ?? 30_000) },
          { fetchImpl: this.fetchImpl, lookup: this.opts.lookup, sameOriginOnly: true },
        );
      } catch (err) {
        if (err instanceof SourceApiError) throw err;
        if (err instanceof SiteError) {
          if (err.code === "invalid_site") throw new SourceApiError("client", "WooCommerce site is not a public https host");
          // DNS failure: treat like the network.
        }
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("network", "WooCommerce request failed (network)");
      }

      if (res.headers.has("cf-mitigated")) throw new SourceApiError("blocked", `WooCommerce site challenged the request (${res.status})`, res.status);
      if (res.status === 401) throw new SourceApiError("unauthorized", "WooCommerce rejected the key (401)", 401);
      if (res.status === 403) {
        if (isPermissionCode(await errorCode(res))) throw new SourceApiError("unauthorized", "WooCommerce key lacks permission (403)", 403);
        throw new SourceApiError("blocked", "WooCommerce site blocked the request (403)", 403);
      }
      if (res.status === 404) {
        const code = await errorCode(res);
        throw new SourceApiError("client", `WooCommerce endpoint not found (404${code ? ` ${code}` : ""})`, 404);
      }

      if (res.status === 429) {
        if (throttles++ >= maxThrottleRetries) throw new SourceApiError("throttled", "WooCommerce rate limit (429)", 429);
        const retryAfter = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 60) * 1000 : backoffMs(throttles));
        continue;
      }

      if (res.status >= 500) {
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("server", `WooCommerce server error (${res.status})`, res.status);
      }

      if (!res.ok) throw new SourceApiError("client", `WooCommerce request failed (${res.status})`, res.status);

      let data: T;
      try {
        data = parseWordPressJson(await res.text()) as T;
      } catch {
        // An HTML page with 200 = a maintenance / security plugin page.
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("blocked", "WooCommerce returned a page instead of JSON");
      }
      return { data, total: headerInt(res, "x-wp-total"), totalPages: headerInt(res, "x-wp-totalpages") };
    }
  }
}

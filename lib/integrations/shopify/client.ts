/**
 * Minimal Shopify Admin GraphQL client built for long-running imports:
 *
 *  - Cost-based rate limits: reads `extensions.cost.throttleStatus` after every
 *    call and waits for the bucket to refill before the next one; on a
 *    THROTTLED error it waits and retries instead of failing.
 *  - HTTP 429 → honours Retry-After. 5xx / network errors → exponential backoff.
 *  - 401 → SourceApiError("unauthorized") so the engine pauses and asks the
 *    merchant to reconnect (no blind retries).
 *  - The access token only ever goes into the request header — it is never part
 *    of an error message or a log line.
 */
import { SourceApiError, redactSecrets } from "@/lib/integrations/import/errors";
import { logger } from "@/lib/logger";

type Throttle = { maximumAvailable: number; currentlyAvailable: number; restoreRate: number };

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; extensions?: { code?: string } }[];
  extensions?: { cost?: { requestedQueryCost?: number; actualQueryCost?: number | null; throttleStatus?: Throttle } };
};

export type ShopifyClientOptions = {
  shopDomain: string;
  apiVersion: string;
  getAccessToken: () => Promise<string>;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** Retries for network / 5xx errors. */
  maxRetries?: number;
  /** Separate, larger budget for throttling (waiting is expected, not a failure). */
  maxThrottleRetries?: number;
  timeoutMs?: number;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function backoffMs(attempt: number) {
  return Math.min(30_000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

export class ShopifyClient {
  private throttle: Throttle | null = null;
  private lastCost = 50;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: ShopifyClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  private get endpoint() {
    return `https://${this.opts.shopDomain}/admin/api/${this.opts.apiVersion}/graphql.json`;
  }

  /** Waits until the leaky bucket can pay for a query about as costly as the last one. */
  private async waitForBudget() {
    const t = this.throttle;
    if (!t || t.restoreRate <= 0) return;
    const needed = Math.min(this.lastCost, t.maximumAvailable);
    if (t.currentlyAvailable >= needed) return;
    const ms = Math.ceil(((needed - t.currentlyAvailable) / t.restoreRate) * 1000);
    await this.sleep(ms);
    // Assume the bucket refilled while we waited; the next response corrects it.
    this.throttle = { ...t, currentlyAvailable: needed };
  }

  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const maxRetries = this.opts.maxRetries ?? 4;
    const maxThrottleRetries = this.opts.maxThrottleRetries ?? 12;
    let failures = 0;
    let throttles = 0;

    for (;;) {
      await this.waitForBudget();
      const token = await this.opts.getAccessToken();

      let res: Response;
      try {
        res = await this.fetchImpl(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query, variables }),
          signal: AbortSignal.timeout(this.opts.timeoutMs ?? 30_000),
        });
      } catch {
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("network", "Shopify request failed (network)");
      }

      if (res.status === 401) throw new SourceApiError("unauthorized", "Shopify rejected the access token (401)", 401);
      if (res.status === 402 || res.status === 423) {
        throw new SourceApiError("client", `Shopify store unavailable (${res.status})`, res.status);
      }
      if (res.status === 403) throw new SourceApiError("client", "Shopify denied access (403) — missing scope?", 403);

      if (res.status === 429) {
        if (throttles++ >= maxThrottleRetries) throw new SourceApiError("throttled", "Shopify rate limit (429)", 429);
        const retryAfter = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000);
        continue;
      }

      if (res.status >= 500) {
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("server", `Shopify server error (${res.status})`, res.status);
      }

      if (!res.ok) throw new SourceApiError("client", `Shopify request failed (${res.status})`, res.status);

      let json: GraphQLResponse<T>;
      try {
        json = (await res.json()) as GraphQLResponse<T>;
      } catch {
        if (failures++ < maxRetries) {
          await this.sleep(backoffMs(failures));
          continue;
        }
        throw new SourceApiError("server", "Shopify returned an unreadable response");
      }

      const cost = json.extensions?.cost;
      if (cost?.throttleStatus) this.throttle = cost.throttleStatus;
      if (cost?.requestedQueryCost) this.lastCost = cost.requestedQueryCost;

      if (json.errors?.length) {
        if (json.errors.some((e) => e.extensions?.code === "THROTTLED")) {
          if (throttles++ >= maxThrottleRetries) throw new SourceApiError("throttled", "Shopify query throttled");
          logger.debug("[Shopify] Throttled — waiting for bucket", { shop: this.opts.shopDomain });
          if (this.throttle) this.throttle = { ...this.throttle, currentlyAvailable: 0 };
          else await this.sleep(1000);
          continue;
        }
        if (json.errors.some((e) => e.extensions?.code === "ACCESS_DENIED")) {
          throw new SourceApiError("client", "Shopify denied access to a field — missing scope?");
        }
        const message = json.errors.map((e) => e.message).join("; ").slice(0, 500);
        throw new SourceApiError("graphql", redactSecrets(`Shopify GraphQL error: ${message}`));
      }

      if (!json.data) throw new SourceApiError("graphql", "Shopify returned no data");
      return json.data;
    }
  }
}

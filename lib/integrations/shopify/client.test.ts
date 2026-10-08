import { describe, it, expect, vi } from "vitest";
import { ShopifyClient } from "./client";
import { SourceApiError } from "@/lib/integrations/import/errors";

/** Awaits a promise that must reject and returns its error. */
async function failure(promise: Promise<unknown>): Promise<SourceApiError> {
  return promise.then(
    () => {
      throw new Error("expected a failure");
    },
    (e: unknown) => e as SourceApiError,
  );
}


const TOKEN = "shpat_super_secret_token";

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

function ok(data: unknown, throttle?: { currentlyAvailable: number; maximumAvailable?: number; restoreRate?: number }, cost = 100) {
  return json({
    data,
    extensions: throttle
      ? {
          cost: {
            requestedQueryCost: cost,
            throttleStatus: { maximumAvailable: 2000, restoreRate: 100, ...throttle },
          },
        }
      : undefined,
  });
}

function make(responses: (Response | Error)[], opts: { maxRetries?: number } = {}) {
  const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    void init;
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  });
  const sleep = vi.fn(async (ms: number) => {
    void ms;
  });
  const client = new ShopifyClient({
    shopDomain: "acme.myshopify.com",
    apiVersion: "2026-10",
    getAccessToken: async () => TOKEN,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep,
    ...opts,
  });
  return { client, fetchImpl, sleep };
}

describe("ShopifyClient", () => {
  it("sends the token only as a header to the versioned GraphQL endpoint", async () => {
    const { client, fetchImpl } = make([ok({ shop: { name: "Acme" } })]);
    await expect(client.request("{ shop { name } }")).resolves.toEqual({ shop: { name: "Acme" } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://acme.myshopify.com/admin/api/2026-10/graphql.json");
    expect((init!.headers as Record<string, string>)["X-Shopify-Access-Token"]).toBe(TOKEN);
    expect(String(init!.body)).not.toContain(TOKEN);
  });

  it("rate limiting: waits for the cost bucket to refill before the next query", async () => {
    const { client, sleep } = make([ok({ a: 1 }, { currentlyAvailable: 20 }, 220), ok({ a: 2 }, { currentlyAvailable: 1500 })]);
    await client.request("{a}");
    expect(sleep).not.toHaveBeenCalled();
    await client.request("{a}");
    // needs 220, has 20, restores 100/s → 2s
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("rate limiting: retries THROTTLED GraphQL errors instead of failing", async () => {
    const { client, fetchImpl } = make([
      json({ errors: [{ message: "Throttled", extensions: { code: "THROTTLED" } }] }),
      ok({ a: 1 }),
    ]);
    await expect(client.request("{a}")).resolves.toEqual({ a: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rate limiting: honours Retry-After on HTTP 429", async () => {
    const { client, sleep } = make([new Response("", { status: 429, headers: { "Retry-After": "3" } }), ok({ a: 1 })]);
    await expect(client.request("{a}")).resolves.toEqual({ a: 1 });
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it("retry: recovers from 5xx and network failures with backoff", async () => {
    const { client, fetchImpl, sleep } = make([new Response("", { status: 503 }), new TypeError("fetch failed"), ok({ a: 1 })]);
    await expect(client.request("{a}")).resolves.toEqual({ a: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("retry: gives up after maxRetries with a network error", async () => {
    const { client, fetchImpl } = make([new TypeError("x"), new TypeError("x"), new TypeError("x")], { maxRetries: 2 });
    const err = await failure(client.request("{a}"));
    expect(err).toBeInstanceOf(SourceApiError);
    expect(err.kind).toBe("network");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("401 is not retried and is reported as unauthorized", async () => {
    const { client, fetchImpl } = make([new Response("", { status: 401 }), ok({})]);
    const err = await failure(client.request("{a}"));
    expect(err.kind).toBe("unauthorized");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("GraphQL errors never contain the token", async () => {
    const { client } = make([json({ errors: [{ message: `bad token ${TOKEN}` }] })]);
    const err = await failure(client.request("{a}"));
    expect(err.kind).toBe("graphql");
    expect(err.message).not.toContain(TOKEN);
  });
});

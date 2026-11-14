import { describe, it, expect, vi } from "vitest";
import { SourceApiError } from "@/lib/integrations/import/errors";
import { WooCommerceClient } from "./client";
import type { LookupFn } from "./site";

const CK = "ck_0123456789abcdef0123456789abcdef01234567";
const CS = "cs_fedcba9876543210fedcba9876543210fedcba98";
const lookup: LookupFn = async () => [{ address: "93.184.216.34", family: 4 }];

async function failure(promise: Promise<unknown>): Promise<SourceApiError> {
  return promise.then(
    () => {
      throw new Error("expected a failure");
    },
    (e: unknown) => e as SourceApiError,
  );
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

function make(responses: (Response | Error)[], opts: { maxRetries?: number } = {}) {
  const fetchImpl = vi.fn(async (url: string | URL | Request) => {
    void url;
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  });
  const sleep = vi.fn(async () => {});
  const client = new WooCommerceClient({ home: "https://acme.com", consumerKey: CK, consumerSecret: CS, fetchImpl, sleep, lookup, ...opts });
  return { client, fetchImpl, sleep };
}

describe("WooCommerceClient", () => {
  it("reads data and the WordPress paging headers", async () => {
    const { client, fetchImpl } = make([json([{ id: 1 }], { headers: { "X-WP-Total": "41", "X-WP-TotalPages": "3" } })]);
    expect(await client.get("/products", { page: 2, per_page: 20, empty: "" })).toEqual({ data: [{ id: 1 }], total: 41, totalPages: 3 });
    const url = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://acme.com/wp-json/wc/v3/products");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("empty")).toBe(false);
    expect(url.searchParams.get("consumer_key")).toBe(CK);
    expect(url.searchParams.get("consumer_secret")).toBe(CS);
  });

  it("401 → unauthorized, without retrying and without leaking the key", async () => {
    const { client, fetchImpl } = make([json({ code: "woocommerce_rest_cannot_view" }, { status: 401 })]);
    const err = await failure(client.get("/products"));
    expect(err.kind).toBe("unauthorized");
    expect(err.message).not.toContain(CK);
    expect(err.message).not.toContain(CS);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("403 from WooCommerce → unauthorized; 403 from a firewall → blocked", async () => {
    expect((await failure(make([json({ code: "woocommerce_rest_cannot_view" }, { status: 403 })]).client.get("/orders"))).kind).toBe("unauthorized");
    expect((await failure(make([new Response("<html>Wordfence</html>", { status: 403 })]).client.get("/orders"))).kind).toBe("blocked");
    expect((await failure(make([new Response("", { status: 503, headers: { "cf-mitigated": "challenge" } })]).client.get("/orders"))).kind).toBe("blocked");
  });

  it("honours Retry-After on 429", async () => {
    const { client, sleep } = make([new Response("", { status: 429, headers: { "Retry-After": "3" } }), json([])]);
    await client.get("/products");
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it("retries 5xx and network errors, then gives up with the right kind", async () => {
    expect((await make([new Response("", { status: 502 }), json([{ id: 1 }])]).client.get("/products")).data).toEqual([{ id: 1 }]);
    expect((await failure(make([new Response("", { status: 500 }), new Response("", { status: 500 })], { maxRetries: 1 }).client.get("/products"))).kind).toBe("server");
    expect((await failure(make([new TypeError("fetch failed"), new TypeError("fetch failed")], { maxRetries: 1 }).client.get("/products"))).kind).toBe("network");
  });

  it("an HTML page instead of JSON is retried, then reported as blocked", async () => {
    const html = () => new Response("<html>Under maintenance</html>", { status: 200 });
    expect((await failure(make([html(), html()], { maxRetries: 1 }).client.get("/products"))).kind).toBe("blocked");
  });

  it("tolerates PHP notices before the JSON", async () => {
    const { client } = make([new Response('<b>Deprecated</b>: something in plugin.php\n[{"id":5}]', { status: 200 })]);
    expect((await client.get("/products")).data).toEqual([{ id: 5 }]);
  });

  it("never sends the key to another origin", async () => {
    const { client, fetchImpl } = make([new Response(null, { status: 301, headers: { location: "https://evil.com/steal" } })]);
    expect((await failure(client.get("/products"))).kind).toBe("client");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

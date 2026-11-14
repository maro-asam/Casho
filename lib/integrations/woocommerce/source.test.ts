import { describe, it, expect, vi } from "vitest";
import type { NormalizedProduct } from "@/lib/integrations/import/types";
import { WooCommerceClient } from "./client";
import { nextCursor, parseCursor, PAGE_SIZES, WooCommerceSource } from "./source";
import type { LookupFn } from "./site";

const lookup: LookupFn = async () => [{ address: "93.184.216.34", family: 4 }];

function json(body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers });
}

/** Routes by path + a few query params; records every call. */
function api(handler: (path: string, q: URLSearchParams) => Response) {
  const calls: { path: string; q: URLSearchParams }[] = [];
  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const path = url.pathname.replace("/wp-json/wc/v3", "");
    calls.push({ path, q: url.searchParams });
    return handler(path, url.searchParams);
  });
  const client = new WooCommerceClient({
    home: "https://acme.com",
    consumerKey: "ck_0123456789abcdef0123456789abcdef01234567",
    consumerSecret: "cs_fedcba9876543210fedcba9876543210fedcba98",
    fetchImpl,
    lookup,
    sleep: async () => {},
  });
  return { source: new WooCommerceSource(client, "acme.com"), calls };
}

const product = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  name: `P${id}`,
  slug: `p${id}`,
  type: "simple",
  status: "publish",
  price: "10",
  regular_price: "10",
  manage_stock: false,
  stock_status: "instock",
  categories: [],
  images: [],
  attributes: [],
  variations: [],
  ...extra,
});

describe("cursor", () => {
  it("parses defensively", () => {
    expect(parseCursor(null, "PRODUCT")).toEqual({ page: 1, perPage: PAGE_SIZES.PRODUCT });
    expect(parseCursor("garbage", "ORDER")).toEqual({ page: 1, perPage: PAGE_SIZES.ORDER });
    expect(parseCursor('{"page":4,"perPage":20}', "PRODUCT")).toEqual({ page: 4, perPage: 20 });
    expect(parseCursor('{"page":-1,"perPage":5000}', "PRODUCT")).toEqual({ page: 1, perPage: PAGE_SIZES.PRODUCT });
  });

  it("advances until the last page", () => {
    expect(nextCursor({ page: 1, perPage: 20 }, 20, 3)).toBe('{"page":2,"perPage":20}');
    expect(nextCursor({ page: 3, perPage: 20 }, 7, 3)).toBeNull();
    // No paging headers (some caches strip them): a short page is the last one.
    expect(nextCursor({ page: 1, perPage: 20 }, 20, null)).toBe('{"page":2,"perPage":20}');
    expect(nextCursor({ page: 2, perPage: 20 }, 3, null)).toBeNull();
    expect(nextCursor({ page: 2, perPage: 20 }, 0, 5)).toBeNull();
  });
});

describe("WooCommerceSource", () => {
  it("pages products by id, skips grouped ones and fetches variations", async () => {
    const { source, calls } = api((path, q) => {
      if (path === "/settings/products/woocommerce_weight_unit") return json({ value: "g" });
      if (path === "/products/2/variations") {
        return json([{ id: 21, status: "publish", price: "5", regular_price: "5", manage_stock: true, stock_quantity: 4, attributes: [{ name: "Size", option: "S" }] }], { "X-WP-TotalPages": "1" });
      }
      if (path === "/products") {
        expect(q.get("orderby")).toBe("id");
        expect(q.get("order")).toBe("asc");
        expect(q.get("status")).toBe("any");
        return json(
          [
            product(1, { weight: "500" }),
            product(2, { type: "variable", attributes: [{ name: "Size", variation: true, options: ["S"] }], variations: [21] }),
            product(3, { type: "grouped" }),
          ],
          { "X-WP-Total": "45", "X-WP-TotalPages": "3" },
        );
      }
      return new Response("", { status: 404 });
    });

    const page = await source.fetchPage("PRODUCT", null);
    expect(page.items.map((i) => i.externalId)).toEqual(["1", "2"]);
    expect((page.items[0] as NormalizedProduct).weight).toBe(0.5);
    expect((page.items[1] as NormalizedProduct).variants.map((v) => v.externalId)).toEqual(["21"]);
    expect(page.nextCursor).toBe(JSON.stringify({ page: 2, perPage: PAGE_SIZES.PRODUCT }));
    // The weight unit is read once per source, not per product.
    expect(calls.filter((c) => c.path.startsWith("/settings")).length).toBe(1);
  });

  it("leaves the default Uncategorized category out", async () => {
    const { source } = api(() =>
      json([
        { id: 15, name: "Uncategorized", slug: "uncategorized" },
        { id: 16, name: "Shoes", slug: "shoes" },
      ]),
    );
    const page = await source.fetchPage("COLLECTION", null);
    expect(page.items.map((i) => i.externalId)).toEqual(["16"]);
    expect(page.nextCursor).toBeNull();
  });

  it("counts from X-WP-Total", async () => {
    const { source, calls } = api(() => json([{ id: 1 }], { "X-WP-Total": "1234" }));
    expect(await source.count("ORDER")).toBe(1234);
    expect(calls[0].q.get("per_page")).toBe("1");
    expect(calls[0].q.get("status")).toBe("any");
  });

  it("re-fetches failed items by id (numeric ids only)", async () => {
    const { source, calls } = api(() => json([{ id: 7, status: "completed", line_items: [] }]));
    const records = await source.fetchByIds("ORDER", ["7", "../etc", "8"]);
    expect(records.map((r) => r.externalId)).toEqual(["7"]);
    expect(calls[0].q.get("include")).toBe("7,8");
  });

  it("falls back to kg when the weight setting can't be read", async () => {
    const { source } = api((path) => (path.startsWith("/settings") ? new Response("", { status: 403 }) : json([product(1, { weight: "2" })])));
    const page = await source.fetchPage("PRODUCT", null);
    expect((page.items[0] as NormalizedProduct).weight).toBe(2);
  });
});

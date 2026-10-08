import { describe, it, expect, vi } from "vitest";
import { ShopifySource, nextCursor, parseCursor, PAGINATION_WINDOW } from "./source";
import type { ShopifyClient } from "./client";

function product(id: number, variants = 1, hasMoreVariants = false) {
  return {
    id: `gid://shopify/Product/${id}`,
    title: `P${id}`,
    handle: `p-${id}`,
    descriptionHtml: "",
    vendor: null,
    productType: null,
    tags: [],
    status: "ACTIVE",
    createdAt: null,
    options: [{ name: "Size", values: ["S", "M"] }],
    media: { nodes: [] },
    collections: { nodes: [] },
    variants: {
      pageInfo: { hasNextPage: hasMoreVariants, endCursor: hasMoreVariants ? "v-cursor" : null },
      nodes: Array.from({ length: variants }, (_, i) => ({
        id: `gid://shopify/ProductVariant/${id}${i}`,
        title: `V${i}`,
        sku: null,
        price: "10.00",
        compareAtPrice: null,
        inventoryQuantity: 1,
        selectedOptions: [{ name: "Size", value: "S" }],
        inventoryItem: { tracked: true, unitCost: null },
      })),
    },
  };
}

function fakeClient(handler: (query: string, vars: Record<string, unknown>) => unknown) {
  const request = vi.fn(async (query: string, vars: Record<string, unknown> = {}) => handler(query, vars));
  return { client: { request } as unknown as ShopifyClient, request };
}

describe("ShopifySource pagination", () => {
  it("walks every page with the cursor and stops at the last one", async () => {
    const pages = [
      { nodes: [product(1), product(2)], pageInfo: { hasNextPage: true, endCursor: "c1" } },
      { nodes: [product(3)], pageInfo: { hasNextPage: false, endCursor: "c2" } },
    ];
    const { client, request } = fakeClient((_q, vars) => ({ products: pages[vars.after ? 1 : 0] }));
    const source = new ShopifySource(client, "gid://shopify/Shop/1");

    const first = await source.fetchPage("PRODUCT", null);
    expect(first.items.map((i) => i.externalId)).toEqual(["gid://shopify/Product/1", "gid://shopify/Product/2"]);
    expect(first.nextCursor).not.toBeNull();

    const second = await source.fetchPage("PRODUCT", first.nextCursor);
    expect(request.mock.calls[1][1]).toMatchObject({ after: "c1", query: null });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it("fetches overflowing nested variants for a product", async () => {
    const { client } = fakeClient((query) => {
      if (query.includes("ImportMoreVariants")) {
        return {
          product: {
            variants: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [{ ...product(9).variants.nodes[0], id: "gid://shopify/ProductVariant/extra" }],
            },
          },
        };
      }
      return { products: { nodes: [product(9, 2, true)], pageInfo: { hasNextPage: false, endCursor: null } } };
    });
    const page = await new ShopifySource(client, "shop").fetchPage("PRODUCT", null);
    const item = page.items[0];
    expect(item.entity === "PRODUCT" && item.variants.map((v) => v.externalId)).toEqual([
      "gid://shopify/ProductVariant/90",
      "gid://shopify/ProductVariant/91",
      "gid://shopify/ProductVariant/extra",
    ]);
  });

  it("restarts the cursor with an id filter before Shopify's 25k pagination cap", () => {
    const near = { after: "c", minId: null, seen: PAGINATION_WINDOW - 2 };
    const next = parseCursor(nextCursor(near, { hasNextPage: true, endCursor: "c2" }, ["gid://shopify/Order/10", "gid://shopify/Order/42"]));
    expect(next).toEqual({ after: null, minId: "42", seen: 0 });
  });

  it("uses the id filter of a new window and drops ids already imported", async () => {
    const { client, request } = fakeClient(() => ({
      products: { nodes: [product(42), product(43)], pageInfo: { hasNextPage: false, endCursor: null } },
    }));
    const cursor = JSON.stringify({ after: null, minId: "42", seen: 0 });
    const page = await new ShopifySource(client, "shop").fetchPage("PRODUCT", cursor);
    expect(request.mock.calls[0][1]).toMatchObject({ query: "id:>42", after: null });
    expect(page.items.map((i) => i.externalId)).toEqual(["gid://shopify/Product/43"]);
  });

  it("fails loudly (no infinite loop) if Shopify ignores the id filter", async () => {
    const { client } = fakeClient(() => ({
      products: { nodes: [product(1), product(2)], pageInfo: { hasNextPage: true, endCursor: "c" } },
    }));
    await expect(new ShopifySource(client, "shop").fetchPage("PRODUCT", JSON.stringify({ after: null, minId: "100", seen: 0 }))).rejects.toThrow(
      /id range filter/,
    );
  });

  it("fetchByIds batches node lookups and skips missing records", async () => {
    const { client, request } = fakeClient((_q, vars) => ({
      nodes: (vars.ids as string[]).map((id) => (id.endsWith("/404") ? null : { __typename: "Product", ...product(Number(id.split("/").pop())) })),
    }));
    const ids = [...Array.from({ length: 12 }, (_, i) => `gid://shopify/Product/${i + 1}`), "gid://shopify/Product/404"];
    const items = await new ShopifySource(client, "shop").fetchByIds("PRODUCT", ids);
    expect(items).toHaveLength(12);
    expect(request).toHaveBeenCalledTimes(2); // 10 per batch for products
  });
});

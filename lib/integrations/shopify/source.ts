/**
 * ImportSource implementation for Shopify (GraphQL Admin API).
 *
 * Pagination: cursor-based, sorted by ID. Shopify stops cursor pagination after
 * 25,000 objects, so every PAGINATION_WINDOW records the cursor is restarted
 * with an `id:>lastId` filter — stores of any size can be walked, and the
 * checkpoint (a small JSON cursor) survives restarts.
 */
import type { ImportConnection } from "@prisma/client";
import { SourceApiError } from "@/lib/integrations/import/errors";
import type { ImportSource, ImportableEntity, NormalizedRecord, SourcePage } from "@/lib/integrations/import/types";
import { ShopifyClient, type ShopifyClientOptions } from "./client";
import { getShopifyConfig } from "./config";
import { getShopifyAccessToken } from "./connection";
import {
  mapCollection,
  mapCustomer,
  mapOrder,
  mapProduct,
  type ShopifyCollectionNode,
  type ShopifyCustomerNode,
  type ShopifyLineItemNode,
  type ShopifyOrderNode,
  type ShopifyProductNode,
  type ShopifyVariantNode,
} from "./mappers";
import {
  COUNT_QUERIES,
  COUNTS_QUERY,
  LIST_QUERIES,
  LIST_ROOT_FIELD,
  MORE_LINE_ITEMS_QUERY,
  MORE_VARIANTS_QUERY,
  NODES_QUERY,
  PAGE_SIZES,
  SHOP_QUERY,
} from "./queries";

export const PAGINATION_WINDOW = 20_000;
const NODES_BATCH: Record<ImportableEntity, number> = { COLLECTION: 50, PRODUCT: 10, CUSTOMER: 50, ORDER: 10 };

type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type Connection<T> = { pageInfo: PageInfo; nodes: T[] };

export type ShopifyCursor = { after: string | null; minId: string | null; seen: number };

export function parseCursor(cursor: string | null): ShopifyCursor {
  if (!cursor) return { after: null, minId: null, seen: 0 };
  try {
    const parsed = JSON.parse(cursor) as Partial<ShopifyCursor>;
    return { after: parsed.after ?? null, minId: parsed.minId ?? null, seen: parsed.seen ?? 0 };
  } catch {
    return { after: null, minId: null, seen: 0 };
  }
}

export function numericId(gid: string): bigint {
  const tail = gid.split("/").pop() ?? "";
  return /^\d+$/.test(tail) ? BigInt(tail) : BigInt(0);
}

/** Next checkpoint after a page; null when the entity is finished. */
export function nextCursor(current: ShopifyCursor, pageInfo: PageInfo, nodeIds: string[]): string | null {
  if (!pageInfo.hasNextPage || nodeIds.length === 0) return null;
  const seen = current.seen + nodeIds.length;
  if (seen >= PAGINATION_WINDOW) {
    const lastId = numericId(nodeIds[nodeIds.length - 1]).toString();
    return JSON.stringify({ after: null, minId: lastId, seen: 0 } satisfies ShopifyCursor);
  }
  return JSON.stringify({ after: pageInfo.endCursor, minId: current.minId, seen } satisfies ShopifyCursor);
}

export type ShopInfo = { id: string; name: string; domain: string; currencyCode: string | null; primaryHost: string | null };

export type ShopifyPreviewCounts = {
  products: number;
  variants: number;
  collections: number;
  customers: number;
  orders: number;
};

export class ShopifySource implements ImportSource {
  readonly provider = "SHOPIFY" as const;

  constructor(
    private readonly client: ShopifyClient,
    readonly externalShopId: string,
  ) {}

  async count(entity: ImportableEntity): Promise<number | null> {
    const data = await this.client.request<Record<string, { count: number }>>(COUNT_QUERIES[entity]);
    return Object.values(data)[0]?.count ?? null;
  }

  async fetchPage(entity: ImportableEntity, cursor: string | null): Promise<SourcePage> {
    const state = parseCursor(cursor);
    const data = await this.client.request<Record<string, Connection<{ id: string }>>>(LIST_QUERIES[entity], {
      first: PAGE_SIZES[entity],
      after: state.after,
      query: state.minId ? `id:>${state.minId}` : null,
    });
    const page = data[LIST_ROOT_FIELD[entity]];
    if (!page) throw new SourceApiError("graphql", `Shopify returned no ${LIST_ROOT_FIELD[entity]}`);

    let nodes = page.nodes;
    if (state.minId) {
      const min = BigInt(state.minId);
      nodes = nodes.filter((n) => numericId(n.id) > min);
      // A new window that only returns already-imported ids means the id filter
      // wasn't applied — fail loudly instead of looping forever.
      if (state.after === null && page.nodes.length > 0 && nodes.length === 0) {
        throw new SourceApiError("graphql", "Shopify ignored the id range filter");
      }
    }

    const items = await this.normalize(entity, nodes);
    return { items, nextCursor: nextCursor(state, page.pageInfo, page.nodes.map((n) => n.id)) };
  }

  async fetchByIds(entity: ImportableEntity, externalIds: string[]): Promise<NormalizedRecord[]> {
    const out: NormalizedRecord[] = [];
    const size = NODES_BATCH[entity];
    for (let i = 0; i < externalIds.length; i += size) {
      const ids = externalIds.slice(i, i + size);
      const data = await this.client.request<{ nodes: ({ __typename: string; id: string } | null)[] }>(NODES_QUERY, { ids });
      const nodes = data.nodes.filter((n): n is { __typename: string; id: string } => !!n && "id" in n);
      out.push(...(await this.normalize(entity, nodes)));
    }
    return out;
  }

  private async normalize(entity: ImportableEntity, nodes: { id: string }[]): Promise<NormalizedRecord[]> {
    switch (entity) {
      case "COLLECTION":
        return (nodes as ShopifyCollectionNode[]).map(mapCollection);
      case "CUSTOMER":
        return (nodes as ShopifyCustomerNode[]).map(mapCustomer);
      case "PRODUCT": {
        const out: NormalizedRecord[] = [];
        for (const node of nodes as ShopifyProductNode[]) {
          out.push(mapProduct(node, await this.remaining<ShopifyVariantNode>(MORE_VARIANTS_QUERY, node.id, "product", "variants", node.variants.pageInfo)));
        }
        return out;
      }
      case "ORDER": {
        const out: NormalizedRecord[] = [];
        for (const node of nodes as ShopifyOrderNode[]) {
          out.push(mapOrder(node, await this.remaining<ShopifyLineItemNode>(MORE_LINE_ITEMS_QUERY, node.id, "order", "lineItems", node.lineItems.pageInfo)));
        }
        return out;
      }
    }
  }

  /** Pages through a nested connection that overflowed its first page. */
  private async remaining<T>(query: string, id: string, root: string, field: string, pageInfo: PageInfo): Promise<T[]> {
    const out: T[] = [];
    let info = pageInfo;
    while (info.hasNextPage && info.endCursor) {
      const data = await this.client.request<Record<string, Record<string, Connection<T>> | null>>(query, { id, after: info.endCursor });
      const conn = data[root]?.[field];
      if (!conn) break;
      out.push(...conn.nodes);
      info = conn.pageInfo;
    }
    return out;
  }
}

export function createShopifyClient(
  shopDomain: string,
  getAccessToken: () => Promise<string>,
  overrides: Partial<ShopifyClientOptions> = {},
) {
  return new ShopifyClient({ shopDomain, apiVersion: getShopifyConfig().apiVersion, getAccessToken, ...overrides });
}

function clientFor(connection: Pick<ImportConnection, "id" | "shopDomain">) {
  return createShopifyClient(connection.shopDomain, () => getShopifyAccessToken(connection.id));
}

export function createShopifySource(connection: Pick<ImportConnection, "id" | "shopDomain" | "externalShopId">): ImportSource {
  return new ShopifySource(clientFor(connection), connection.externalShopId);
}

export async function fetchShopInfo(client: ShopifyClient): Promise<ShopInfo> {
  const data = await client.request<{
    shop: { id: string; name: string; myshopifyDomain: string; currencyCode: string | null; primaryDomain: { host: string } | null };
  }>(SHOP_QUERY);
  return {
    id: data.shop.id,
    name: data.shop.name,
    domain: data.shop.myshopifyDomain,
    currencyCode: data.shop.currencyCode,
    primaryHost: data.shop.primaryDomain?.host ?? null,
  };
}

export async function fetchPreviewCounts(connection: Pick<ImportConnection, "id" | "shopDomain">): Promise<ShopifyPreviewCounts> {
  const data = await clientFor(connection).request<Record<string, { count: number } | null>>(COUNTS_QUERY);
  return {
    products: data.productsCount?.count ?? 0,
    variants: data.productVariantsCount?.count ?? 0,
    collections: data.collectionsCount?.count ?? 0,
    customers: data.customersCount?.count ?? 0,
    orders: data.ordersCount?.count ?? 0,
  };
}

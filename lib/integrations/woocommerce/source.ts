/**
 * ImportSource implementation for WooCommerce (REST API v3).
 *
 * Pagination: page numbers ordered by id ascending, so records created while
 * the import runs land on later pages. The checkpoint stores the page and its
 * size. A record deleted mid-import can shift one item back a page; running the
 * import again picks it up (imports are idempotent).
 *
 * Variable products need one extra call for their variations; those calls run
 * a few at a time so slow WordPress hosts aren't flooded.
 */
import type { ImportConnection } from "@prisma/client";
import type { ImportSource, ImportableEntity, NormalizedRecord, PreviewCounts, SourcePage } from "@/lib/integrations/import/types";
import { decryptCredentials } from "./auth";
import { WooCommerceClient, type WooClientOptions } from "./client";
import {
  isDefaultCategory,
  mapCategory,
  mapCustomer,
  mapOrder,
  mapProduct,
  type WooCategory,
  type WooCustomer,
  type WooOrder,
  type WooProduct,
  type WooVariation,
} from "./mappers";
import { homeFromKey } from "./site";

export const PAGE_SIZES: Record<ImportableEntity, number> = { COLLECTION: 100, PRODUCT: 20, CUSTOMER: 100, ORDER: 50 };
const VARIATION_PAGE = 100;
const VARIATION_CONCURRENCY = 3;
/** Grouped products are containers; their child products import on their own. */
const SKIPPED_PRODUCT_TYPES = new Set(["grouped"]);

const ROUTES: Record<ImportableEntity, string> = {
  COLLECTION: "/products/categories",
  PRODUCT: "/products",
  CUSTOMER: "/customers",
  ORDER: "/orders",
};

/** Extra filters per entity (WooCommerce defaults otherwise: customers = the "customer" role). */
const FILTERS: Partial<Record<ImportableEntity, Record<string, string>>> = {
  PRODUCT: { status: "any" },
  ORDER: { status: "any" },
};

export type WooCursor = { page: number; perPage: number };

export function parseCursor(cursor: string | null, entity: ImportableEntity): WooCursor {
  const fallback = { page: 1, perPage: PAGE_SIZES[entity] };
  if (!cursor) return fallback;
  try {
    const parsed = JSON.parse(cursor) as Partial<WooCursor>;
    const page = Number(parsed.page);
    const perPage = Number(parsed.perPage);
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      perPage: Number.isInteger(perPage) && perPage > 0 && perPage <= 100 ? perPage : fallback.perPage,
    };
  } catch {
    return fallback;
  }
}

/** Next checkpoint after a page; null when the entity is finished. */
export function nextCursor(current: WooCursor, received: number, totalPages: number | null): string | null {
  const more = totalPages !== null ? current.page < totalPages : received >= current.perPage;
  if (!more || received === 0) return null;
  return JSON.stringify({ page: current.page + 1, perPage: current.perPage } satisfies WooCursor);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

export class WooCommerceSource implements ImportSource {
  readonly provider = "WOOCOMMERCE" as const;
  private weightUnit: Promise<string> | null = null;

  constructor(
    private readonly client: WooCommerceClient,
    readonly externalShopId: string,
  ) {}

  async count(entity: ImportableEntity): Promise<number | null> {
    const res = await this.client.get<unknown[]>(ROUTES[entity], { per_page: 1, ...FILTERS[entity] });
    return res.total;
  }

  async fetchPage(entity: ImportableEntity, cursor: string | null): Promise<SourcePage> {
    const state = parseCursor(cursor, entity);
    const res = await this.client.get<unknown[]>(ROUTES[entity], {
      ...FILTERS[entity],
      page: state.page,
      per_page: state.perPage,
      orderby: "id",
      order: "asc",
    });
    const rows = Array.isArray(res.data) ? res.data : [];
    return { items: await this.normalize(entity, rows), nextCursor: nextCursor(state, rows.length, res.totalPages) };
  }

  async fetchByIds(entity: ImportableEntity, externalIds: string[]): Promise<NormalizedRecord[]> {
    const ids = externalIds.filter((id) => /^\d+$/.test(id));
    const out: NormalizedRecord[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const include = ids.slice(i, i + 100);
      const res = await this.client.get<unknown[]>(ROUTES[entity], {
        ...FILTERS[entity],
        include: include.join(","),
        per_page: include.length,
      });
      out.push(...(await this.normalize(entity, Array.isArray(res.data) ? res.data : [])));
    }
    return out;
  }

  private async normalize(entity: ImportableEntity, rows: unknown[]): Promise<NormalizedRecord[]> {
    switch (entity) {
      case "COLLECTION":
        return (rows as WooCategory[]).filter((c) => !isDefaultCategory(c)).map(mapCategory);
      case "CUSTOMER":
        return (rows as WooCustomer[]).map(mapCustomer);
      case "ORDER":
        return (rows as WooOrder[]).map(mapOrder);
      case "PRODUCT": {
        const products = (rows as WooProduct[]).filter((p) => !SKIPPED_PRODUCT_TYPES.has(p.type));
        const unit = await this.getWeightUnit();
        return mapLimit(products, VARIATION_CONCURRENCY, async (p) =>
          mapProduct(p, p.type === "variable" && (p.variations?.length ?? 0) > 0 ? await this.variations(p.id) : [], unit),
        );
      }
    }
  }

  private async variations(productId: number): Promise<WooVariation[]> {
    const out: WooVariation[] = [];
    for (let page = 1; ; page++) {
      const res = await this.client.get<WooVariation[]>(`/products/${productId}/variations`, { page, per_page: VARIATION_PAGE, orderby: "id", order: "asc" });
      const rows = Array.isArray(res.data) ? res.data : [];
      out.push(...rows);
      const more = res.totalPages !== null ? page < res.totalPages : rows.length >= VARIATION_PAGE;
      if (!more || rows.length === 0) return out;
    }
  }

  /** The store's weight unit (kg / g / lbs / oz); kg when the setting can't be read. */
  private getWeightUnit(): Promise<string> {
    this.weightUnit ??= this.client
      .get<{ value?: unknown }>("/settings/products/woocommerce_weight_unit")
      .then((res) => (typeof res.data?.value === "string" ? res.data.value : "kg"))
      .catch(() => "kg");
    return this.weightUnit;
  }
}

// ─── Wiring ──────────────────────────────────────────────────────────────────

type ConnectionFields = Pick<ImportConnection, "shopDomain" | "accessTokenEnc">;

export function clientFor(connection: ConnectionFields, overrides: Partial<WooClientOptions> = {}) {
  const credentials = decryptCredentials(connection.accessTokenEnc);
  return new WooCommerceClient({ home: homeFromKey(connection.shopDomain), ...credentials, ...overrides });
}

export function createWooCommerceSource(connection: ConnectionFields & Pick<ImportConnection, "externalShopId">): ImportSource {
  return new WooCommerceSource(clientFor(connection), connection.externalShopId);
}

/** Counts for the preview (+ the store currency, saved on the connection). */
export async function fetchPreviewCounts(connection: ConnectionFields): Promise<PreviewCounts> {
  const client = clientFor(connection);
  const total = (entity: ImportableEntity) =>
    client.get<unknown[]>(ROUTES[entity], { per_page: 1, ...FILTERS[entity] }).then((res) => res.total ?? (Array.isArray(res.data) ? res.data.length : 0));

  // Sequential on purpose: the first call surfaces a revoked key before we
  // spend four more requests on a slow host.
  const products = await total("PRODUCT");
  const [collections, customers, orders, currency] = await Promise.all([
    total("COLLECTION"),
    total("CUSTOMER"),
    total("ORDER"),
    client
      .get<{ code?: unknown }>("/data/currencies/current")
      .then((res) => (typeof res.data?.code === "string" ? res.data.code : null))
      .catch(() => null),
  ]);
  return { products, variants: null, collections, customers, orders, currencyCode: currency };
}

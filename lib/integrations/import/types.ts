/**
 * Provider-agnostic store-import contract.
 *
 * A provider (Shopify today) turns its API data into the Normalized* records
 * below; the engine (./engine.ts) and the Prisma sink (./sink.ts) never see
 * provider-specific shapes. Adding WooCommerce/Magento = a new ImportSource.
 */
import type { ImportProvider } from "@prisma/client";

/** Entities a merchant can select, in dependency order (variants ride with products). */
export const IMPORTABLE_ENTITIES = ["COLLECTION", "PRODUCT", "CUSTOMER", "ORDER"] as const;
export type ImportableEntity = (typeof IMPORTABLE_ENTITIES)[number];

export function isImportableEntity(value: unknown): value is ImportableEntity {
  return typeof value === "string" && (IMPORTABLE_ENTITIES as readonly string[]).includes(value);
}

/** Selected entities sorted into the order they must be imported in. */
export function orderEntities(entities: readonly string[]): ImportableEntity[] {
  return IMPORTABLE_ENTITIES.filter((e) => entities.includes(e));
}

export const PROVIDER_LABELS: Record<ImportProvider, string> = {
  SHOPIFY: "Shopify",
};

// ─── Normalized records ──────────────────────────────────────────────────────
// Money is in the shop currency's major unit (e.g. 12.5), exactly as the source
// reports it. The sink converts to Kasho's conventions (Product.price in EGP
// units, Order amounts in piasters).

export type NormalizedCollection = {
  entity: "COLLECTION";
  externalId: string;
  label: string;
  name: string;
  handle: string;
  imageUrl: string | null;
};

export type NormalizedVariant = {
  externalId: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  /** null = the source does not track inventory for this variant. */
  stock: number | null;
  options: { key: string; value: string }[];
  imageUrl: string | null;
};

export type NormalizedProduct = {
  entity: "PRODUCT";
  externalId: string;
  label: string;
  name: string;
  handle: string;
  description: string | null;
  brand: string | null;
  productType: string | null;
  tags: string[];
  isActive: boolean;
  images: string[];
  collectionExternalIds: string[];
  /** Real options only (Shopify's single "Title / Default Title" is dropped). */
  options: { name: string; values: string[] }[];
  variants: NormalizedVariant[];
  weight: number | null;
  createdAt: Date | null;
};

export type NormalizedCustomer = {
  entity: "CUSTOMER";
  externalId: string;
  label: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  tags: string[];
  createdAt: Date | null;
};

export type NormalizedOrderLine = {
  productExternalId: string | null;
  variantExternalId: string | null;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type NormalizedOrder = {
  entity: "ORDER";
  externalId: string;
  label: string;
  /** Source order number, e.g. "#1001". */
  name: string;
  createdAt: Date;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";
  paymentStatus: string;
  paymentMethod: string;
  currencyCode: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  note: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerExternalId: string | null;
  lines: NormalizedOrderLine[];
};

export type NormalizedRecord =
  | NormalizedCollection
  | NormalizedProduct
  | NormalizedCustomer
  | NormalizedOrder;

// ─── Source (provider side) ──────────────────────────────────────────────────

export type SourcePage = { items: NormalizedRecord[]; nextCursor: string | null };

export interface ImportSource {
  provider: ImportProvider;
  /** Stable id of the external shop; part of every idempotency key. */
  externalShopId: string;
  count(entity: ImportableEntity): Promise<number | null>;
  fetchPage(entity: ImportableEntity, cursor: string | null): Promise<SourcePage>;
  /** Re-fetch specific records (retry of failed items). Missing ids are simply absent. */
  fetchByIds(entity: ImportableEntity, externalIds: string[]): Promise<NormalizedRecord[]>;
}

// ─── Sink (Kasho side) ───────────────────────────────────────────────────────

export type ApplyOutcome =
  /** Created a new Kasho record. */
  | { result: "imported" }
  /** Already imported before — refreshed from the source. */
  | { result: "updated" }
  /** Already imported before — intentionally left untouched (orders). */
  | { result: "unchanged" }
  /** Not importable by design (e.g. customer without phone). Not an error. */
  | { result: "skipped"; reason: SkipReason };

export type SkipReason = "NO_PHONE" | "EMPTY";

export interface ImportSink {
  /** Called once per slice before applying records (load caches, plan quota). */
  prepare?(): Promise<void>;
  apply(record: NormalizedRecord): Promise<ApplyOutcome>;
}

/** An item failure whose message is safe to show the merchant. */
export class ImportItemFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportItemFailure";
  }
}

// ─── Progress ────────────────────────────────────────────────────────────────

export type EntityProgress = {
  /** Source total (null until counted / when the source can't count). */
  total: number | null;
  processed: number;
  imported: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  skipReasons: Partial<Record<SkipReason, number>>;
  done: boolean;
};

export type ImportProgress = Partial<Record<ImportableEntity, EntityProgress>>;

/**
 * WooCommerce REST v3 objects → provider-agnostic Normalized* records. Pure.
 *
 * Mapping (WooCommerce → Casho):
 *   Product category          → Category ("Uncategorized" is left out)
 *   Simple / external product → Product (one implicit variant)
 *   Variable product          → Product + ProductVariant per enabled variation
 *   Variation attributes      → options (sizes / colors / attributes)
 *   Other attributes          → descriptive specs (Product.attributes)
 *   Brands (WooCommerce 9.6+) → Product.brand
 *   Customer                  → Customer (identified by phone in Casho)
 *   Order + line items        → Order + OrderItems (historical, no stock movement)
 *
 * Grouped products are containers of other products (which import on their
 * own), so the source skips them. Ids are WordPress post / user ids as strings.
 */
import type {
  NormalizedCollection,
  NormalizedCustomer,
  NormalizedOrder,
  NormalizedOrderLine,
  NormalizedProduct,
  NormalizedVariant,
} from "@/lib/integrations/import/types";
import { clean, decodeEntities, formatAddress, htmlToText, normalizePhone } from "@/lib/integrations/import/normalize";

// ─── API shapes (only the fields we read) ────────────────────────────────────

type WooImage = { id?: number; src?: string | null } | null;
type WooTerm = { id: number; name: string; slug?: string };

export type WooAttribute = { id?: number; name: string; visible?: boolean; variation?: boolean; options?: string[] };

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  date_created_gmt?: string | null;
  description?: string | null;
  short_description?: string | null;
  sku?: string | null;
  global_unique_id?: string | null;
  price?: string | null;
  regular_price?: string | null;
  sale_price?: string | null;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: string | null;
  weight?: string | null;
  categories?: WooTerm[];
  tags?: WooTerm[];
  brands?: WooTerm[];
  images?: WooImage[];
  attributes?: WooAttribute[];
  variations?: number[];
};

export type WooVariation = {
  id: number;
  status?: string;
  sku?: string | null;
  global_unique_id?: string | null;
  price?: string | null;
  regular_price?: string | null;
  sale_price?: string | null;
  manage_stock?: boolean | "parent";
  stock_quantity?: number | null;
  stock_status?: string | null;
  image?: WooImage;
  attributes?: { id?: number; name: string; option: string }[];
};

export type WooCategory = { id: number; name: string; slug: string; parent?: number; image?: WooImage };

export type WooAddress = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
} | null;

export type WooCustomer = {
  id: number;
  date_created_gmt?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  billing?: WooAddress;
  shipping?: WooAddress;
};

type WooMeta = { key?: string; value?: unknown; display_key?: string; display_value?: unknown };

export type WooLineItem = {
  name: string;
  product_id?: number | null;
  variation_id?: number | null;
  quantity: number;
  subtotal?: string | null;
  total?: string | null;
  sku?: string | null;
  meta_data?: WooMeta[];
};

export type WooOrder = {
  id: number;
  number?: string | null;
  status: string;
  currency?: string | null;
  date_created_gmt?: string | null;
  date_created?: string | null;
  date_paid_gmt?: string | null;
  discount_total?: string | null;
  shipping_total?: string | null;
  total?: string | null;
  total_tax?: string | null;
  customer_id?: number | null;
  customer_note?: string | null;
  billing?: WooAddress;
  shipping?: WooAddress;
  payment_method?: string | null;
  payment_method_title?: string | null;
  line_items?: WooLineItem[];
  coupon_lines?: { code?: string | null }[];
  fee_lines?: { name?: string | null; total?: string | null }[];
  refunds?: { total?: string | null }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function amount(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function optionalAmount(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** WordPress escapes titles / term names as HTML ("Men&#8217;s"). */
export function text(value: string | null | undefined): string {
  return value ? decodeEntities(value).replace(/<[^>]+>/g, "").trim() : "";
}

/** Non-Latin slugs come percent-encoded ("%d8%b9%d8%b7%d9%88%d8%b1"). */
export function decodeSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** WooCommerce "_gmt" dates are UTC without a zone suffix. */
export function gmtDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Store weight unit → kilograms (Casho's unit). */
export function toKg(weight: string | null | undefined, unit: string): number | null {
  const n = Number(weight);
  if (!weight || !Number.isFinite(n) || n <= 0) return null;
  const factor: Record<string, number> = { kg: 1, g: 0.001, lbs: 0.45359237, oz: 0.028349523125 };
  return Math.round(n * (factor[unit] ?? 1) * 1000) / 1000;
}

const UNCATEGORIZED = "uncategorized";

export function isDefaultCategory(c: Pick<WooCategory, "slug">) {
  return c.slug === UNCATEGORIZED;
}

/** WooCommerce's Egyptian governorate codes (i18n/states.php) → Arabic names. */
const EG_STATES: Record<string, string> = {
  EGALX: "الإسكندرية",
  EGASN: "أسوان",
  EGAST: "أسيوط",
  EGBA: "البحر الأحمر",
  EGBH: "البحيرة",
  EGBNS: "بني سويف",
  EGC: "القاهرة",
  EGDK: "الدقهلية",
  EGDT: "دمياط",
  EGFYM: "الفيوم",
  EGGH: "الغربية",
  EGGZ: "الجيزة",
  EGIS: "الإسماعيلية",
  EGJS: "جنوب سيناء",
  EGKB: "القليوبية",
  EGKFS: "كفر الشيخ",
  EGKN: "قنا",
  EGLX: "الأقصر",
  EGMN: "المنيا",
  EGMNF: "المنوفية",
  EGMT: "مطروح",
  EGPTS: "بورسعيد",
  EGSHG: "سوهاج",
  EGSHR: "الشرقية",
  EGSIN: "شمال سيناء",
  EGSUZ: "السويس",
  EGWAD: "الوادي الجديد",
};

export function formatWooAddress(address: WooAddress): string | null {
  if (!address) return null;
  const country = clean(address.country)?.toUpperCase() ?? null;
  const state = clean(address.state);
  const egypt = !country || country === "EG";
  return formatAddress({
    address1: address.address_1,
    address2: address.address_2,
    city: address.city,
    province: state && egypt ? (EG_STATES[state.toUpperCase()] ?? state) : state,
    country: country === "EG" ? "مصر" : country,
    zip: address.postcode,
  });
}

function hasAddress(address: WooAddress) {
  return !!(address && (clean(address.address_1) || clean(address.city)));
}

function personName(address: WooAddress) {
  return clean([text(address?.first_name), text(address?.last_name)].filter(Boolean).join(" "));
}

/** Stock of a WooCommerce item; null = sold without tracking (Casho gives it a large stock). */
function stockOf(manage: boolean | "parent" | undefined, quantity: number | null | undefined, status: string | null | undefined, parent?: WooProduct): number | null {
  if (manage === "parent" && parent) return stockOf(parent.manage_stock, parent.stock_quantity, parent.stock_status);
  if (manage === true) return Math.max(0, quantity ?? 0);
  return status === "outofstock" ? 0 : null;
}

/** Active price + the "was" price when a sale is running. */
function prices(item: { price?: string | null; regular_price?: string | null; sale_price?: string | null }) {
  const price = optionalAmount(item.price) ?? optionalAmount(item.sale_price) ?? optionalAmount(item.regular_price) ?? 0;
  const regular = optionalAmount(item.regular_price);
  return { price, compareAtPrice: regular !== null && regular > price ? regular : null };
}

const BRAND_ATTRIBUTE = /^(brand|brands|الماركة|ماركة|البراند|براند|العلامة التجارية)$/i;

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapCategory(c: WooCategory): NormalizedCollection {
  const name = text(c.name) || decodeSlug(c.slug);
  return {
    entity: "COLLECTION",
    externalId: String(c.id),
    label: name,
    name,
    handle: decodeSlug(c.slug),
    imageUrl: c.image?.src || null,
  };
}

export function mapVariation(v: WooVariation, parent: WooProduct): NormalizedVariant {
  const options = (v.attributes ?? [])
    .map((a) => ({ key: text(a.name), value: text(a.option) }))
    .filter((o) => o.key && o.value);
  return {
    externalId: String(v.id),
    title: options.map((o) => o.value).join(" / ") || text(parent.name),
    sku: clean(v.sku),
    barcode: clean(v.global_unique_id),
    ...prices(v),
    costPrice: null,
    stock: stockOf(v.manage_stock, v.stock_quantity, v.stock_status, parent),
    options,
    imageUrl: v.image?.src || null,
  };
}

/** `variations` = the product's variations (variable products only). */
export function mapProduct(p: WooProduct, variations: WooVariation[] = [], weightUnit = "kg"): NormalizedProduct {
  const name = text(p.name) || decodeSlug(p.slug) || String(p.id);
  const attributes = p.attributes ?? [];
  const variable = p.type === "variable";

  const brandAttribute = attributes.find((a) => !a.variation && BRAND_ATTRIBUTE.test(text(a.name)) && a.options?.length);
  const brand = clean(text(p.brands?.[0]?.name)) ?? (brandAttribute ? clean(text(brandAttribute.options![0])) : null);

  const options = variable
    ? attributes
        .filter((a) => a.variation)
        .map((a) => ({ name: text(a.name), values: (a.options ?? []).map(text).filter(Boolean) }))
        .filter((o) => o.name && o.values.length > 0)
    : [];
  const specs = attributes
    .filter((a) => !(variable && a.variation) && a.visible !== false && a !== brandAttribute)
    .map((a) => ({ key: text(a.name), value: (a.options ?? []).map(text).filter(Boolean).join("، ") }))
    .filter((s) => s.key && s.value);

  // Disabled variations (status "private") can't be bought — leave them out
  // unless that would leave nothing.
  const enabled = variations.filter((v) => v.status !== "private");
  const variants = variable && variations.length > 0
    ? (enabled.length > 0 ? enabled : variations).map((v) => mapVariation(v, p))
    : [
        {
          externalId: String(p.id),
          title: name,
          sku: clean(p.sku),
          barcode: clean(p.global_unique_id),
          ...prices(p),
          costPrice: null,
          stock: stockOf(p.manage_stock, p.stock_quantity, p.stock_status),
          options: [],
          imageUrl: null,
        },
      ];

  const short = htmlToText(p.short_description);
  const long = htmlToText(p.description);
  const description = [short, long !== short ? long : null].filter(Boolean).join("\n\n") || null;

  return {
    entity: "PRODUCT",
    externalId: String(p.id),
    label: name,
    name,
    handle: decodeSlug(p.slug),
    description,
    brand,
    productType: null,
    tags: (p.tags ?? []).map((t) => text(t.name)).filter(Boolean),
    isActive: p.status === "publish",
    images: [...new Set((p.images ?? []).map((i) => i?.src).filter((src): src is string => !!src))],
    collectionExternalIds: (p.categories ?? []).filter((c) => c.slug !== UNCATEGORIZED).map((c) => String(c.id)),
    options,
    specs,
    variants,
    weight: toKg(p.weight, weightUnit),
    createdAt: gmtDate(p.date_created_gmt),
  };
}

export function mapCustomer(c: WooCustomer): NormalizedCustomer {
  const name =
    clean([text(c.first_name), text(c.last_name)].filter(Boolean).join(" ")) ??
    personName(c.billing ?? null) ??
    personName(c.shipping ?? null) ??
    clean(c.username);
  const email = clean(c.email) ?? clean(c.billing?.email);
  const address = hasAddress(c.shipping ?? null) ? c.shipping! : (c.billing ?? null);
  return {
    entity: "CUSTOMER",
    externalId: String(c.id),
    label: name ?? email ?? String(c.id),
    name,
    email,
    phone: normalizePhone(c.billing?.phone) ?? normalizePhone(c.shipping?.phone),
    address: formatWooAddress(address),
    note: null,
    tags: [],
    createdAt: gmtDate(c.date_created_gmt),
  };
}

/** WooCommerce order status (+ payment) → Casho OrderStatus. */
export function mapOrderStatus(o: Pick<WooOrder, "status" | "date_paid_gmt">): NormalizedOrder["status"] {
  const status = o.status.replace(/^wc-/, "");
  switch (status) {
    case "completed":
    case "delivered":
      return "DELIVERED";
    case "shipped":
    case "shipping":
    case "out-for-delivery":
      return "SHIPPED";
    case "cancelled":
    case "refunded":
    case "failed":
    case "trash":
      return "CANCELED";
    case "processing":
      // Cash-on-delivery orders sit in "processing" unpaid — they're confirmed, not paid.
      return o.date_paid_gmt ? "PAID" : "PENDING";
    default:
      return "PENDING";
  }
}

export function mapPaymentStatus(o: Pick<WooOrder, "status" | "date_paid_gmt" | "refunds">): string {
  const status = o.status.replace(/^wc-/, "");
  if (status === "refunded") return "REFUNDED";
  if (status === "failed") return "FAILED";
  if ((o.refunds ?? []).length > 0) return "PARTIALLY_REFUNDED";
  if (o.date_paid_gmt) return "PAID";
  return "PENDING";
}

const FEE_LABEL = "رسوم";

/** WooCommerce gateway ids that have a Casho equivalent. */
const PAYMENT_METHODS: Record<string, string> = { cod: "cash_on_delivery" };

function lineOptions(meta: WooMeta[] | undefined): string | null {
  const parts = (meta ?? [])
    .filter((m) => m.key && !m.key.startsWith("_") && (typeof m.display_value === "string" || typeof m.display_value === "number"))
    .map((m) => {
      const key = text(m.display_key ?? m.key);
      const value = text(String(m.display_value));
      return key && value ? `${key}: ${value}` : null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join("، ").slice(0, 300) : null;
}

export function mapLineItem(line: WooLineItem): NormalizedOrderLine {
  const quantity = Math.max(1, Math.round(line.quantity || 1));
  const subtotal = amount(line.subtotal);
  const total = optionalAmount(line.total) ?? subtotal;
  return {
    productExternalId: line.product_id ? String(line.product_id) : null,
    variantExternalId: line.variation_id ? String(line.variation_id) : null,
    title: text(line.name) || "منتج",
    variantTitle: lineOptions(line.meta_data),
    sku: clean(line.sku),
    quantity,
    unitPrice: Math.round((subtotal / quantity) * 100) / 100,
    discount: Math.max(0, Math.round((subtotal - total) * 100) / 100),
  };
}

export function mapOrder(o: WooOrder): NormalizedOrder {
  const lines = (o.line_items ?? []).map(mapLineItem);
  const shipTo = hasAddress(o.shipping ?? null) ? o.shipping! : (o.billing ?? null);
  const number = clean(o.number) ?? String(o.id);
  const tax = amount(o.total_tax);
  const fees = (o.fee_lines ?? []).filter((f) => amount(f.total) !== 0);
  const extras = [
    tax > 0 ? `ضرائب: ${tax}` : null,
    ...fees.map((f) => `${text(f.name) || FEE_LABEL}: ${amount(f.total)}`),
  ].filter(Boolean);
  const note = [clean(o.customer_note), extras.length ? extras.join("، ") : null].filter(Boolean).join(" — ") || null;
  const gateway = clean(o.payment_method);

  return {
    entity: "ORDER",
    externalId: String(o.id),
    label: `#${number}`,
    name: `#${number}`,
    createdAt: gmtDate(o.date_created_gmt) ?? gmtDate(o.date_created) ?? new Date(0),
    status: mapOrderStatus(o),
    paymentStatus: mapPaymentStatus(o),
    paymentMethod: (gateway && PAYMENT_METHODS[gateway]) || clean(text(o.payment_method_title)) || gateway || "woocommerce",
    currencyCode: clean(o.currency),
    subtotal: Math.round((o.line_items ?? []).reduce((sum, l) => sum + amount(l.subtotal), 0) * 100) / 100,
    shipping: amount(o.shipping_total),
    discount: amount(o.discount_total),
    total: amount(o.total),
    couponCode: clean(o.coupon_lines?.[0]?.code),
    note,
    fullName: personName(shipTo) ?? personName(o.billing ?? null),
    phone: normalizePhone(o.billing?.phone) ?? normalizePhone(o.shipping?.phone),
    email: clean(o.billing?.email),
    address: formatWooAddress(shipTo),
    customerExternalId: o.customer_id ? String(o.customer_id) : null,
    lines,
  };
}

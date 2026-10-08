/**
 * Shopify GraphQL nodes → provider-agnostic Normalized* records. Pure functions.
 *
 * Mapping (Shopify → Kasho):
 *   Collection           → Category
 *   Product (+ media)    → Product (image + images, tags, vendor→brand)
 *   Product options      → Product.sizes / colors / attributes (storefront)
 *   ProductVariant       → ProductVariant (+ inventory, cost price)
 *   Customer             → Customer (identified by phone in Kasho)
 *   Order + LineItems    → Order + OrderItems (historical, no stock movement)
 */
import type {
  NormalizedCollection,
  NormalizedCustomer,
  NormalizedOrder,
  NormalizedOrderLine,
  NormalizedProduct,
  NormalizedVariant,
} from "@/lib/integrations/import/types";

type Money = { shopMoney: { amount: string } } | null | undefined;
type Image = { image?: { url: string } | null } | Record<string, never>;

export type ShopifyVariantNode = {
  id: string;
  title: string;
  sku: string | null;
  barcode?: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
  selectedOptions: { name: string; value: string }[];
  media?: { nodes: Image[] };
  inventoryItem?: { tracked: boolean; unitCost: { amount: string } | null } | null;
};

export type ShopifyProductNode = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string | null;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  status: "ACTIVE" | "ARCHIVED" | "DRAFT" | string;
  createdAt: string | null;
  options: { name: string; values: string[] }[];
  media?: { nodes: Image[] };
  collections?: { nodes: { id: string }[] };
  variants: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyVariantNode[] };
};

export type ShopifyCollectionNode = { id: string; title: string; handle: string; image: { url: string } | null };

type Address = {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
} | null;

export type ShopifyCustomerNode = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  note: string | null;
  tags: string[];
  createdAt: string | null;
  defaultEmailAddress: { emailAddress: string | null } | null;
  defaultPhoneNumber: { phoneNumber: string | null } | null;
  defaultAddress: Address;
};

export type ShopifyLineItemNode = {
  title: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  originalUnitPriceSet: Money;
  discountAllocations?: { allocatedAmountSet: Money }[];
  variant: { id: string } | null;
  product: { id: string } | null;
};

export type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currencyCode: string | null;
  email: string | null;
  phone: string | null;
  note: string | null;
  paymentGatewayNames: string[];
  discountCodes: string[];
  subtotalPriceSet: Money;
  totalShippingPriceSet: Money;
  totalDiscountsSet: Money;
  totalPriceSet: Money;
  customer: { id: string } | null;
  shippingAddress: Address;
  billingAddress: Address;
  lineItems: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyLineItemNode[] };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function money(value: Money | string | null | undefined): number {
  const raw = typeof value === "string" ? value : value?.shopMoney?.amount;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function optionalMoney(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/** Shopify descriptions are HTML; Kasho stores plain text with line breaks. */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/**
 * Kasho stores Egyptian numbers in local form (01xxxxxxxxx). Shopify stores
 * E.164 (+201xxxxxxxxx). Other countries keep their international form.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let phone = raw.replace(/[\s\-().]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (phone.startsWith("+20")) phone = `0${phone.slice(3)}`;
  else if (/^20(1\d{9})$/.test(phone)) phone = `0${phone.slice(2)}`;
  if (!/^\+?\d{6,15}$/.test(phone)) return null;
  return phone;
}

export function formatAddress(address: Address): string | null {
  if (!address) return null;
  const parts = [address.address1, address.address2, address.city, address.province, address.country, address.zip]
    .map(clean)
    .filter(Boolean);
  return parts.length > 0 ? parts.join("، ") : null;
}

function firstImage(nodes: Image[] | undefined) {
  for (const node of nodes ?? []) {
    const url = "image" in node ? node.image?.url : undefined;
    if (url) return url;
  }
  return null;
}

function allImages(nodes: Image[] | undefined) {
  return (nodes ?? []).map((n) => ("image" in n ? n.image?.url : undefined)).filter((u): u is string => !!u);
}

function isDefaultOption(options: { name: string; values: string[] }[]) {
  return options.length === 1 && options[0].name === "Title" && options[0].values.length <= 1 && options[0].values[0] === "Default Title";
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapCollection(node: ShopifyCollectionNode): NormalizedCollection {
  return {
    entity: "COLLECTION",
    externalId: node.id,
    label: node.title,
    name: node.title.trim() || node.handle,
    handle: node.handle,
    imageUrl: node.image?.url ?? null,
  };
}

export function mapVariant(node: ShopifyVariantNode): NormalizedVariant {
  const tracked = node.inventoryItem?.tracked ?? true;
  return {
    externalId: node.id,
    title: node.title,
    sku: clean(node.sku),
    barcode: clean(node.barcode),
    price: money(node.price),
    compareAtPrice: optionalMoney(node.compareAtPrice),
    costPrice: optionalMoney(node.inventoryItem?.unitCost?.amount),
    stock: tracked ? (node.inventoryQuantity ?? 0) : null,
    options: node.selectedOptions
      .filter((o) => !(o.name === "Title" && o.value === "Default Title"))
      .map((o) => ({ key: o.name, value: o.value })),
    imageUrl: firstImage(node.media?.nodes),
  };
}

/** `extraVariants` = variants fetched beyond the first page of the product. */
export function mapProduct(node: ShopifyProductNode, extraVariants: ShopifyVariantNode[] = []): NormalizedProduct {
  const options = isDefaultOption(node.options)
    ? []
    : node.options.map((o) => ({ name: o.name, values: o.values })).filter((o) => o.values.length > 0);
  return {
    entity: "PRODUCT",
    externalId: node.id,
    label: node.title,
    name: node.title.trim(),
    handle: node.handle,
    description: htmlToText(node.descriptionHtml),
    brand: clean(node.vendor),
    productType: clean(node.productType),
    tags: node.tags.map((t) => t.trim()).filter(Boolean),
    isActive: node.status === "ACTIVE",
    images: allImages(node.media?.nodes),
    collectionExternalIds: node.collections?.nodes.map((c) => c.id) ?? [],
    options,
    variants: [...node.variants.nodes, ...extraVariants].map(mapVariant),
    weight: null,
    createdAt: node.createdAt ? new Date(node.createdAt) : null,
  };
}

export function mapCustomer(node: ShopifyCustomerNode): NormalizedCustomer {
  const name =
    clean([node.firstName, node.lastName].filter(Boolean).join(" ")) ?? clean(node.displayName);
  const phone = normalizePhone(node.defaultPhoneNumber?.phoneNumber) ?? normalizePhone(node.defaultAddress?.phone);
  const email = clean(node.defaultEmailAddress?.emailAddress);
  return {
    entity: "CUSTOMER",
    externalId: node.id,
    label: name ?? email ?? node.id.split("/").pop() ?? node.id,
    name,
    email,
    phone,
    address: formatAddress(node.defaultAddress),
    note: clean(node.note),
    tags: node.tags.map((t) => t.trim()).filter(Boolean),
    createdAt: node.createdAt ? new Date(node.createdAt) : null,
  };
}

const PAID_STATUSES = new Set(["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"]);

/** Shopify financial + fulfillment status → Kasho OrderStatus. */
export function mapOrderStatus(node: Pick<ShopifyOrderNode, "cancelledAt" | "displayFinancialStatus" | "displayFulfillmentStatus">): NormalizedOrder["status"] {
  if (node.cancelledAt) return "CANCELED";
  const financial = node.displayFinancialStatus ?? "";
  if (financial === "REFUNDED" || financial === "VOIDED") return "CANCELED";
  const fulfillment = node.displayFulfillmentStatus ?? "";
  // Fulfilled orders are history by the time they are migrated.
  if (fulfillment === "FULFILLED") return "DELIVERED";
  if (fulfillment === "PARTIALLY_FULFILLED" || fulfillment === "IN_PROGRESS") return "SHIPPED";
  if (PAID_STATUSES.has(financial)) return "PAID";
  return "PENDING";
}

export function mapPaymentStatus(financial: string | null): string {
  if (!financial) return "PENDING";
  if (financial === "PAID") return "PAID";
  if (financial === "AUTHORIZED" || financial === "PENDING" || financial === "EXPIRED") return "PENDING";
  return financial; // PARTIALLY_PAID, REFUNDED, PARTIALLY_REFUNDED, VOIDED
}

export function mapLineItem(node: ShopifyLineItemNode): NormalizedOrderLine {
  const discount = (node.discountAllocations ?? []).reduce((sum, d) => sum + money(d.allocatedAmountSet), 0);
  return {
    productExternalId: node.product?.id ?? null,
    variantExternalId: node.variant?.id ?? null,
    title: node.title,
    variantTitle: clean(node.variantTitle),
    sku: clean(node.sku),
    quantity: node.quantity,
    unitPrice: money(node.originalUnitPriceSet),
    discount,
  };
}

export function mapOrder(node: ShopifyOrderNode, extraLines: ShopifyLineItemNode[] = []): NormalizedOrder {
  const address = node.shippingAddress ?? node.billingAddress;
  const phone = normalizePhone(node.phone) ?? normalizePhone(node.shippingAddress?.phone) ?? normalizePhone(node.billingAddress?.phone);
  return {
    entity: "ORDER",
    externalId: node.id,
    label: node.name,
    name: node.name,
    createdAt: new Date(node.createdAt),
    status: mapOrderStatus(node),
    paymentStatus: mapPaymentStatus(node.displayFinancialStatus),
    paymentMethod: node.paymentGatewayNames[0] ?? "shopify",
    currencyCode: node.currencyCode,
    subtotal: money(node.subtotalPriceSet),
    shipping: money(node.totalShippingPriceSet),
    discount: money(node.totalDiscountsSet),
    total: money(node.totalPriceSet),
    couponCode: node.discountCodes[0] ?? null,
    note: clean(node.note),
    fullName: clean(address?.name),
    phone,
    email: clean(node.email),
    address: formatAddress(address),
    customerExternalId: node.customer?.id ?? null,
    lines: [...node.lineItems.nodes, ...extraLines].map(mapLineItem),
  };
}

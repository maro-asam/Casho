import { describe, it, expect } from "vitest";
import { buildProductFields } from "@/lib/integrations/import/kasho-fields";
import {
  formatWooAddress,
  gmtDate,
  mapCategory,
  mapCustomer,
  mapLineItem,
  mapOrder,
  mapOrderStatus,
  mapPaymentStatus,
  mapProduct,
  toKg,
  type WooOrder,
  type WooProduct,
  type WooVariation,
} from "./mappers";

const simple: WooProduct = {
  id: 10,
  name: "Men&#8217;s Shirt &amp; Tie",
  slug: "%d9%82%d9%85%d9%8a%d8%b5",
  type: "simple",
  status: "publish",
  date_created_gmt: "2025-01-05T10:00:00",
  description: "<p>Soft <strong>cotton</strong></p>",
  short_description: "<p>Best seller</p>",
  sku: "SH-1",
  global_unique_id: "6223000000001",
  price: "150",
  regular_price: "200",
  sale_price: "150",
  manage_stock: true,
  stock_quantity: 7,
  stock_status: "instock",
  weight: "500",
  categories: [
    { id: 15, name: "Uncategorized", slug: "uncategorized" },
    { id: 21, name: "Shirts", slug: "shirts" },
  ],
  tags: [{ id: 1, name: "Summer" }],
  brands: [{ id: 3, name: "Acme" }],
  images: [{ src: "https://acme.com/a.jpg" }, { src: "https://acme.com/b.jpg" }, { src: "https://acme.com/a.jpg" }],
  attributes: [
    { name: "Material", visible: true, variation: false, options: ["Cotton", "Linen"] },
    { name: "Internal", visible: false, variation: false, options: ["x"] },
  ],
  variations: [],
};

const variable: WooProduct = {
  ...simple,
  id: 20,
  name: "Tee",
  slug: "tee",
  type: "variable",
  sku: "",
  price: "100",
  regular_price: "",
  sale_price: "",
  manage_stock: true,
  stock_quantity: 12,
  brands: [],
  attributes: [
    { name: "Size", variation: true, options: ["S", "M"] },
    { name: "Color", variation: true, options: ["Red"] },
    { name: "Brand", variation: false, visible: true, options: ["Nike"] },
  ],
  variations: [21, 22, 23],
};

const variations: WooVariation[] = [
  { id: 21, status: "publish", sku: "T-S", price: "100", regular_price: "120", sale_price: "100", manage_stock: true, stock_quantity: 3, stock_status: "instock", image: { src: "https://acme.com/s.jpg" }, attributes: [{ name: "Size", option: "S" }, { name: "Color", option: "Red" }] },
  { id: 22, status: "publish", sku: "T-M", price: "110", regular_price: "110", sale_price: "", manage_stock: "parent", stock_quantity: null, stock_status: "instock", image: null, attributes: [{ name: "Size", option: "M" }, { name: "Color", option: "Red" }] },
  { id: 23, status: "private", sku: "T-L", price: "120", regular_price: "120", manage_stock: false, stock_status: "instock", attributes: [{ name: "Size", option: "L" }] },
];

describe("mapProduct (simple)", () => {
  const p = mapProduct(simple, [], "g");

  it("decodes names, slugs and descriptions", () => {
    expect(p.name).toBe("Men’s Shirt & Tie");
    expect(p.handle).toBe("قميص");
    expect(p.description).toBe("Best seller\n\nSoft cotton");
  });

  it("keeps the sale price and the regular one as compare-at", () => {
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0]).toMatchObject({ externalId: "10", price: 150, compareAtPrice: 200, sku: "SH-1", barcode: "6223000000001", stock: 7 });
  });

  it("drops Uncategorized, dedupes images, converts weight, reads the brand", () => {
    expect(p.collectionExternalIds).toEqual(["21"]);
    expect(p.images).toEqual(["https://acme.com/a.jpg", "https://acme.com/b.jpg"]);
    expect(p.weight).toBe(0.5);
    expect(p.brand).toBe("Acme");
    expect(p.isActive).toBe(true);
    expect(p.createdAt?.toISOString()).toBe("2025-01-05T10:00:00.000Z");
  });

  it("descriptive attributes become specs (hidden ones stay hidden)", () => {
    expect(p.options).toEqual([]);
    expect(p.specs).toEqual([{ key: "Material", value: "Cotton، Linen" }]);
    const fields = buildProductFields(p);
    expect(fields.attributes).toEqual([{ key: "Material", value: "Cotton، Linen" }]);
    expect(fields.hasVariants).toBe(false);
  });

  it("stock rules: tracked, untracked, out of stock", () => {
    expect(mapProduct({ ...simple, manage_stock: false, stock_status: "instock" }).variants[0].stock).toBeNull();
    expect(mapProduct({ ...simple, manage_stock: false, stock_status: "onbackorder" }).variants[0].stock).toBeNull();
    expect(mapProduct({ ...simple, manage_stock: false, stock_status: "outofstock" }).variants[0].stock).toBe(0);
    expect(mapProduct({ ...simple, manage_stock: true, stock_quantity: -4 }).variants[0].stock).toBe(0);
  });

  it("drafts and private products import inactive", () => {
    expect(mapProduct({ ...simple, status: "draft" }).isActive).toBe(false);
    expect(mapProduct({ ...simple, status: "private" }).isActive).toBe(false);
  });

  it("no sale running → no compare-at price", () => {
    expect(mapProduct({ ...simple, price: "200", sale_price: "", regular_price: "200" }).variants[0].compareAtPrice).toBeNull();
  });
});

describe("mapProduct (variable)", () => {
  const p = mapProduct(variable, variations);

  it("variation attributes become options, the brand attribute becomes the brand", () => {
    expect(p.options).toEqual([
      { name: "Size", values: ["S", "M"] },
      { name: "Color", values: ["Red"] },
    ]);
    expect(p.brand).toBe("Nike");
    expect(p.specs).toEqual([]);
  });

  it("enabled variations only, with parent-managed stock", () => {
    expect(p.variants.map((v) => v.externalId)).toEqual(["21", "22"]);
    expect(p.variants[0]).toMatchObject({ title: "S / Red", price: 100, compareAtPrice: 120, stock: 3, imageUrl: "https://acme.com/s.jpg", options: [{ key: "Size", value: "S" }, { key: "Color", value: "Red" }] });
    expect(p.variants[1]).toMatchObject({ title: "M / Red", price: 110, compareAtPrice: null, stock: 12 });
  });

  it("feeds Casho variants, sizes and colors", () => {
    const fields = buildProductFields(p);
    expect(fields).toMatchObject({ hasVariants: true, price: 100, compareAtPrice: 120, sizes: ["S", "M"], colors: ["Red"], stock: 15 });
  });

  it("a variable product whose variations are all disabled keeps them rather than nothing", () => {
    expect(mapProduct(variable, [variations[2]]).variants.map((v) => v.externalId)).toEqual(["23"]);
  });
});

describe("mapCategory / mapCustomer", () => {
  it("category", () => {
    expect(mapCategory({ id: 5, name: "T-Shirts &amp; Tops", slug: "t-shirts", image: { src: "https://acme.com/c.jpg" } })).toEqual({
      entity: "COLLECTION",
      externalId: "5",
      label: "T-Shirts & Tops",
      name: "T-Shirts & Tops",
      handle: "t-shirts",
      imageUrl: "https://acme.com/c.jpg",
    });
  });

  it("customer: phone from billing, Egyptian governorate in Arabic", () => {
    const c = mapCustomer({
      id: 9,
      email: "mona@example.com",
      first_name: "Mona",
      last_name: "Ali",
      billing: { phone: "+20 100 123 4567", address_1: "12 Tahrir St", city: "Dokki", state: "EGGZ", country: "EG" },
      shipping: { address_1: "" },
    });
    expect(c).toMatchObject({ externalId: "9", name: "Mona Ali", email: "mona@example.com", phone: "01001234567", address: "12 Tahrir St، Dokki، الجيزة، مصر" });
  });

  it("customer: falls back to billing name and username; Arabic digits in the phone", () => {
    const c = mapCustomer({ id: 3, username: "mona88", billing: { phone: "٠١٠٠١٢٣٤٥٦٧" } });
    expect(c.name).toBe("mona88");
    expect(c.phone).toBe("01001234567");
    expect(mapCustomer({ id: 4, billing: { first_name: "Sara" } }).name).toBe("Sara");
  });

  it("foreign addresses keep their state code", () => {
    expect(formatWooAddress({ address_1: "1 Main", city: "Dubai", state: "DU", country: "AE" })).toBe("1 Main، Dubai، DU، AE");
  });
});

describe("orders", () => {
  const order: WooOrder = {
    id: 501,
    number: "1042",
    status: "processing",
    currency: "EGP",
    date_created_gmt: "2025-03-01T12:00:00",
    date_paid_gmt: null,
    discount_total: "20.00",
    shipping_total: "50.00",
    total: "330.00",
    total_tax: "0.00",
    customer_id: 9,
    customer_note: "Call first",
    billing: { first_name: "Mona", last_name: "Ali", phone: "01001234567", email: "mona@example.com", address_1: "Billing st" },
    shipping: { first_name: "Mona", last_name: "Ali", address_1: "12 Tahrir St", city: "Cairo", state: "EGC", country: "EG" },
    payment_method: "cod",
    payment_method_title: "Cash on delivery",
    line_items: [
      { name: "Tee - M, Red", product_id: 20, variation_id: 22, quantity: 2, subtotal: "200.00", total: "180.00", sku: "T-M", meta_data: [{ key: "pa_size", display_key: "Size", display_value: "M" }, { key: "_reduced_stock", display_key: "_reduced_stock", display_value: "2" }] },
      { name: "Old item", product_id: 0, variation_id: 0, quantity: 1, subtotal: "100.00", total: "100.00" },
    ],
    coupon_lines: [{ code: "SAVE20" }],
    fee_lines: [],
    refunds: [],
  };

  it("maps totals, customer, address and lines", () => {
    const o = mapOrder(order);
    expect(o).toMatchObject({
      externalId: "501",
      name: "#1042",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "cash_on_delivery",
      subtotal: 300,
      shipping: 50,
      discount: 20,
      total: 330,
      couponCode: "SAVE20",
      note: "Call first",
      fullName: "Mona Ali",
      phone: "01001234567",
      email: "mona@example.com",
      address: "12 Tahrir St، Cairo، القاهرة، مصر",
      customerExternalId: "9",
    });
    expect(o.createdAt.toISOString()).toBe("2025-03-01T12:00:00.000Z");
    expect(o.lines[0]).toEqual({ productExternalId: "20", variantExternalId: "22", title: "Tee - M, Red", variantTitle: "Size: M", sku: "T-M", quantity: 2, unitPrice: 100, discount: 20 });
    expect(o.lines[1]).toMatchObject({ productExternalId: null, variantExternalId: null, discount: 0 });
  });

  it("guest orders have no customer; taxes and fees go to the note", () => {
    const o = mapOrder({ ...order, customer_id: 0, total_tax: "14.00", fee_lines: [{ name: "Gift wrap", total: "10" }], customer_note: "" });
    expect(o.customerExternalId).toBeNull();
    expect(o.note).toBe("ضرائب: 14، Gift wrap: 10");
  });

  it.each([
    [{ status: "completed", date_paid_gmt: "2025-01-01T00:00:00" }, "DELIVERED"],
    [{ status: "processing", date_paid_gmt: "2025-01-01T00:00:00" }, "PAID"],
    [{ status: "processing", date_paid_gmt: null }, "PENDING"],
    [{ status: "on-hold", date_paid_gmt: null }, "PENDING"],
    [{ status: "pending", date_paid_gmt: null }, "PENDING"],
    [{ status: "cancelled", date_paid_gmt: null }, "CANCELED"],
    [{ status: "refunded", date_paid_gmt: "2025-01-01T00:00:00" }, "CANCELED"],
    [{ status: "failed", date_paid_gmt: null }, "CANCELED"],
    [{ status: "wc-shipped", date_paid_gmt: null }, "SHIPPED"],
    [{ status: "custom-status", date_paid_gmt: null }, "PENDING"],
  ])("status %o → %s", (input, expected) => {
    expect(mapOrderStatus(input)).toBe(expected);
  });

  it("payment status", () => {
    expect(mapPaymentStatus({ status: "completed", date_paid_gmt: "2025-01-01T00:00:00" })).toBe("PAID");
    expect(mapPaymentStatus({ status: "completed", date_paid_gmt: "2025-01-01T00:00:00", refunds: [{ total: "-10" }] })).toBe("PARTIALLY_REFUNDED");
    expect(mapPaymentStatus({ status: "refunded", date_paid_gmt: "2025-01-01T00:00:00" })).toBe("REFUNDED");
    expect(mapPaymentStatus({ status: "failed", date_paid_gmt: null })).toBe("FAILED");
    expect(mapPaymentStatus({ status: "processing", date_paid_gmt: null })).toBe("PENDING");
  });

  it("other gateways keep their title", () => {
    expect(mapOrder({ ...order, payment_method: "paymob", payment_method_title: "Card (Paymob)" }).paymentMethod).toBe("Card (Paymob)");
    expect(mapOrder({ ...order, payment_method: "", payment_method_title: "" }).paymentMethod).toBe("woocommerce");
  });

  it("line items never divide by zero", () => {
    expect(mapLineItem({ name: "x", quantity: 0, subtotal: "50" })).toMatchObject({ quantity: 1, unitPrice: 50, discount: 0 });
  });
});

describe("helpers", () => {
  it("gmtDate treats zone-less values as UTC and rejects junk", () => {
    expect(gmtDate("2025-01-01T00:00:00")?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(gmtDate("2025-01-01T02:00:00+02:00")?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(gmtDate("nope")).toBeNull();
    expect(gmtDate(null)).toBeNull();
  });

  it("toKg", () => {
    expect(toKg("2", "kg")).toBe(2);
    expect(toKg("250", "g")).toBe(0.25);
    expect(toKg("1", "lbs")).toBe(0.454);
    expect(toKg("", "kg")).toBeNull();
    expect(toKg("0", "kg")).toBeNull();
  });
});

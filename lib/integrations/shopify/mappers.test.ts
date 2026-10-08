import { describe, it, expect } from "vitest";
import { htmlToText, mapCustomer, mapOrder, mapOrderStatus, mapProduct, normalizePhone, type ShopifyOrderNode, type ShopifyProductNode } from "./mappers";
import { buildProductFields, orderLineFeatures, toPiasters, UNTRACKED_STOCK_QTY } from "@/lib/integrations/import/kasho-fields";

const PRODUCT: ShopifyProductNode = {
  id: "gid://shopify/Product/1",
  title: "تيشيرت قطن",
  handle: "cotton-tee",
  descriptionHtml: "<p>قطن 100%</p><ul><li>مريح</li></ul>",
  vendor: "Acme",
  productType: "Tops",
  tags: ["summer", " sale "],
  status: "ACTIVE",
  createdAt: "2025-01-02T10:00:00Z",
  options: [
    { name: "Size", values: ["S", "M"] },
    { name: "Color", values: ["Red"] },
    { name: "Material", values: ["Cotton", "Linen"] },
  ],
  media: { nodes: [{ image: { url: "https://cdn.shopify.com/a.jpg" } }, { image: { url: "https://cdn.shopify.com/b.jpg" } }] },
  collections: { nodes: [{ id: "gid://shopify/Collection/7" }] },
  variants: {
    pageInfo: { hasNextPage: false, endCursor: null },
    nodes: [
      {
        id: "gid://shopify/ProductVariant/11",
        title: "S / Red",
        sku: "TEE-S",
        barcode: "123",
        price: "250.00",
        compareAtPrice: "300.00",
        inventoryQuantity: 4,
        selectedOptions: [{ name: "Size", value: "S" }, { name: "Color", value: "Red" }],
        inventoryItem: { tracked: true, unitCost: { amount: "120.00" } },
      },
      {
        id: "gid://shopify/ProductVariant/12",
        title: "M / Red",
        sku: "TEE-M",
        price: "260.00",
        compareAtPrice: null,
        inventoryQuantity: -2,
        selectedOptions: [{ name: "Size", value: "M" }, { name: "Color", value: "Red" }],
        inventoryItem: { tracked: true, unitCost: null },
      },
    ],
  },
};

describe("product import mapping", () => {
  it("maps a product with variants, images, inventory and options", () => {
    const p = mapProduct(PRODUCT);
    expect(p).toMatchObject({
      externalId: "gid://shopify/Product/1",
      name: "تيشيرت قطن",
      brand: "Acme",
      tags: ["summer", "sale"],
      isActive: true,
      images: ["https://cdn.shopify.com/a.jpg", "https://cdn.shopify.com/b.jpg"],
      collectionExternalIds: ["gid://shopify/Collection/7"],
    });
    expect(p.description).toBe("قطن 100%\n• مريح");
    expect(p.variants[0]).toMatchObject({ sku: "TEE-S", price: 250, compareAtPrice: 300, costPrice: 120, stock: 4 });

    const fields = buildProductFields(p);
    expect(fields).toMatchObject({
      price: 250,
      compareAtPrice: 300,
      image: "https://cdn.shopify.com/a.jpg",
      sizes: ["S", "M"],
      colors: ["Red"],
      attributes: [{ key: "Material", value: "Cotton، Linen" }],
      hasVariants: true,
      stock: 4, // negative inventory never becomes negative stock
      sku: null, // per-variant SKUs live on the variants
    });
  });

  it("drops Shopify's default option and keeps single-variant SKU on the product", () => {
    const simple = mapProduct({
      ...PRODUCT,
      options: [{ name: "Title", values: ["Default Title"] }],
      variants: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [{ ...PRODUCT.variants.nodes[0], title: "Default Title", selectedOptions: [{ name: "Title", value: "Default Title" }] }],
      },
    });
    expect(simple.options).toEqual([]);
    expect(simple.variants[0].options).toEqual([]);
    const fields = buildProductFields(simple);
    expect(fields).toMatchObject({ hasVariants: false, sku: "TEE-S", barcode: "123" });
  });

  it("untracked inventory gets the documented default stock", () => {
    const p = mapProduct({
      ...PRODUCT,
      variants: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ ...PRODUCT.variants.nodes[0], inventoryItem: { tracked: false, unitCost: null } }] },
    });
    expect(p.variants[0].stock).toBeNull();
    expect(buildProductFields(p).stock).toBe(UNTRACKED_STOCK_QTY);
  });

  it("draft/archived products are imported hidden", () => {
    expect(mapProduct({ ...PRODUCT, status: "DRAFT" }).isActive).toBe(false);
  });
});

describe("customer import mapping", () => {
  it("maps contact data and converts Egyptian E.164 phones to local form", () => {
    const c = mapCustomer({
      id: "gid://shopify/Customer/5",
      firstName: "Mona",
      lastName: "Ali",
      displayName: "Mona Ali",
      note: "VIP",
      tags: ["vip"],
      createdAt: "2024-05-01T00:00:00Z",
      defaultEmailAddress: { emailAddress: "mona@example.com" },
      defaultPhoneNumber: { phoneNumber: "+201001234567" },
      defaultAddress: { address1: "1 Nile St", city: "Cairo", country: "Egypt", phone: null },
    });
    expect(c).toMatchObject({ name: "Mona Ali", email: "mona@example.com", phone: "01001234567", address: "1 Nile St، Cairo، Egypt", tags: ["vip"] });
  });

  it("falls back to the address phone, and has no phone when there is none", () => {
    const base = {
      id: "gid://shopify/Customer/6",
      firstName: null,
      lastName: null,
      displayName: "Guest",
      note: null,
      tags: [],
      createdAt: null,
      defaultEmailAddress: null,
      defaultPhoneNumber: null,
    };
    expect(mapCustomer({ ...base, defaultAddress: { phone: "+44 7700 900123" } }).phone).toBe("+447700900123");
    expect(mapCustomer({ ...base, defaultAddress: null }).phone).toBeNull();
  });

  it.each([
    ["+20 100 123 4567", "01001234567"],
    ["00201001234567", "01001234567"],
    ["201001234567", "01001234567"],
    ["01001234567", "01001234567"],
    ["abc", null],
  ])("normalizePhone(%s) → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

const ORDER: ShopifyOrderNode = {
  id: "gid://shopify/Order/100",
  name: "#1001",
  createdAt: "2025-03-01T12:00:00Z",
  cancelledAt: null,
  displayFinancialStatus: "PAID",
  displayFulfillmentStatus: "FULFILLED",
  currencyCode: "EGP",
  email: "mona@example.com",
  phone: null,
  note: "Leave at door",
  paymentGatewayNames: ["Cash on Delivery (COD)"],
  discountCodes: ["SAVE10"],
  subtotalPriceSet: { shopMoney: { amount: "500.00" } },
  totalShippingPriceSet: { shopMoney: { amount: "50.00" } },
  totalDiscountsSet: { shopMoney: { amount: "50.00" } },
  totalPriceSet: { shopMoney: { amount: "500.00" } },
  customer: { id: "gid://shopify/Customer/5" },
  shippingAddress: { name: "Mona Ali", address1: "1 Nile St", city: "Cairo", phone: "+201001234567" },
  billingAddress: null,
  lineItems: {
    pageInfo: { hasNextPage: false, endCursor: null },
    nodes: [
      {
        title: "تيشيرت قطن",
        variantTitle: "S / Red",
        sku: "TEE-S",
        quantity: 2,
        originalUnitPriceSet: { shopMoney: { amount: "250.00" } },
        discountAllocations: [{ allocatedAmountSet: { shopMoney: { amount: "50.00" } } }],
        variant: { id: "gid://shopify/ProductVariant/11" },
        product: { id: "gid://shopify/Product/1" },
      },
    ],
  },
};

describe("order import mapping", () => {
  it("maps totals, customer link, address and line items", () => {
    const o = mapOrder(ORDER);
    expect(o).toMatchObject({
      name: "#1001",
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "Cash on Delivery (COD)",
      subtotal: 500,
      shipping: 50,
      discount: 50,
      total: 500,
      couponCode: "SAVE10",
      fullName: "Mona Ali",
      phone: "01001234567",
      customerExternalId: "gid://shopify/Customer/5",
    });
    expect(o.lines[0]).toMatchObject({ productExternalId: "gid://shopify/Product/1", quantity: 2, unitPrice: 250, discount: 50 });
    expect(toPiasters(o.total)).toBe(50000);
    expect(orderLineFeatures(o.lines[0], true)).toEqual({ النوع: "S / Red", SKU: "TEE-S" });
    expect(orderLineFeatures(o.lines[0], false)).toMatchObject({ المنتج: "تيشيرت قطن" });
  });

  it("maps statuses conservatively", () => {
    const s = (over: Partial<ShopifyOrderNode>) => mapOrderStatus({ ...ORDER, ...over });
    expect(s({ cancelledAt: "2025-03-02T00:00:00Z" })).toBe("CANCELED");
    expect(s({ displayFinancialStatus: "REFUNDED", displayFulfillmentStatus: "UNFULFILLED" })).toBe("CANCELED");
    expect(s({ displayFulfillmentStatus: "PARTIALLY_FULFILLED" })).toBe("SHIPPED");
    expect(s({ displayFulfillmentStatus: "UNFULFILLED" })).toBe("PAID");
    expect(s({ displayFulfillmentStatus: "UNFULFILLED", displayFinancialStatus: "PENDING" })).toBe("PENDING");
  });
});

describe("htmlToText", () => {
  it("strips tags and scripts and decodes entities", () => {
    expect(htmlToText("<script>alert(1)</script><p>A &amp; B</p><br>C")).toBe("A & B\n\nC");
    expect(htmlToText("")).toBeNull();
  });
});

/**
 * GraphQL documents for the Shopify import. Page sizes keep every query well
 * under Shopify's 1,000-point single-query cost limit; nested connections that
 * overflow (variants, line items) are fetched with the follow-up queries below.
 */

export const PAGE_SIZES = {
  COLLECTION: 50,
  PRODUCT: 10,
  CUSTOMER: 50,
  ORDER: 10,
} as const;

const IMAGE = `... on MediaImage { image { url } }`;

export const VARIANT_FIELDS = `
fragment VariantFields on ProductVariant {
  id
  title
  sku
  barcode
  price
  compareAtPrice
  inventoryQuantity
  selectedOptions { name value }
  media(first: 1) { nodes { ${IMAGE} } }
  inventoryItem { tracked unitCost { amount } }
}`;

export const PRODUCT_FIELDS = `
fragment ProductFields on Product {
  id
  title
  handle
  descriptionHtml
  vendor
  productType
  tags
  status
  createdAt
  options { name values }
  media(first: 10) { nodes { ${IMAGE} } }
  collections(first: 5) { nodes { id } }
  variants(first: 30) { pageInfo { hasNextPage endCursor } nodes { ...VariantFields } }
}
${VARIANT_FIELDS}`;

export const COLLECTION_FIELDS = `
fragment CollectionFields on Collection {
  id
  title
  handle
  image { url }
}`;

export const CUSTOMER_FIELDS = `
fragment CustomerFields on Customer {
  id
  firstName
  lastName
  displayName
  note
  tags
  createdAt
  defaultEmailAddress { emailAddress }
  defaultPhoneNumber { phoneNumber }
  defaultAddress { address1 address2 city province country zip phone }
}`;

const ADDRESS = `name address1 address2 city province country zip phone`;

export const LINE_ITEM_FIELDS = `
fragment LineItemFields on LineItem {
  title
  variantTitle
  sku
  quantity
  originalUnitPriceSet { shopMoney { amount } }
  discountAllocations { allocatedAmountSet { shopMoney { amount } } }
  variant { id }
  product { id }
}`;

export const ORDER_FIELDS = `
fragment OrderFields on Order {
  id
  name
  createdAt
  cancelledAt
  displayFinancialStatus
  displayFulfillmentStatus
  currencyCode
  email
  phone
  note
  paymentGatewayNames
  discountCodes
  subtotalPriceSet { shopMoney { amount } }
  totalShippingPriceSet { shopMoney { amount } }
  totalDiscountsSet { shopMoney { amount } }
  totalPriceSet { shopMoney { amount } }
  customer { id }
  shippingAddress { ${ADDRESS} }
  billingAddress { ${ADDRESS} }
  lineItems(first: 20) { pageInfo { hasNextPage endCursor } nodes { ...LineItemFields } }
}
${LINE_ITEM_FIELDS}`;

const PAGE_INFO = `pageInfo { hasNextPage endCursor }`;

export const LIST_QUERIES = {
  COLLECTION: `query ImportCollections($first: Int!, $after: String, $query: String) {
    collections(first: $first, after: $after, sortKey: ID, query: $query) { ${PAGE_INFO} nodes { ...CollectionFields } }
  }
  ${COLLECTION_FIELDS}`,
  PRODUCT: `query ImportProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, sortKey: ID, query: $query) { ${PAGE_INFO} nodes { ...ProductFields } }
  }
  ${PRODUCT_FIELDS}`,
  CUSTOMER: `query ImportCustomers($first: Int!, $after: String, $query: String) {
    customers(first: $first, after: $after, sortKey: ID, query: $query) { ${PAGE_INFO} nodes { ...CustomerFields } }
  }
  ${CUSTOMER_FIELDS}`,
  ORDER: `query ImportOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, sortKey: ID, query: $query) { ${PAGE_INFO} nodes { ...OrderFields } }
  }
  ${ORDER_FIELDS}`,
} as const;

export const LIST_ROOT_FIELD = {
  COLLECTION: "collections",
  PRODUCT: "products",
  CUSTOMER: "customers",
  ORDER: "orders",
} as const;

export const NODES_QUERY = `query ImportNodes($ids: [ID!]!) {
  nodes(ids: $ids) {
    __typename
    ... on Collection { ...CollectionFields }
    ... on Product { ...ProductFields }
    ... on Customer { ...CustomerFields }
    ... on Order { ...OrderFields }
  }
}
${COLLECTION_FIELDS}
${PRODUCT_FIELDS}
${CUSTOMER_FIELDS}
${ORDER_FIELDS}`;

export const MORE_VARIANTS_QUERY = `query ImportMoreVariants($id: ID!, $after: String) {
  product(id: $id) { variants(first: 100, after: $after) { ${PAGE_INFO} nodes { ...VariantFields } } }
}
${VARIANT_FIELDS}`;

export const MORE_LINE_ITEMS_QUERY = `query ImportMoreLineItems($id: ID!, $after: String) {
  order(id: $id) { lineItems(first: 100, after: $after) { ${PAGE_INFO} nodes { ...LineItemFields } } }
}
${LINE_ITEM_FIELDS}`;

export const SHOP_QUERY = `query ImportShop {
  shop { id name myshopifyDomain currencyCode primaryDomain { host } }
}`;

export const COUNTS_QUERY = `query ImportCounts {
  productsCount(limit: null) { count precision }
  productVariantsCount(limit: null) { count precision }
  collectionsCount(limit: null) { count precision }
  customersCount(limit: null) { count precision }
  ordersCount(limit: null) { count precision }
}`;

export const COUNT_QUERIES = {
  COLLECTION: `query { collectionsCount(limit: null) { count } }`,
  PRODUCT: `query { productsCount(limit: null) { count } }`,
  CUSTOMER: `query { customersCount(limit: null) { count } }`,
  ORDER: `query { ordersCount(limit: null) { count } }`,
} as const;

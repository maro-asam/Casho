// Shopify's own transaction fee when a store uses a third-party payment
// provider instead of Shopify Payments — which is every Egyptian store, since
// Shopify Payments isn't offered in Egypt. Manual methods (cash on delivery,
// transfers) carry no such fee. Source: https://www.shopify.com/pricing,
// checked 2026-11-14. Rates are basis points so the maths stays integer.
export const SHOPIFY_THIRD_PARTY_FEES = [
  { key: "basic", name: "Basic", bp: 200 },
  { key: "grow", name: "Grow", bp: 100 },
  { key: "advanced", name: "Advanced", bp: 60 },
] as const;

export type ShopifyPlanKey = (typeof SHOPIFY_THIRD_PARTY_FEES)[number]["key"];

/** The calculator's stops for monthly online sales, in EGP. */
export const MONTHLY_SALES_STEPS = [
  10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 250_000, 500_000, 750_000, 1_000_000,
] as const;

export const DEFAULT_SALES_STEP = MONTHLY_SALES_STEPS.indexOf(100_000);

/** Shopify's fee on `sales` EGP of online orders, rounded to the pound. */
export function shopifyFee(sales: number, bp: number): number {
  return Math.round((sales * bp) / 10_000);
}

/** "0.6%" / "2%" — the rate as Shopify prints it. */
export function formatRate(bp: number): string {
  return `${bp / 100}%`;
}

// Shipping price for a method, given the customer's governorate. A method has
// a default price; merchants may override it per governorate. All piasters.

export type GovernorateRate = { governorate: string; price: number };

export function shippingPriceFor(
  method: { price: number; governorateRates?: GovernorateRate[] },
  governorate: string | null | undefined,
): number {
  if (!governorate) return method.price;
  return method.governorateRates?.find((r) => r.governorate === governorate)?.price ?? method.price;
}

export function governorateCookieKey(storeId: string) {
  return `gov_${storeId}`;
}

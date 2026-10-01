// Client-safe helpers for custom domains.

const SECOND_LEVEL = new Set(["com.eg", "net.eg", "org.eg", "edu.eg", "co.uk", "org.uk", "com.sa", "net.sa", "com.au", "co.za", "com.tr", "co.ae"]);

/** Registrable part, e.g. "shop.brand.com.eg" → "brand.com.eg". */
export function registrableDomain(domain: string) {
  const parts = domain.split(".");
  const tail2 = parts.slice(-2).join(".");
  const take = SECOND_LEVEL.has(tail2) ? 3 : 2;
  return parts.slice(-take).join(".");
}

/** brand.com / brand.com.eg (not shop.brand.com, not www.brand.com). */
export function isApexDomain(domain: string) {
  return registrableDomain(domain) === domain;
}

/** DNS records the merchant has to add, in their provider's terms. */
export function requiredRecords(domain: string, targets: { cname: string; a: string }) {
  if (isApexDomain(domain)) {
    return [
      { type: "A", host: "@", value: targets.a, note: "الدومين الأساسي" },
      { type: "CNAME", host: "www", value: targets.cname, note: "عشان www يشتغل كمان" },
    ];
  }
  const host = domain.slice(0, -(registrableDomain(domain).length + 1));
  return [{ type: "CNAME", host, value: targets.cname, note: `لـ ${domain}` }];
}

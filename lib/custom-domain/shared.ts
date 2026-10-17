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

/** TXT name that proves ownership (see lib/custom-domain/ownership). */
export const DOMAIN_VERIFY_PREFIX = "_casho-verify";

/** Host label relative to the registrable domain ("" for the apex). */
function subHost(domain: string) {
  return isApexDomain(domain) ? "" : domain.slice(0, -(registrableDomain(domain).length + 1));
}

/** The ownership TXT record, in the merchant's provider terms. */
export function verificationRecord(domain: string, verifyToken: string) {
  const sub = subHost(domain);
  return {
    type: "TXT",
    host: sub ? `${DOMAIN_VERIFY_PREFIX}.${sub}` : DOMAIN_VERIFY_PREFIX,
    value: `casho-verify=${verifyToken}`,
    note: "بيثبت إن الدومين ده بتاعك",
  };
}

/** DNS records the merchant has to add, in their provider's terms. */
export function requiredRecords(domain: string, targets: { cname: string; a: string }, verifyToken?: string) {
  const verify = verifyToken ? [verificationRecord(domain, verifyToken)] : [];
  if (isApexDomain(domain)) {
    return [
      { type: "A", host: "@", value: targets.a, note: "الدومين الأساسي" },
      { type: "CNAME", host: "www", value: targets.cname, note: "عشان www يشتغل كمان" },
      ...verify,
    ];
  }
  return [{ type: "CNAME", host: subHost(domain), value: targets.cname, note: `لـ ${domain}` }, ...verify];
}

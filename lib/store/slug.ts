import { transliterate } from "@/lib/utils";

/**
 * Subdomains a merchant must never get: platform hosts (routed by the proxy)
 * and names that would pass as Casho itself — `support.casho.store` selling
 * "account verification" is a phishing page with our domain on it.
 */
const RESERVED_STORE_SLUGS = new Set([
  // platform / infrastructure
  "www", "app", "api", "admin", "dashboard", "sales", "store", "stores", "pos", "builder",
  "onboarding", "print", "static", "assets", "cdn", "img", "images", "media", "files", "upload", "uploads",
  "mail", "email", "smtp", "imap", "pop", "webmail", "mx", "ns", "ns1", "ns2", "dns", "ftp", "vpn",
  "dev", "staging", "test", "beta", "demo", "preview", "internal", "status", "health", "metrics", "monitor",
  // auth / account / money
  "login", "logout", "signin", "signup", "register", "auth", "oauth", "sso", "account", "accounts",
  "secure", "security", "verify", "verification", "password", "reset", "billing", "pay", "payment",
  "payments", "checkout", "wallet", "invoice", "invoices", "topup", "kashier", "fawry", "instapay",
  // trust / support
  "help", "support", "contact", "docs", "blog", "news", "legal", "terms", "privacy", "abuse", "official",
  "team", "careers", "jobs", "partners", "affiliate", "affiliates", "root", "system", "sysadmin", "webmaster",
  // the brand
  "casho", "kasho", "cashostore", "casho-store", "casho-app", "casho-support", "casho-pay", "casho-admin",
  "casho-team", "casho-official",
]);

export function isReservedStoreSlug(slug: string) {
  return RESERVED_STORE_SLUGS.has(slug);
}

export function normalizeStoreSlug(value: string) {
  const slug = transliterate(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // A reserved name still works as a store name — it just never owns that subdomain.
  return slug && isReservedStoreSlug(slug) ? `${slug}-store` : slug;
}

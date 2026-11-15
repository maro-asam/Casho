import { st } from "@/lib/i18n/storefront";

export const NAV_LINKS = [
  { href: "/", get label() { return st("الرئيسية"); } },
  { href: "/products", get label() { return st("كل المنتجات"); } },
  { href: "/categories", get label() { return st("التصنيفات"); } },
  { href: "/about", get label() { return st("عن المتجر"); } },
  { href: "/contact", get label() { return st("تواصل معنا"); } },
] as const;

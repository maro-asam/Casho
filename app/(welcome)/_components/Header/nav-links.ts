"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutGrid,
  Palette,
  ScanBarcode,
  Truck,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";

export type NavLink = { key: string; name: string; href: string };
export type ProductLink = { title: string; text: string; href: string; icon: LucideIcon };

// Landing sections that live under the "Product" flyout.
const PRODUCT_SECTIONS = ["why", "features", "themes"];
// Landing sections that have a nav entry, in page order.
const SECTION_IDS = [...PRODUCT_SECTIONS, "pricing", "faq"];

export function useNavLinks(variant: "short" | "full" = "short"): NavLink[] {
  const { t } = useLang();
  return [
    { key: "pricing", name: t.nav.pricing, href: "/#pricing" },
    { key: "faq", name: variant === "full" ? t.nav.faqFull : t.nav.faq, href: "/#faq" },
    { key: "blog", name: t.nav.blog, href: "/blog" },
  ];
}

const PRODUCT_COPY = {
  ar: {
    label: "المنتج",
    items: [
      { title: "كاشير + متجر", text: "مخزون واحد لكل قنوات البيع", href: "/#why", icon: ScanBarcode },
      { title: "كل المميزات", text: "الطلبات والعروض والإشعارات", href: "/#features", icon: LayoutGrid },
      { title: "الثيمات", text: "٦ ثيمات للسوق العربي", href: "/#themes", icon: Palette },
      { title: "طرق الدفع", text: "فودافون كاش، إنستاباي، فوري، كروت", href: "/#features", icon: CreditCard },
      { title: "الشحن", text: "بوسطة وأرامكس من صفحة الطلب", href: "/#features", icon: Truck },
      { title: "النقل من شوبيفاي", text: "انقل متجرك في دقايق", href: "/#features", icon: Upload },
    ],
    promoTitle: "جرّب كاشو مجانًا",
    promoText: "٣ أيام تجربة · من غير بطاقة ائتمان",
    promoCta: "ابدأ دلوقتي",
  },
  en: {
    label: "Product",
    items: [
      { title: "POS + Store", text: "One inventory for every channel", href: "/#why", icon: ScanBarcode },
      { title: "All features", text: "Orders, offers and alerts", href: "/#features", icon: LayoutGrid },
      { title: "Themes", text: "6 themes for Arabic shoppers", href: "/#themes", icon: Palette },
      { title: "Payments", text: "Vodafone Cash, InstaPay, Fawry, cards", href: "/#features", icon: CreditCard },
      { title: "Shipping", text: "Bosta and Aramex from the order page", href: "/#features", icon: Truck },
      { title: "Move from Shopify", text: "Bring your store over in minutes", href: "/#features", icon: Upload },
    ],
    promoTitle: "Try Casho free",
    promoText: "3-day trial · No credit card",
    promoCta: "Start now",
  },
};

export function useProductMenu() {
  const { lang } = useLang();
  return PRODUCT_COPY[lang];
}

/**
 * Key of the nav entry matching the current route / visible landing section.
 * Sections under the Product flyout all report "product".
 */
export function useActiveNavKey(): string | null {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    const onScroll = () => {
      // A section is "active" once its top has passed ~35% of the viewport.
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname === "/") return section && PRODUCT_SECTIONS.includes(section) ? "product" : section;
  if (pathname.startsWith("/blog")) return "blog";
  return null;
}

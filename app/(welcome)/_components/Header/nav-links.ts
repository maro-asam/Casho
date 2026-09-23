"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "../../_i18n/LanguageContext";

export type NavLink = { key: string; name: string; href: string };

const SECTION_IDS = ["features", "pricing", "faq"];

export function useNavLinks(variant: "short" | "full" = "short"): NavLink[] {
  const { t } = useLang();
  return [
    { key: "home", name: t.nav.home, href: "/" },
    { key: "features", name: t.nav.features, href: "/#features" },
    { key: "pricing", name: t.nav.pricing, href: "/#pricing" },
    { key: "faq", name: variant === "full" ? t.nav.faqFull : t.nav.faq, href: "/#faq" },
    { key: "blog", name: t.nav.blog, href: "/blog" },
  ];
}

/** Returns the key of the nav link matching the current route / visible landing section. */
export function useActiveNavKey(): string | null {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setSection(null);
      return;
    }

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

  if (pathname === "/") return section ?? "home";
  if (pathname.startsWith("/blog")) return "blog";
  return null;
}

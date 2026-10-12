"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import QuickView from "../product/QuickView";
import { num } from "../ui";
import Announcement from "./Announcement";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import SearchDrawer from "./SearchDrawer";
import StoreMark from "./StoreMark";

const MEGA_ID = "dn-mega";

export default function DuneHeader({ shell }: { shell: StoreShell }) {
  const count = useCartCount(shell.slug);
  const path = useStorePath(shell.slug);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [search, setSearch] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const hasMega = shell.categories.length > 0;

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 6));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close menus on navigation (adjust state while rendering, not in an effect)
  const [prevPath, setPrevPath] = useState(path);
  if (prevPath !== path) {
    setPrevPath(path);
    setMega(false);
    setSearch(false);
  }

  // Hover intent: open after a short pause, close a little after leaving.
  const hoverMega = (open: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMega(open), open ? 120 : 220);
  };
  const closeMega = useCallback((refocus?: boolean) => {
    clearTimeout(hoverTimer.current);
    setMega(false);
    if (refocus) triggerRef.current?.focus();
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const links = [
    { href: "/products?sort=newest", match: "", label: "وصل حديثًا" },
    { href: "/products?featured=true", match: "", label: "اختيارات المتجر" },
    { href: "/about", match: "/about", label: "عن المتجر" },
    { href: "/contact", match: "/contact", label: "تواصل معنا" },
  ];

  return (
    <>
      <Announcement shell={shell} />

      <header
        data-solid={scrolled || mega || search}
        className="dn-header sticky top-0 z-40"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="dn-wrap grid h-(--dn-header-h) grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Start: menu + search (phones) / logo (desktop) */}
          <div className="flex items-center gap-0.5 lg:hidden">
            <MobileNav shell={shell} path={path} />
            <button type="button" onClick={() => setSearch(true)} aria-label="بحث" aria-haspopup="dialog" className="dn-icon">
              <Search />
            </button>
          </div>
          <StoreMark shell={shell} className="justify-self-center lg:justify-self-start" />

          {/* Desktop navigation */}
          <nav aria-label="القائمة الرئيسية" className="hidden h-full lg:block">
            <ul className="flex h-full items-stretch gap-7 xl:gap-9">
              <li className="flex items-center" onMouseEnter={() => hasMega && hoverMega(true)}>
                {hasMega ? (
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={mega}
                    aria-controls={MEGA_ID}
                    onClick={() => setMega((v) => !v)}
                    className="dn-link dn-label"
                  >
                    تسوّق
                  </button>
                ) : (
                  <Link href={url("/products")} className="dn-link dn-label">
                    تسوّق
                  </Link>
                )}
              </li>
              {links.map((l) => (
                <li key={l.href} className="flex items-center" onMouseEnter={() => hasMega && hoverMega(false)}>
                  <Link href={url(l.href)} aria-current={l.match && isActivePath(path, l.match) ? "page" : undefined} className="dn-link dn-label">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* End: actions */}
          <div className="flex items-center justify-self-end gap-0.5">
            <button type="button" onClick={() => setSearch(true)} aria-label="بحث" aria-haspopup="dialog" className="dn-icon max-lg:hidden">
              <Search />
            </button>
            <button type="button" onClick={openCart} aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"} aria-haspopup="dialog" className="dn-icon -me-2.5">
              <ShoppingBag />
              {count > 0 && (
                <span key={count} className="dn-cart-dot dn-bump absolute end-0.5 top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums">
                  {num(Math.min(count, 99))}
                </span>
              )}
            </button>
          </div>
        </div>

        {hasMega && <MegaMenu id={MEGA_ID} shell={shell} open={mega} onClose={closeMega} />}
      </header>

      <SearchDrawer shell={shell} open={search} onOpenChange={setSearch} />
      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-30 bg-(--dn-scrim) transition-opacity duration-500 max-lg:hidden", mega ? "opacity-100" : "opacity-0")} />
    </>
  );
}

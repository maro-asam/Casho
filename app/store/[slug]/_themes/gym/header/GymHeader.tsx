"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, LayoutGrid, Search, ShoppingBag, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { whatsappHref } from "../../shared/social";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import { CategoryIcon } from "../lib/category-icon";
import QuickView from "../product/QuickView";
import { btn, num } from "../ui";
import DrawerMenu from "./DrawerMenu";
import MegaMenu from "./MegaMenu";
import SearchBar from "./SearchBar";
import StoreMark from "./StoreMark";
import UtilityBar from "./UtilityBar";

const MEGA_ID = "gy-mega";

/** Studio "navbar" setting → header layout:
 *  default  — logo, inline links and a search button that opens a search row (theme default)
 *  centered — logo in the middle, shelves row centered under it
 *  compact  — big search between the logo and the cart, shelves row under it */
type Variant = "compact" | "centered" | "default";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "centered" ? "centered" : v === "compact" ? "compact" : "default");

function CartButton({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
      aria-haspopup="dialog"
      className={btn({ size: "sm", className: "h-11 !px-3 lg:!px-5" })}
    >
      <span className="relative">
        <ShoppingBag className="!size-5" />
        {count > 0 && (
          <span key={count} className="gy-bump absolute -end-2 -top-2 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-(--gy-bg) px-1 text-[0.625rem] font-black tabular-nums text-(--gy-ink)">
            {num(Math.min(count, 99))}
          </span>
        )}
      </span>
      <span aria-hidden className="hidden lg:inline">
        السلة
      </span>
    </button>
  );
}

export default function GymHeader({ shell }: { shell: StoreShell }) {
  const variant = variantOf(shell.navbarVariant);
  const count = useCartCount(shell.slug);
  const path = useStorePath(shell.slug);
  const [scroll, setScroll] = useState({ hidden: false, stuck: false, top: false });
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const hasMega = shell.categories.length > 0;
  const wa = whatsappHref(shell.contact.whatsapp);

  // Sticky on scroll up: hide while scrolling down, return on the way up.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const down = y > last + 4;
        const up = y < last - 4;
        setScroll((s) => {
          const hidden = y < 220 ? false : down ? true : up ? false : s.hidden;
          const next = { hidden, stuck: y > 40, top: y > 700 };
          return next.hidden === s.hidden && next.stuck === s.stuck && next.top === s.top ? s : next;
        });
        if (down || up) last = y;
      });
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
    setSearchOpen(false);
  }
  if (scroll.hidden && (mega || searchOpen)) {
    setMega(false);
    setSearchOpen(false);
  }

  const hoverMega = (open: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMega(open), open ? 150 : 250);
  };
  const closeMega = useCallback((refocus?: boolean) => {
    clearTimeout(hoverTimer.current);
    setMega(false);
    if (refocus) triggerRef.current?.focus();
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const megaTrigger = hasMega ? (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={mega}
      aria-controls={MEGA_ID}
      onClick={() => setMega((v) => !v)}
      onMouseEnter={() => hoverMega(true)}
      className="gy-nav-link"
    >
      <LayoutGrid />
      الأقسام
      <ChevronDown className={cn("!size-4 transition-transform duration-300", mega && "rotate-180")} />
    </button>
  ) : (
    <Link href={url("/products")} className="gy-nav-link">
      <LayoutGrid />
      كل المنتجات
    </Link>
  );

  const links = [
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
  ];

  /** Shelves shown in the shelves row (compact / centered). */
  const shelves = shell.categories.slice(0, variant === "centered" ? 5 : 6);

  const searchToggle = (
    <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-expanded={searchOpen} aria-label={searchOpen ? "قفل البحث" : "البحث"} className="gy-icon text-(--gy-ink)">
      {searchOpen ? <X /> : <Search />}
    </button>
  );

  return (
    <>
      <UtilityBar text={shell.announcementText} trackHref={url("/track")} whatsapp={shell.contact.whatsapp} whatsappHref={wa} />

      <header
        data-hidden={scroll.hidden}
        data-stuck={scroll.stuck}
        className="gy-header sticky top-0 z-40"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="gy-wrap">
          {variant === "centered" ? (
            <div className="grid h-(--gy-header-h) grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="lg:hidden">
                  <DrawerMenu shell={shell} path={path} />
                </div>
                <div className="max-lg:hidden">{searchToggle}</div>
              </div>
              <StoreMark shell={shell} className="justify-center" />
              <div className="flex items-center justify-end gap-1 lg:gap-3">
                <CartButton count={count} />
              </div>
            </div>
          ) : (
            <div className="flex h-(--gy-header-h) items-center gap-3 lg:gap-8">
              <div className="lg:hidden">
                <DrawerMenu shell={shell} path={path} />
              </div>
              <StoreMark shell={shell} className="max-w-[60%] lg:max-w-[22rem]" />
              {variant === "compact" ? (
                <SearchBar shell={shell} className="mx-auto hidden w-full max-w-3xl min-w-0 flex-1 lg:block" />
              ) : (
                <nav aria-label="القائمة الرئيسية" className="hidden min-w-0 flex-1 lg:block">
                  <ul className="flex items-center gap-1">
                    <li>{megaTrigger}</li>
                    {[{ href: "/products", label: "كل المنتجات" }, ...links, { href: "/contact", label: "تواصل معنا" }].map((l) => (
                      <li key={l.href} onMouseEnter={() => hasMega && hoverMega(false)}>
                        <Link href={url(l.href)} aria-current={!l.href.includes("?") && isActivePath(path, l.href) ? "page" : undefined} className="gy-nav-link">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="ms-auto flex shrink-0 items-center gap-1 lg:ms-0 lg:gap-3">
                {variant === "default" && <div className="max-lg:hidden">{searchToggle}</div>}
                <CartButton count={count} />
              </div>
            </div>
          )}

          {/* Phones: search is always one tap away */}
          <div className="pb-3 lg:hidden">
            <SearchBar shell={shell} />
          </div>

          {/* Desktop search row (default / centered) */}
          {variant !== "compact" && searchOpen && (
            <div className="gy-pop hidden pb-4 lg:block">
              <SearchBar shell={shell} size="lg" autoFocus onDone={() => setSearchOpen(false)} className="mx-auto max-w-3xl" />
            </div>
          )}
        </div>

        {/* Desktop shelves row (compact / centered) */}
        {variant !== "default" && (
          <nav aria-label="الأقسام" className="hidden border-t border-(--gy-line) lg:block">
            <div className={cn("gy-wrap flex h-13 items-center gap-6", variant === "centered" ? "justify-center" : "justify-between")}>
              <ul className={cn("flex min-w-0 items-center gap-1", variant === "centered" && "justify-center")}>
                <li>{megaTrigger}</li>
                {shelves.map((c, i) => (
                  <li key={c.id} className={cn("min-w-0", i >= 4 && "hidden xl:block")} onMouseEnter={() => hasMega && hoverMega(false)}>
                    <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="gy-nav-link max-w-48">
                      <CategoryIcon name={c.name} />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {variant === "compact" && (
                <ul className="flex shrink-0 items-center gap-1" onMouseEnter={() => hasMega && hoverMega(false)}>
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={url(l.href)} className="gy-nav-link text-sm">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </nav>
        )}

        {hasMega && <MegaMenu id={MEGA_ID} shell={shell} open={mega} onClose={closeMega} />}
      </header>

      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-30 bg-(--gy-scrim) transition-opacity duration-300 max-lg:hidden", mega ? "opacity-100" : "opacity-0")} />
      <button
        type="button"
        data-show={scroll.top}
        tabIndex={scroll.top ? 0 : -1}
        aria-hidden={!scroll.top}
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="الرجوع لأعلى الصفحة"
        className="gy-top"
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}

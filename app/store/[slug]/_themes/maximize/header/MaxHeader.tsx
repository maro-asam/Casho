"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, LayoutGrid, Mail, MessageCircle, ShoppingCart } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { whatsappHref } from "../../shared/social";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import QuickView from "../product/QuickView";
import { num } from "../ui";
import DrawerMenu from "./DrawerMenu";
import MegaMenu from "./MegaMenu";
import SearchBar from "./SearchBar";
import StoreMark from "./StoreMark";
import Ticker from "./Ticker";

const MEGA_ID = "mx-mega";

function CartButton({ count }: { count: number }) {
  return (
    <button type="button" onClick={openCart} aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"} aria-haspopup="dialog" className="mx-icon -me-2">
      <ShoppingCart />
      {count > 0 && (
        <span key={count} className="mx-cart-dot mx-bump absolute end-0.5 top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums">
          {num(Math.min(count, 99))}
        </span>
      )}
    </button>
  );
}

export default function MaxHeader({ shell }: { shell: StoreShell }) {
  const count = useCartCount(shell.slug);
  const path = useStorePath(shell.slug);
  const [scroll, setScroll] = useState({ hidden: false, stuck: false, top: false });
  const [mega, setMega] = useState(false);
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
          const hidden = y < 200 ? false : down ? true : up ? false : s.hidden;
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
  }
  if (scroll.hidden && mega) setMega(false);

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

  const navCats = shell.categories.slice(0, 4);
  const links = [
    { href: "/products?sort=newest", label: "وصل حديثًا", tag: "جديد" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
    { href: "/products", label: "كل المنتجات", match: "/products" },
  ];

  return (
    <>
      <Ticker text={shell.announcementText} />

      <header
        data-hidden={scroll.hidden}
        data-stuck={scroll.stuck}
        className="mx-header sticky top-0 z-40"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="mx-wrap">
          {/* Main row */}
          <div className="grid h-(--mx-header-h) grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10 xl:gap-16">
            <div className="flex items-center gap-1 lg:gap-4">
              <div className="lg:hidden">
                <DrawerMenu shell={shell} path={path} variant="icon" />
              </div>
              <div className="hidden lg:block">
                <DrawerMenu shell={shell} path={path} variant="button" />
              </div>
              <StoreMark shell={shell} className="hidden lg:flex" />
            </div>
            <StoreMark shell={shell} className="justify-self-center lg:hidden" />
            <SearchBar shell={shell} className="hidden w-full max-w-[40rem] justify-self-center lg:block" />
            <div className="flex items-center justify-end gap-1">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="كلّمنا على واتساب" className="mx-icon hidden lg:grid">
                  <MessageCircle />
                </a>
              )}
              <CartButton count={count} />
            </div>
          </div>

          {/* Phones: search row */}
          <div className="pb-3 lg:hidden">
            <SearchBar shell={shell} />
          </div>

          {/* Desktop navigation */}
          <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
            <ul className="-mx-3 flex h-12 items-center gap-1 xl:gap-3">
              <li onMouseEnter={() => hasMega && hoverMega(true)}>
                {hasMega ? (
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={mega}
                    aria-controls={MEGA_ID}
                    onClick={() => setMega((v) => !v)}
                    className="mx-nav-link px-3 font-semibold text-(--mx-link)"
                  >
                    <LayoutGrid className="size-4" />
                    تسوّق حسب التصنيف
                    <ChevronDown className={cn("size-4 transition-transform duration-300", mega && "rotate-180")} />
                  </button>
                ) : (
                  <Link href={url("/products")} className="mx-nav-link px-3 font-semibold text-(--mx-link)">
                    تسوّق
                  </Link>
                )}
              </li>
              {navCats.map((c, i) => (
                <li key={c.id} className={cn(i >= 2 && "hidden xl:block")} onMouseEnter={() => hasMega && hoverMega(false)}>
                  <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="mx-nav-link max-w-44 px-3">
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
              {links.map((l) => (
                <li key={l.href} className="relative" onMouseEnter={() => hasMega && hoverMega(false)}>
                  {l.tag && (
                    <span aria-hidden className="mx-badge mx-badge--drop pointer-events-none absolute -top-3 start-1/2 min-h-5 -translate-x-1/2 px-1.5 text-[0.6875rem] rtl:translate-x-1/2">
                      {l.tag}
                    </span>
                  )}
                  <Link href={url(l.href)} aria-current={l.match && path === l.match ? "page" : undefined} className="mx-nav-link px-3">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {hasMega && <MegaMenu id={MEGA_ID} shell={shell} open={mega} onClose={closeMega} />}
      </header>

      {/* Utility bar (desktop): store pages on the start, contact on the end */}
      <div className="hidden border-y border-(--mx-line) bg-(--mx-bg) lg:block">
        <div className="mx-wrap flex h-11 items-center justify-between gap-6 text-[0.8125rem] text-(--mx-ink)">
          <ul className="flex items-center gap-5">
            {[
              { href: "/about", label: "عن المتجر" },
              { href: "/contact", label: "المساعدة والتواصل" },
              { href: "/categories", label: "كل التصنيفات" },
              { href: "/cart", label: "سلة المشتريات" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={url(l.href)} aria-current={isActivePath(path, l.href) ? "page" : undefined} className="mx-hover-line">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {(shell.contact.email || wa) && (
            <ul className="flex items-center gap-5">
              {shell.contact.email && (
                <li>
                  <a href={`mailto:${shell.contact.email}`} className="mx-hover-line inline-flex items-center gap-2">
                    <Mail className="size-4 text-(--mx-quiet)" />
                    <span dir="ltr">{shell.contact.email}</span>
                  </a>
                </li>
              )}
              {wa && shell.contact.whatsapp && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="mx-hover-line inline-flex items-center gap-2">
                    <MessageCircle className="size-4 text-(--mx-quiet)" />
                    <span dir="ltr">{shell.contact.whatsapp}</span>
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-30 bg-(--mx-scrim) transition-opacity duration-300 max-lg:hidden", mega ? "opacity-100" : "opacity-0")} />
      <button
        type="button"
        data-show={scroll.top}
        tabIndex={scroll.top ? 0 : -1}
        aria-hidden={!scroll.top}
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="الرجوع لأعلى الصفحة"
        className="mx-top"
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}

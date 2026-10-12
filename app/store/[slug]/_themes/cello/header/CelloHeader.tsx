"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, MessageCircle, ShoppingBag, Zap } from "lucide-react";

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

const MEGA_ID = "ce-mega";

/** Bag with a yellow count badge; on desktop also "Cart" and the item count. */
function CartButton({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
      aria-haspopup="dialog"
      className="-me-1.5 flex min-h-11 items-center gap-2.5 rounded-(--ce-r-sm) px-1.5 text-(--ce-ink) hover:text-(--ce-btn)"
    >
      <span className="relative">
        <ShoppingBag className="size-6" />
        <span key={count} className="ce-cart-dot ce-bump absolute -start-2 -top-1.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums">
          {num(Math.min(count, 99))}
        </span>
      </span>
      <span aria-hidden className="hidden text-start text-[0.8125rem] leading-tight lg:block">
        السلة
        <span className="block font-semibold">{count > 0 ? `${num(count)} منتج` : "فاضية"}</span>
      </span>
    </button>
  );
}

export default function CelloHeader({ shell }: { shell: StoreShell }) {
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

  const navCats = shell.categories.slice(0, 5);
  const links = [
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products", label: "كل المنتجات", match: "/products" },
  ];
  const utility = [
    { href: "/products?featured=true", label: "اختيارات المتجر", Icon: Zap },
    { href: "/about", label: "عن المتجر" },
    { href: "/contact", label: "تواصل معنا" },
  ];

  return (
    <>
      <Ticker text={shell.announcementText} />

      <header
        data-hidden={scroll.hidden}
        data-stuck={scroll.stuck}
        className="ce-header sticky top-0 z-40 bg-(--ce-card)"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="ce-wrap">
          {/* Main row: logo · search · contact · cart */}
          <div className="flex h-(--ce-header-h) items-center gap-3 lg:gap-6">
            <div className="lg:hidden">
              <DrawerMenu shell={shell} path={path} variant="icon" />
            </div>
            <StoreMark shell={shell} className="shrink-0" />
            <SearchBar shell={shell} className="hidden min-w-0 flex-1 lg:block" />
            <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0 lg:gap-5">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2.5 text-(--ce-ink) hover:text-(--ce-btn)" aria-label="كلّمنا على واتساب">
                  <MessageCircle className="size-6" strokeWidth={1.5} />
                  <span aria-hidden className="hidden text-[0.8125rem] leading-tight xl:block">
                    محتاج مساعدة؟
                    <span className="block font-semibold">كلّمنا واتساب</span>
                  </span>
                </a>
              )}
              <CartButton count={count} />
            </div>
          </div>

          {/* Phones: search row */}
          <div className="pb-3 lg:hidden">
            <SearchBar shell={shell} />
          </div>
        </div>

        {/* Desktop navigation row */}
        <nav aria-label="القائمة الرئيسية" className="hidden border-t border-(--ce-line) lg:block">
          <div className="ce-wrap flex h-12 items-center justify-between gap-6">
            <ul className="-mx-2.5 flex min-w-0 items-center gap-1 xl:gap-2">
              <li onMouseEnter={() => hasMega && hoverMega(true)}>
                {hasMega ? (
                  <button ref={triggerRef} type="button" aria-expanded={mega} aria-controls={MEGA_ID} onClick={() => setMega((v) => !v)} className="ce-nav-link px-2.5">
                    كل التصنيفات
                    <ChevronDown className={cn("size-4 transition-transform duration-300", mega && "rotate-180")} />
                  </button>
                ) : (
                  <Link href={url("/products")} className="ce-nav-link px-2.5">
                    تسوّق
                  </Link>
                )}
              </li>
              {navCats.map((c, i) => (
                <li key={c.id} className={cn("min-w-0", i >= 3 && "hidden xl:block")} onMouseEnter={() => hasMega && hoverMega(false)}>
                  <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="ce-nav-link max-w-44 px-2.5">
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
              {links.map((l) => (
                <li key={l.href} onMouseEnter={() => hasMega && hoverMega(false)}>
                  <Link href={url(l.href)} aria-current={l.match && path === l.match ? "page" : undefined} className="ce-nav-link px-2.5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex shrink-0 items-center text-sm" onMouseEnter={() => hasMega && hoverMega(false)}>
              {utility.map(({ href, label, Icon }, i) => (
                <li key={href} className="flex items-center">
                  {i > 0 && <span aria-hidden className="mx-3 h-3.5 w-px bg-(--ce-line)" />}
                  <Link href={url(href)} aria-current={isActivePath(path, href) ? "page" : undefined} className="inline-flex min-h-10 items-center gap-1.5 text-(--ce-ink) hover:text-(--ce-btn) aria-[current=page]:text-(--ce-btn)">
                    {Icon && <Icon className="size-4 fill-(--ce-sale) text-(--ce-sale)" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {hasMega && <MegaMenu id={MEGA_ID} shell={shell} open={mega} onClose={closeMega} />}
      </header>

      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-30 bg-(--ce-scrim) transition-opacity duration-300 max-lg:hidden", mega ? "opacity-100" : "opacity-0")} />
      <button
        type="button"
        data-show={scroll.top}
        tabIndex={scroll.top ? 0 : -1}
        aria-hidden={!scroll.top}
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="الرجوع لأعلى الصفحة"
        className="ce-top"
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}

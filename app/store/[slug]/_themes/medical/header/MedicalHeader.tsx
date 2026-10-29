"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ClipboardPlus, LayoutGrid, Search, ShoppingBag, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { whatsappHref } from "../../shared/social";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import { CategoryIcon } from "../lib/category-icon";
import { RX_MESSAGE, waWith } from "../lib/rx";
import QuickView from "../product/QuickView";
import { num } from "../ui";
import DrawerMenu from "./DrawerMenu";
import MegaMenu from "./MegaMenu";
import SearchBar from "./SearchBar";
import StoreMark from "./StoreMark";
import UtilityBar from "./UtilityBar";

const MEGA_ID = "rx-mega";

/** Studio "navbar" setting → header layout:
 *  compact  — big search between the logo and the actions (theme default)
 *  centered — logo in the middle, departments row centered under it
 *  default  — logo, inline links and a search button that opens a search row */
type Variant = "compact" | "centered" | "default";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "centered" ? "centered" : v === "compact" ? "compact" : "default");

function CartButton({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
      aria-haspopup="dialog"
      className="flex min-h-11 items-center gap-2.5 rounded-full text-(--rx-ink) lg:bg-(--rx-band) lg:py-1 lg:pe-4 lg:ps-1 lg:hover:bg-(--rx-tint)"
    >
      <span className="relative grid size-11 place-items-center rounded-full lg:size-9 lg:bg-(--rx-card)">
        <ShoppingBag className="size-[1.375rem] lg:size-5" />
        {count > 0 && (
          <span key={count} className="rx-cart-dot rx-bump absolute -end-0.5 -top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.625rem] font-bold tabular-nums lg:-end-1 lg:-top-1">
            {num(Math.min(count, 99))}
          </span>
        )}
      </span>
      <span aria-hidden className="hidden text-start text-xs leading-tight lg:block">
        <span className="text-(--rx-quiet)">السلة</span>
        <span className="block text-sm font-bold">{count > 0 ? `${num(count)} منتج` : "فاضية"}</span>
      </span>
    </button>
  );
}

function RxButton({ href, compact }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="ابعت روشتة على واتساب"
      className={cn(
        "items-center gap-2 rounded-full font-bold transition-colors",
        compact ? "rx-icon flex text-(--rx-btn)" : "hidden min-h-11 border border-(--rx-line) px-4 text-sm text-(--rx-ink) hover:border-(--rx-btn) hover:text-(--rx-btn) lg:inline-flex",
      )}
    >
      <ClipboardPlus className={compact ? "" : "size-5 text-(--rx-btn)"} />
      {!compact && "ابعت روشتة"}
    </a>
  );
}

export default function MedicalHeader({ shell }: { shell: StoreShell }) {
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
  const rxHref = wa ? waWith(wa, RX_MESSAGE) : null;

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
      className={cn("rx-nav-link", variant !== "default" && "bg-(--rx-btn) !text-(--rx-btn-ink) hover:!bg-(--rx-btn-hover)")}
    >
      <LayoutGrid className={cn(variant !== "default" && "!text-(--rx-btn-ink)")} />
      كل الأقسام
      <ChevronDown className={cn("!size-4 transition-transform duration-300", variant !== "default" && "!text-(--rx-btn-ink)", mega && "rotate-180")} />
    </button>
  ) : (
    <Link href={url("/products")} className="rx-nav-link">
      <LayoutGrid />
      كل المنتجات
    </Link>
  );

  const links = [
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
  ];

  /** Shelves shown in the departments row (compact / centered). */
  const shelves = shell.categories.slice(0, variant === "centered" ? 5 : 6);

  const searchToggle = (
    <button
      type="button"
      onClick={() => setSearchOpen((v) => !v)}
      aria-expanded={searchOpen}
      aria-label={searchOpen ? "قفل البحث" : "البحث"}
      className="rx-icon text-(--rx-ink)"
    >
      {searchOpen ? <X /> : <Search />}
    </button>
  );

  return (
    <>
      <UtilityBar text={shell.announcementText} trackHref={url("/track")} whatsapp={shell.contact.whatsapp} whatsappHref={wa} />

      <header
        data-hidden={scroll.hidden}
        data-stuck={scroll.stuck}
        className="rx-header sticky top-0 z-40"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="rx-wrap">
          {variant === "centered" ? (
            <div className="grid h-(--rx-header-h) grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="lg:hidden">
                  <DrawerMenu shell={shell} path={path} />
                </div>
                <div className="max-lg:hidden">{searchToggle}</div>
              </div>
              <StoreMark shell={shell} className="justify-center" />
              <div className="flex items-center justify-end gap-1 lg:gap-3">
                {rxHref && <RxButton href={rxHref} />}
                {rxHref && (
                  <span className="lg:hidden">
                    <RxButton href={rxHref} compact />
                  </span>
                )}
                <CartButton count={count} />
              </div>
            </div>
          ) : (
            <div className="flex h-(--rx-header-h) items-center gap-3 lg:gap-6">
              <div className="lg:hidden">
                <DrawerMenu shell={shell} path={path} />
              </div>
              <StoreMark shell={shell} className="shrink-0" />
              {variant === "compact" ? (
                <SearchBar shell={shell} className="mx-auto hidden w-full max-w-3xl min-w-0 flex-1 lg:block" />
              ) : (
                <nav aria-label="القائمة الرئيسية" className="hidden min-w-0 flex-1 lg:block">
                  <ul className="flex items-center gap-1">
                    <li>{megaTrigger}</li>
                    {[{ href: "/products", label: "كل المنتجات" }, ...links, { href: "/contact", label: "تواصل معنا" }].map((l) => (
                      <li key={l.href} onMouseEnter={() => hasMega && hoverMega(false)}>
                        <Link href={url(l.href)} aria-current={!l.href.includes("?") && isActivePath(path, l.href) ? "page" : undefined} className="rx-nav-link">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="ms-auto flex shrink-0 items-center gap-1 lg:ms-0 lg:gap-3">
                {variant === "default" && <div className="max-lg:hidden">{searchToggle}</div>}
                {rxHref && <RxButton href={rxHref} />}
                {rxHref && (
                  <span className="lg:hidden">
                    <RxButton href={rxHref} compact />
                  </span>
                )}
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
            <div className="rx-pop hidden pb-4 lg:block">
              <SearchBar shell={shell} size="lg" autoFocus onDone={() => setSearchOpen(false)} className="mx-auto max-w-3xl" />
            </div>
          )}
        </div>

        {/* Desktop departments row (compact / centered) */}
        {variant !== "default" && (
          <nav aria-label="الأقسام" className="hidden border-t border-(--rx-line) lg:block">
            <div className={cn("rx-wrap flex h-14 items-center gap-6", variant === "centered" ? "justify-center" : "justify-between")}>
              <ul className={cn("flex min-w-0 items-center gap-1", variant === "centered" && "justify-center")}>
                <li>{megaTrigger}</li>
                {shelves.map((c, i) => {
                  return (
                    <li key={c.id} className={cn("min-w-0", i >= 4 && "hidden xl:block")} onMouseEnter={() => hasMega && hoverMega(false)}>
                      <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="rx-nav-link max-w-48">
                        <CategoryIcon name={c.name} />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {variant === "compact" && (
                <ul className="flex shrink-0 items-center gap-1" onMouseEnter={() => hasMega && hoverMega(false)}>
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={url(l.href)} className="rx-nav-link text-sm">
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
      <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-30 bg-(--rx-scrim) transition-opacity duration-300 max-lg:hidden", mega ? "opacity-100" : "opacity-0")} />
      <button
        type="button"
        data-show={scroll.top}
        tabIndex={scroll.top ? 0 : -1}
        aria-hidden={!scroll.top}
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="الرجوع لأعلى الصفحة"
        className="rx-top"
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}

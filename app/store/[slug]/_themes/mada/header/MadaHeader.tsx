"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Heart, Search, ShoppingBag, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import WishlistDrawer from "../cart/WishlistDrawer";
import { openWishlist } from "../lib/events";
import { useLocalList, wishlistKey } from "../lib/local-list";
import QuickView from "../product/QuickView";
import { num } from "../ui";
import MegaMenu from "./MegaMenu";
import MobileDrawer from "./MobileDrawer";
import SearchPanel from "./SearchPanel";
import { StoreMark, ThemeToggle } from "./parts";

const noop = () => () => {};

function Announcement({ text, storeSlug }: { text: string; storeSlug: string }) {
  const key = `mada:announcement:${storeSlug}`;
  const [hidden, setHidden] = useState(false);
  const dismissedBefore = useSyncExternalStore(
    noop,
    () => {
      try {
        return sessionStorage.getItem(key) === text;
      } catch {
        return false;
      }
    },
    () => false,
  );
  if (hidden || dismissedBefore) return null;
  return (
    <div className="bg-(--md-brand) text-(--md-brand-ink)">
      <div className="md-wrap relative flex min-h-9 items-center justify-center py-1.5 pe-10 ps-10">
        <p className="line-clamp-2 text-center text-xs font-medium leading-5 sm:text-[0.8125rem]">{text}</p>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem(key, text);
            } catch {}
          }}
          aria-label="إخفاء الإعلان"
          className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full opacity-75 hover:opacity-100 sm:end-[calc(var(--md-gutter)-0.5rem)]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function MadaHeader({ shell }: { shell: StoreShell }) {
  const count = useCartCount(shell.slug);
  const { list: saved } = useLocalList(wishlistKey(shell.slug));
  const path = useStorePath(shell.slug);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [search, setSearch] = useState(false);
  const lastY = useRef(0);
  const url = (p: string) => buildStoreUrl(shell.slug, p);

  // Smart sticky: hide while scrolling down, reveal on the way up.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        setHidden(y > 160 && y > lastY.current + 4);
        if (y < lastY.current - 4 || y < 160) setHidden(false);
        lastY.current = y;
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
    setSearch(false);
  }

  const links = [
    { href: "/products", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "اختيارات المتجر" },
    { href: "/about", label: "عن المتجر" },
    { href: "/contact", label: "تواصل معنا" },
  ];
  const pinned = mega || search;

  return (
    <>
      {shell.announcementText?.trim() && <Announcement text={shell.announcementText.trim()} storeSlug={shell.slug} />}

      <header
        className={cn(
          "sticky top-0 z-40 transition-[transform,background-color,box-shadow] duration-300 ease-(--md-ease)",
          scrolled || pinned ? "bg-(--md-surface)/95 shadow-[0_1px_0_var(--md-line)] backdrop-blur-md" : "bg-(--md-bg)",
          hidden && !pinned && "-translate-y-full",
        )}
        onMouseLeave={() => setMega(false)}
      >
        <div className="md-wrap grid h-(--md-header-h) grid-cols-[1fr_auto_1fr] items-center gap-4 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
          {/* Start: menu (phones) / logo (desktop) */}
          <div className="flex items-center lg:hidden">
            <MobileDrawer shell={shell} path={path} onSearch={() => setSearch(true)} />
          </div>
          <StoreMark shell={shell} className="justify-self-center lg:justify-self-start" />

          {/* Desktop navigation */}
          <nav aria-label="القائمة الرئيسية" className="hidden min-w-0 lg:block">
            <ul className="flex items-center gap-1">
              <li>
                <button
                  type="button"
                  aria-expanded={mega}
                  aria-controls="md-mega"
                  onClick={() => setMega((v) => !v)}
                  onMouseEnter={() => setMega(true)}
                  className={cn("md-btn md-btn--ghost md-btn--sm gap-1.5 text-[0.9375rem]", mega && "bg-(--md-studio)")}
                >
                  تسوّق
                  <ChevronDown className={cn("size-4 transition-transform duration-300", mega && "rotate-180")} />
                </button>
              </li>
              {links.map((l) => (
                <li key={l.href} onMouseEnter={() => setMega(false)}>
                  <Link
                    href={url(l.href)}
                    aria-current={l.href.startsWith("/products") ? undefined : isActivePath(path, l.href) ? "page" : undefined}
                    className="md-btn md-btn--ghost md-btn--sm text-[0.9375rem] aria-[current=page]:bg-(--md-studio)"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* End: actions */}
          <div className="flex items-center justify-self-end gap-0.5 sm:gap-1.5">
            <button type="button" onClick={() => setSearch(true)} aria-label="بحث" aria-haspopup="dialog" className="md-btn md-btn--ghost md-btn--icon">
              <Search />
            </button>
            <button type="button" onClick={openWishlist} aria-label={saved.length ? `المفضلة، فيها ${saved.length}` : "المفضلة"} className="md-btn md-btn--ghost md-btn--icon relative max-sm:hidden">
              <Heart />
              {saved.length > 0 && (
                <span aria-hidden className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-(--md-sale) px-1 text-[0.625rem] font-bold text-white">
                  {num(saved.length)}
                </span>
              )}
            </button>
            <span className="max-lg:hidden">
              <ThemeToggle />
            </span>
            <button
              type="button"
              onClick={openCart}
              aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
              className="md-btn md-btn--brand md-btn--sm ms-1 gap-2 px-3.5 max-sm:size-11 max-sm:px-0"
            >
              <ShoppingBag />
              <span className="max-sm:hidden">السلة</span>
              <span key={count} className={cn("md-price grid h-5 min-w-5 place-items-center rounded-full bg-(--md-signal) px-1 text-[0.6875rem] text-(--md-signal-ink) max-sm:absolute max-sm:-end-0.5 max-sm:-top-0.5", count > 0 && "md-bump", count === 0 && "max-sm:hidden")}>
                {num(Math.min(count, 99))}
              </span>
            </button>
          </div>
        </div>

        <MegaMenu shell={shell} open={mega} onClose={() => setMega(false)} />
      </header>

      <SearchPanel shell={shell} open={search} onOpenChange={setSearch} />
      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <WishlistDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
    </>
  );
}

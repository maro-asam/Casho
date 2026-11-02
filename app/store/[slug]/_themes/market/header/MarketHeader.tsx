"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, ShoppingBasket } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { isActivePath, useStorePath } from "../../shared/store-path";
import CartDrawer from "../cart/CartDrawer";
import { useCartSummary, useCartSync } from "../lib/cart-lines";
import { openSearch } from "../lib/events";
import QuickView from "../product/QuickView";
import { num } from "../ui";
import Announcement from "./Announcement";
import { AppearanceScript, AppearanceToggle } from "./AppearanceToggle";
import MegaMenu from "./MegaMenu";
import SearchSheet from "./SearchSheet";
import StoreMark from "./StoreMark";
import TabBar from "./TabBar";

const MEGA_ID = "mk-mega";

/** Studio "navbar" setting → the floating bar:
 *  default  — logo, inline links, search and cart (theme default)
 *  centered — logo in the middle, aisles on a second row
 *  compact  — a wide search field between the logo and the cart */
type Variant = "compact" | "centered" | "default";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "centered" ? "centered" : v === "compact" ? "compact" : "default");

function CartPill() {
  const { count, subtotal } = useCartSummary();
  return (
    <button type="button" onClick={openCart} aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"} aria-haspopup="dialog" className="mk-cartpill">
      <ShoppingBasket />
      {count > 0 && (
        <span className="mk-num flex items-center gap-1.5">
          {formatPrice(subtotal)}
          <span key={count} className="mk-bump mk-badge-count">
            {num(Math.min(count, 99))}
          </span>
        </span>
      )}
    </button>
  );
}

function SearchField({ wide }: { wide?: boolean }) {
  return (
    <button type="button" onClick={openSearch} className={cn("mk-searchpill", wide && "mk-searchpill--wide")}>
      <Search />
      <span className="truncate">دوّر في المتجر</span>
      <kbd dir="ltr">⌘K</kbd>
    </button>
  );
}

export default function MarketHeader({ shell }: { shell: StoreShell }) {
  const variant = variantOf(shell.navbarVariant);
  const path = useStorePath(shell.slug);
  const [stuck, setStuck] = useState(false);
  const [mega, setMega] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const hasMega = shell.categories.length > 0;

  useCartSync(shell.slug, path);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation (adjust state while rendering, not in an effect)
  const [prevPath, setPrevPath] = useState(path);
  if (prevPath !== path) {
    setPrevPath(path);
    setMega(false);
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

  const aislesTrigger = hasMega ? (
    <button ref={triggerRef} type="button" aria-expanded={mega} aria-controls={MEGA_ID} onClick={() => setMega((v) => !v)} onMouseEnter={() => hoverMega(true)} className="mk-nav-link">
      الأقسام
      <ChevronDown className={cn("!size-3.5 transition-transform duration-300", mega && "rotate-180")} />
    </button>
  ) : (
    <Link href={url("/products")} className="mk-nav-link">
      كل المنتجات
    </Link>
  );

  const links = [
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "مختاراتنا" },
    { href: "/track", label: "تتبّع طلبك" },
  ];

  const navLinks = (
    <ul className="flex items-center gap-0.5">
      <li>{aislesTrigger}</li>
      {[{ href: "/products", label: "كل المنتجات" }, ...links].map((l) => (
        <li key={l.href} onMouseEnter={() => hasMega && hoverMega(false)}>
          <Link href={url(l.href)} aria-current={!l.href.includes("?") && isActivePath(path, l.href) ? "page" : undefined} className="mk-nav-link">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <AppearanceScript />
      <Announcement text={shell.announcementText} />

      <header
        data-stuck={stuck}
        className="mk-bar"
        onMouseLeave={() => hasMega && hoverMega(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
        }}
      >
        <div className="mk-wrap relative">
          <div className="mk-island mk-glass">
            {variant === "centered" ? (
              <div className="grid h-(--mk-bar-h) grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={openSearch} aria-label="البحث" className="mk-icon">
                    <Search />
                  </button>
                  <AppearanceToggle />
                </div>
                <StoreMark shell={shell} className="justify-center" />
                <div className="flex justify-end">
                  <CartPill />
                </div>
              </div>
            ) : (
              <div className="flex h-(--mk-bar-h) items-center gap-2 lg:gap-4">
                <StoreMark shell={shell} className="max-w-[60%] lg:max-w-[16rem]" />
                {variant === "compact" ? (
                  <div className="mx-auto hidden min-w-0 max-w-2xl flex-1 lg:block">
                    <SearchField wide />
                  </div>
                ) : (
                  <nav aria-label="القائمة الرئيسية" className="hidden min-w-0 flex-1 lg:block">
                    {navLinks}
                  </nav>
                )}
                <div className="ms-auto flex shrink-0 items-center gap-1 lg:ms-0">
                  {variant === "default" && (
                    <div className="max-lg:hidden">
                      <SearchField />
                    </div>
                  )}
                  <AppearanceToggle />
                  <div className="max-lg:hidden">
                    <CartPill />
                  </div>
                </div>
              </div>
            )}

            {variant !== "default" && (
              <nav aria-label="الأقسام" className="hidden border-t border-(--mk-sep) py-1 lg:block">
                <div className={cn("flex items-center", variant === "centered" ? "justify-center" : "justify-between")}>{navLinks}</div>
              </nav>
            )}
          </div>

          {variant === "compact" && (
            <div className="mt-2 lg:hidden">
              <button type="button" onClick={openSearch} className="mk-searchpill mk-searchpill--wide mk-glass !h-11">
                <Search />
                <span className="truncate">دوّر في المتجر</span>
              </button>
            </div>
          )}

          {hasMega && <MegaMenu id={MEGA_ID} shell={shell} open={mega} onClose={closeMega} />}
        </div>
      </header>

      <TabBar storeSlug={shell.slug} path={path} />
      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <SearchSheet shell={shell} />
    </>
  );
}

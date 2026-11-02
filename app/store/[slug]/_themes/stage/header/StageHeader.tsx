"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { openCart } from "../../shared/cart-events";
import { isActivePath, useStorePath } from "../../shared/store-path";
import CartDrawer from "../cart/CartDrawer";
import { useCartSummary, useCartSync } from "../lib/cart-lines";
import { openSearch } from "../lib/events";
import QuickView from "../product/QuickView";
import { num, stagger } from "../ui";
import Announcement from "./Announcement";
import { AppearanceScript, AppearanceSegments } from "./AppearanceToggle";
import SearchSheet from "./SearchSheet";
import StoreMark from "./StoreMark";

const FLYOUT_ID = "sg-flyout";
const MENU_ID = "sg-menu";
/** Categories that get their own link in the bar; the rest live in the flyout. */
const BAR_LINKS = 5;

/** Studio "navbar" setting → the global nav:
 *  default  — apple.com's full-width frosted bar, links in the middle (theme default)
 *  centered — the same bar as a floating glass capsule
 *  compact  — the mark, search and bag; everything else lives in the menu */
type Variant = "default" | "centered" | "compact";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "centered" ? "centered" : v === "compact" ? "compact" : "default");

function BagButton() {
  const { count } = useCartSummary();
  return (
    <button type="button" onClick={openCart} aria-label={count > 0 ? `الحقيبة، فيها ${num(count)} منتج` : "الحقيبة"} aria-haspopup="dialog" className="sg-gicon relative">
      <ShoppingBag />
      {count > 0 && (
        <span key={count} aria-hidden className="sg-bump sg-bag-count">
          {num(Math.min(count, 99))}
        </span>
      )}
    </button>
  );
}

/** Two bars that turn into an X, like apple.com's menu button. */
function MenuButton({ open, onClick, className }: { open: boolean; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} aria-controls={MENU_ID} aria-label={open ? "إغلاق القائمة" : "القائمة"} className={cn("sg-gicon sg-burger", className)} data-open={open}>
      <span aria-hidden />
      <span aria-hidden />
    </button>
  );
}

export default function StageHeader({ shell }: { shell: StoreShell }) {
  const variant = variantOf(shell.navbarVariant);
  const path = useStorePath(shell.slug);
  const [flyout, setFlyout] = useState(false);
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const url = (p: string) => buildStoreUrl(shell.slug, p);

  const shelves = shell.categories.filter((c) => c.productCount > 0);
  const barLinks = shelves.slice(0, BAR_LINKS);
  const quick = [
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "مختاراتنا" },
    { href: "/categories", label: "كل الأقسام" },
    { href: "/track", label: "تتبّع طلبك" },
  ];
  const store = [
    { href: "/about", label: `عن ${shell.name}` },
    { href: "/contact", label: "تواصل معانا" },
  ];

  useCartSync(shell.slug, path);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on navigation (adjust state while rendering, not in an effect)
  const [prevPath, setPrevPath] = useState(path);
  if (prevPath !== path) {
    setPrevPath(path);
    setFlyout(false);
    setMenu(false);
  }

  // The open menu owns the screen: no page scroll behind it, Escape closes it.
  useEffect(() => {
    if (!menu && !flyout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      setFlyout(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    if (menu) document.documentElement.classList.add("sg-locked");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("sg-locked");
    };
  }, [menu, flyout]);

  const hover = useCallback((open: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setFlyout(open), open ? 120 : 220);
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const flyoutOpen = flyout && !menu;

  return (
    <>
      <AppearanceScript />
      <header
        className="sg-gnav"
        data-variant={variant}
        data-stuck={stuck}
        data-open={flyoutOpen || menu}
        onMouseLeave={() => hover(false)}
        onBlur={(e) => {
          if (flyout && !e.currentTarget.contains(e.relatedTarget as Node | null)) setFlyout(false);
        }}
      >
        <div className="sg-gnav-bar">
          <div className="sg-gnav-inner">
            <StoreMark shell={shell} className="sg-gnav-mark" />

            {variant !== "compact" && (
              <nav aria-label="القائمة الرئيسية" className="sg-gnav-links">
                <ul>
                  <li>
                    {shelves.length > 0 ? (
                      <button
                        ref={triggerRef}
                        type="button"
                        aria-expanded={flyoutOpen}
                        aria-controls={FLYOUT_ID}
                        onClick={() => setFlyout((v) => !v)}
                        onMouseEnter={() => hover(true)}
                        className="sg-gnav-link"
                      >
                        تسوّق
                      </button>
                    ) : (
                      <Link href={url("/products")} className="sg-gnav-link">
                        كل المنتجات
                      </Link>
                    )}
                  </li>
                  {barLinks.map((c) => (
                    <li key={c.id} onMouseEnter={() => hover(false)}>
                      <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="sg-gnav-link">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  <li onMouseEnter={() => hover(false)}>
                    <Link href={url("/products?sort=newest")} className="sg-gnav-link">
                      الجديد
                    </Link>
                  </li>
                  <li onMouseEnter={() => hover(false)}>
                    <Link href={url("/track")} aria-current={isActivePath(path, "/track") ? "page" : undefined} className="sg-gnav-link">
                      تتبّع طلبك
                    </Link>
                  </li>
                </ul>
              </nav>
            )}

            <div className="sg-gnav-actions">
              <button type="button" onClick={openSearch} aria-label="البحث" className="sg-gicon" onMouseEnter={() => hover(false)}>
                <Search />
              </button>
              <BagButton />
              <MenuButton open={menu} onClick={() => setMenu((v) => !v)} className={variant === "compact" ? undefined : "lg:hidden"} />
            </div>
          </div>
        </div>

        {/* Desktop flyout: every shelf in big type, then quick links. */}
        {shelves.length > 0 && variant !== "compact" && (
          <div id={FLYOUT_ID} className="sg-flyout" data-open={flyoutOpen} inert={!flyoutOpen} onMouseEnter={() => hover(true)}>
            <div className="sg-flyout-inner">
              <div className="sg-fly-col">
                <p className="sg-fly-label" style={stagger(0)}>
                  تسوّق
                </p>
                <ul className="sg-fly-big">
                  <li style={stagger(1)}>
                    <Link href={url("/products")}>تسوّق كل المنتجات</Link>
                  </li>
                  {shelves.slice(0, 8).map((c, i) => (
                    <li key={c.id} style={stagger(i + 2)}>
                      <Link href={url(`/categories/${c.slug}`)}>{c.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sg-fly-col">
                <p className="sg-fly-label" style={stagger(1)}>
                  روابط سريعة
                </p>
                <ul className="sg-fly-small">
                  {quick.map((l, i) => (
                    <li key={l.href} style={stagger(i + 2)}>
                      <Link href={url(l.href)}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sg-fly-col">
                <p className="sg-fly-label" style={stagger(2)}>
                  {shell.name}
                </p>
                <ul className="sg-fly-small">
                  {store.map((l, i) => (
                    <li key={l.href} style={stagger(i + 3)}>
                      <Link href={url(l.href)}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* The menu: the whole screen on phones (and every size on compact). */}
        <div id={MENU_ID} className={cn("sg-menu", variant !== "compact" && "lg:hidden")} data-open={menu} inert={!menu}>
          <div className="sg-menu-inner">
            <ul className="sg-menu-big">
              <li style={stagger(0)}>
                <Link href={url("/products")} onClick={() => setMenu(false)}>
                  كل المنتجات
                </Link>
              </li>
              {shelves.map((c, i) => (
                <li key={c.id} style={stagger(i + 1)}>
                  <Link href={url(`/categories/${c.slug}`)} onClick={() => setMenu(false)}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="sg-fly-label mt-8" style={stagger(shelves.length + 1)}>
              روابط سريعة
            </p>
            <ul className="sg-menu-small">
              {[...quick, ...store].map((l, i) => (
                <li key={l.href} style={stagger(shelves.length + 2 + i)}>
                  <Link href={url(l.href)} onClick={() => setMenu(false)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8" style={stagger(shelves.length + 8)}>
              <AppearanceSegments />
            </div>
          </div>
        </div>
      </header>
      <div aria-hidden className="sg-gnav-scrim" data-open={flyoutOpen} onMouseEnter={() => hover(false)} onClick={() => setFlyout(false)} />

      <Announcement text={shell.announcementText} />

      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <SearchSheet shell={shell} />
    </>
  );
}

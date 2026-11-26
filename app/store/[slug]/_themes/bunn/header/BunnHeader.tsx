"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { openCart } from "../../shared/cart-events";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import { openSearch } from "../lib/events";
import QuickView from "../product/QuickView";
import { Arrow, BN_PORTAL, CategoryArt, Divider, num, stagger } from "../ui";
import Announcement from "./Announcement";
import { AppearanceScript, AppearanceSegments, AppearanceToggle } from "./AppearanceToggle";
import SearchSheet from "./SearchSheet";
import StoreMark from "./StoreMark";
import { st } from "@/lib/i18n/storefront";

const MEGA_ID = "bn-mega";
/** Sections that get their own link in the bar; the rest live in the panel. */
const BAR_LINKS = 4;

/** Studio "navbar" setting:
 *  default  — the mark on the start, the links beside it on one bar (theme default)
 *  centered — the mark in the middle, the links on a row under it
 *  compact  — the mark, a wide search field and the icons; every link in the menu */
type Variant = "default" | "centered" | "compact";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "centered" || v === "allaia" ? "centered" : v === "compact" ? "compact" : "default");

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span key={n} aria-hidden className="bn-count bn-bump">
      {num(Math.min(n, 99))}
    </span>
  );
}

export default function BunnHeader({ shell }: { shell: StoreShell }) {
  const variant = variantOf(shell.navbarVariant);
  const path = useStorePath(shell.slug);
  const bag = useCartCount(shell.slug);
  const [mega, setMega] = useState(false);
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);
  const socials = getSocialLinks(shell.contact);

  const shelves = shell.categories.filter((c) => c.productCount > 0);
  const barLinks = shelves.slice(0, BAR_LINKS);
  const quick = [
    { href: "/products?sort=newest", label: st("وصل جديد") },
    { href: "/products?featured=true", label: st("اختيارات المحمصة") },
    { href: "/categories", label: st("كل الأقسام") },
    { href: "/track", label: st("تتبّع طلبك") },
  ];
  const house = [
    { href: "/about", label: st("عن {0}", shell.name) },
    { href: "/contact", label: st("تواصل معانا") },
  ];

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on navigation (adjust state while rendering, not in an effect).
  const [prevPath, setPrevPath] = useState(path);
  if (prevPath !== path) {
    setPrevPath(path);
    setMega(false);
    setMenu(false);
  }

  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMega(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mega]);

  const hover = useCallback((open: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMega(open), open ? 120 : 220);
  }, []);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const links = (
    <ul className="bn-navlinks">
      <li onMouseEnter={() => hover(false)}>
        <Link href={url("/products")} aria-current={path === "/products" ? "page" : undefined} className="bn-navlink">
          {st("المتجر")}
        </Link>
      </li>
      {shelves.length > 0 && (
        <li>
          <button type="button" aria-expanded={mega} aria-controls={MEGA_ID} onClick={() => setMega((v) => !v)} onMouseEnter={() => hover(true)} className="bn-navlink">
            {st("الأقسام")}
            <ChevronDown aria-hidden className="bn-navchev" />
          </button>
        </li>
      )}
      {barLinks.map((c) => (
        <li key={c.id} onMouseEnter={() => hover(false)}>
          <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="bn-navlink">
            {c.name}
          </Link>
        </li>
      ))}
      <li onMouseEnter={() => hover(false)}>
        <Link href={url("/products?sort=newest")} className="bn-navlink">
          {st("الجديد")}
        </Link>
      </li>
    </ul>
  );

  return (
    <>
      <AppearanceScript />
      <Announcement text={shell.announcementText} />
      <header
        className="bn-header"
        data-variant={variant}
        data-stuck={stuck}
        data-open={mega}
        onMouseLeave={() => hover(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) setMega(false);
        }}
      >
        <div className="bn-header-bar">
          <div className="bn-wrap bn-header-inner">
            <div className="bn-hs">
              <button type="button" onClick={() => setMenu(true)} aria-label={st("القائمة")} aria-haspopup="dialog" className={cn("bn-icon -ms-2", variant !== "compact" && "lg:hidden")}>
                <Menu />
              </button>
              {variant === "centered" && (
                <button type="button" onClick={openSearch} aria-label={st("البحث")} className="bn-icon -ms-2 max-lg:hidden">
                  <Search />
                </button>
              )}
            </div>

            <StoreMark shell={shell} className="bn-hm" />

            {variant === "default" && (
              <nav aria-label={st("القائمة الرئيسية")} className="bn-hn">
                {links}
              </nav>
            )}

            {variant === "compact" && (
              <button type="button" onClick={openSearch} className="bn-hsearch">
                <Search aria-hidden />
                <span>{st("دوّر على بن، أداة تحضير، مج…")}</span>
                <kbd dir="ltr">⌘K</kbd>
              </button>
            )}

            <div className="bn-he">
              <button type="button" onClick={openSearch} aria-label={st("البحث")} className={cn("bn-icon", variant !== "default" && "lg:hidden")}>
                <Search />
              </button>
              <AppearanceToggle className="max-lg:hidden" />
              <button type="button" onClick={openCart} aria-label={bag > 0 ? st("السلة، فيها {0}", num(bag)) : st("السلة")} aria-haspopup="dialog" className="bn-bagbtn">
                <ShoppingBag aria-hidden />
                <span className="max-sm:hidden">{st("السلة")}</span>
                <Count n={bag} />
              </button>
            </div>
          </div>
        </div>

        {variant === "centered" && (
          <nav aria-label={st("القائمة الرئيسية")} className="bn-header-nav max-lg:hidden">
            <div className="bn-wrap">{links}</div>
          </nav>
        )}

        {/* The sections panel (desktop): every section as a cup seen from above, then a promo. */}
        {shelves.length > 0 && variant !== "compact" && (
          <div id={MEGA_ID} className="bn-mega max-lg:hidden" data-open={mega} inert={!mega} onMouseEnter={() => hover(true)}>
            <div className="bn-wrap bn-mega-inner">
              <div className="min-w-0">
                <p className="bn-kicker" style={stagger(0)}>
                  {st("الأقسام")}
                </p>
                <ul className="bn-mega-grid">
                  {shelves.slice(0, 8).map((c, i) => (
                    <li key={c.id} style={stagger(i + 1)}>
                      <Link href={url(`/categories/${c.slug}`)} className="bn-mega-item group">
                        <span className="bn-cup bn-cup--sm">
                          <span className="bn-cup-art">
                            <CategoryArt name={c.name} image={c.image} sizes="72px" className="bn-zoom" />
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="bn-display block truncate text-[1rem] text-(--bn-ink)">{c.name}</span>
                          <span className="block text-xs text-(--bn-ink-2)">{st("{0} منتج", num(c.productCount))}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2" style={stagger(9)}>
                  {quick.map((l) => (
                    <Link key={l.href} href={url(l.href)} className="bn-link text-sm">
                      <span className="bn-underline">{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {shell.banner && (
                <BannerLink banner={shell.banner} storeSlug={shell.slug} className="bn-mega-promo group" aria-label={shell.banner.title}>
                  <BannerImage banner={shell.banner} sizes="22rem" className="bn-zoom object-cover" />
                  <span aria-hidden className="bn-shade" />
                  <span className="bn-mega-promo-copy">
                    <span className="bn-display block text-xl leading-snug">{shell.banner.title}</span>
                    {shell.banner.link && <span className="mt-2 inline-flex items-center gap-1 text-xs">{shell.banner.cta} ›</span>}
                  </span>
                </BannerLink>
              )}
            </div>
          </div>
        )}
      </header>
      <div aria-hidden className="bn-mega-scrim max-lg:hidden" data-open={mega} onMouseEnter={() => hover(false)} onClick={() => setMega(false)} />

      {/* The menu: a drawer from the start on phones (and every size on compact). */}
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(BN_PORTAL, "bn-scrim fixed inset-0 z-50")} />
          <Dialog.Content dir={shell.dir} aria-describedby={undefined} className={cn(BN_PORTAL, "bn-drawer bn-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-(--bn-sheet) outline-none")}>
            <Dialog.Title className="sr-only">{st("القائمة")}</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--bn-line) px-5">
              <StoreMark shell={shell} max={36} onClick={() => setMenu(false)} />
              <Dialog.Close className="bn-icon -me-2" aria-label={st("إغلاق القائمة")}>
                <X />
              </Dialog.Close>
            </div>
            <div className="bn-stagger flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <ul className="bn-menu-big">
                <li style={stagger(0)}>
                  <Link href={url("/products")} onClick={() => setMenu(false)}>
                    <span className="min-w-0 flex-1">{st("كل المنتجات")}</span>
                    <Arrow />
                  </Link>
                </li>
                {shelves.map((c, i) => (
                  <li key={c.id} style={stagger(i + 1)}>
                    <Link href={url(`/categories/${c.slug}`)} onClick={() => setMenu(false)}>
                      <span className="bn-cup bn-cup--xs">
                        <span className="bn-cup-art">
                          <CategoryArt name={c.name} image={c.image} sizes="40px" />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
              <Divider className="my-6" />
              <ul className="bn-menu-small" style={stagger(shelves.length + 1)}>
                {[...quick, ...house].map((l) => (
                  <li key={l.href}>
                    <Link href={url(l.href)} onClick={() => setMenu(false)}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-5" style={stagger(shelves.length + 2)}>
                <AppearanceSegments />
                {(wa || socials.length > 0) && (
                  <div className="flex items-center gap-1">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={st("واتساب")} className="bn-icon -ms-2">
                        <MessageCircle />
                      </a>
                    )}
                    {socials.map(({ label, href, Icon }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="bn-icon">
                        <Icon aria-hidden className="size-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CartDrawer storeSlug={shell.slug} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} dir={shell.dir} />
      <SearchSheet shell={shell} />
    </>
  );
}

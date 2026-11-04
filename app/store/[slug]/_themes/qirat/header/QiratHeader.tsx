"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { openCart } from "../../shared/cart-events";
import { useLocalList } from "../../shared/local-list";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import CartDrawer from "../cart/CartDrawer";
import WishlistDrawer from "../cart/WishlistDrawer";
import { openSearch, openWishlist, wishKey } from "../lib/events";
import QuickView from "../product/QuickView";
import { Arrow, CategoryArt, Ornament, QR_PORTAL, num, stagger } from "../ui";
import Announcement from "./Announcement";
import { AppearanceScript, AppearanceSegments, AppearanceToggle } from "./AppearanceToggle";
import SearchSheet from "./SearchSheet";
import StoreMark from "./StoreMark";

const MEGA_ID = "qr-mega";
/** Collections that get their own link in the bar; the rest live in the panel. */
const BAR_LINKS = 5;

/** Studio "navbar" setting:
 *  centered — the maison layout: the mark in the middle, the links on a row under it (theme default)
 *  default  — the mark on the start, the links beside it on one bar
 *  compact  — the mark, a wide search field and the icons; every link in the menu */
type Variant = "default" | "centered" | "compact";
const variantOf = (v: StoreShell["navbarVariant"]): Variant => (v === "default" ? "default" : v === "compact" ? "compact" : "centered");

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span key={n} aria-hidden className="qr-count qr-bump">
      {num(Math.min(n, 99))}
    </span>
  );
}

export default function QiratHeader({ shell }: { shell: StoreShell }) {
  const variant = variantOf(shell.navbarVariant);
  const path = useStorePath(shell.slug);
  const bag = useCartCount(shell.slug);
  const wish = useLocalList(wishKey(shell.slug), 60).list.length;
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
    { href: "/products?sort=newest", label: "وصل حديثًا" },
    { href: "/products?featured=true", label: "مختارات المتجر" },
    { href: "/categories", label: "كل المجموعات" },
    { href: "/track", label: "تتبّع طلبك" },
  ];
  const house = [
    { href: "/about", label: `عن ${shell.name}` },
    { href: "/contact", label: "تواصل معانا" },
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

  const megaTrigger = shelves.length > 0 && (
    <button type="button" aria-expanded={mega} aria-controls={MEGA_ID} onClick={() => setMega((v) => !v)} onMouseEnter={() => hover(true)} className="qr-navlink">
      المجموعات
    </button>
  );
  const links = (
    <ul className="qr-navlinks">
      <li onMouseEnter={() => hover(false)}>
        <Link href={url("/products")} aria-current={path === "/products" ? "page" : undefined} className="qr-navlink">
          كل القطع
        </Link>
      </li>
      {megaTrigger && <li>{megaTrigger}</li>}
      {barLinks.map((c) => (
        <li key={c.id} onMouseEnter={() => hover(false)}>
          <Link href={url(`/categories/${c.slug}`)} aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined} className="qr-navlink">
            {c.name}
          </Link>
        </li>
      ))}
      <li onMouseEnter={() => hover(false)}>
        <Link href={url("/products?sort=newest")} className="qr-navlink">
          الجديد
        </Link>
      </li>
    </ul>
  );

  return (
    <>
      <AppearanceScript />
      <Announcement text={shell.announcementText} />
      <header
        className="qr-header"
        data-variant={variant}
        data-stuck={stuck}
        data-open={mega}
        onMouseLeave={() => hover(false)}
        onBlur={(e) => {
          if (mega && !e.currentTarget.contains(e.relatedTarget as Node | null)) setMega(false);
        }}
      >
        <div className="qr-header-bar">
          <div className="qr-wrap qr-header-inner">
            <div className="qr-hs">
              <button type="button" onClick={() => setMenu(true)} aria-label="القائمة" aria-haspopup="dialog" className={cn("qr-icon -ms-2", variant !== "compact" && "lg:hidden")}>
                <Menu />
              </button>
              {variant === "centered" && (
                <button type="button" onClick={openSearch} aria-label="البحث" className="qr-icon max-lg:hidden -ms-2">
                  <Search />
                </button>
              )}
            </div>

            <StoreMark shell={shell} className="qr-hm" />

            {variant === "default" && (
              <nav aria-label="القائمة الرئيسية" className="qr-hn">
                {links}
              </nav>
            )}

            {variant === "compact" && (
              <button type="button" onClick={openSearch} className="qr-hsearch">
                <Search aria-hidden />
                <span>دوّر على خاتم، سلسلة، ساعة…</span>
                <kbd dir="ltr">⌘K</kbd>
              </button>
            )}

            <div className="qr-he">
              <button type="button" onClick={openSearch} aria-label="البحث" className={cn("qr-icon", variant === "centered" && "lg:hidden", variant === "compact" && "lg:hidden")}>
                <Search />
              </button>
              <AppearanceToggle className="max-lg:hidden" />
              <button type="button" onClick={openWishlist} aria-label={wish > 0 ? `قايمة الأمنيات، فيها ${num(wish)}` : "قايمة الأمنيات"} aria-haspopup="dialog" className="qr-icon relative max-sm:hidden">
                <Heart />
                <Count n={wish} />
              </button>
              <button type="button" onClick={openCart} aria-label={bag > 0 ? `الحقيبة، فيها ${num(bag)} قطعة` : "الحقيبة"} aria-haspopup="dialog" className="qr-icon relative -me-2">
                <ShoppingBag />
                <Count n={bag} />
              </button>
            </div>
          </div>
        </div>

        {variant === "centered" && (
          <nav aria-label="القائمة الرئيسية" className="qr-header-nav max-lg:hidden">
            <div className="qr-wrap">{links}</div>
          </nav>
        )}

        {/* The collections panel (desktop): every collection as a cameo, then a promo. */}
        {shelves.length > 0 && variant !== "compact" && (
          <div id={MEGA_ID} className="qr-mega max-lg:hidden" data-open={mega} inert={!mega} onMouseEnter={() => hover(true)}>
            <div className="qr-wrap qr-mega-inner">
              <div className="min-w-0">
                <p className="qr-kicker" style={stagger(0)}>
                  المجموعات
                </p>
                <ul className="qr-mega-grid">
                  {shelves.slice(0, 8).map((c, i) => (
                    <li key={c.id} style={stagger(i + 1)}>
                      <Link href={url(`/categories/${c.slug}`)} className="qr-mega-item group">
                        <span className="qr-cameo-art">
                          <CategoryArt name={c.name} image={c.image} sizes="72px" className="qr-zoom" />
                        </span>
                        <span className="min-w-0">
                          <span className="qr-serif block truncate text-[1.0625rem] text-(--qr-ink)">{c.name}</span>
                          <span className="block text-xs text-(--qr-ink-2)">{num(c.productCount)} قطعة</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2" style={stagger(9)}>
                  {quick.map((l) => (
                    <Link key={l.href} href={url(l.href)} className="qr-link text-sm">
                      <span className="qr-underline">{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {shell.banner && (
                <BannerLink banner={shell.banner} storeSlug={shell.slug} className="qr-mega-promo group" aria-label={shell.banner.title}>
                  <BannerImage banner={shell.banner} sizes="22rem" className="qr-zoom object-cover" />
                  <span aria-hidden className="qr-shade" />
                  <span className="qr-mega-promo-copy">
                    <span className="qr-serif block text-xl leading-snug">{shell.banner.title}</span>
                    {shell.banner.link && <span className="mt-2 inline-flex items-center gap-1 text-xs">{shell.banner.cta} ›</span>}
                  </span>
                </BannerLink>
              )}
            </div>
          </div>
        )}
      </header>
      <div aria-hidden className="qr-mega-scrim max-lg:hidden" data-open={mega} onMouseEnter={() => hover(false)} onClick={() => setMega(false)} />

      {/* The menu: a drawer from the start on phones (and every size on compact). */}
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
          <Dialog.Content dir={shell.dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-drawer qr-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-(--qr-sheet) outline-none")}>
            <Dialog.Title className="sr-only">القائمة</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--qr-line) px-6">
              <StoreMark shell={shell} max={36} onClick={() => setMenu(false)} />
              <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق القائمة">
                <X />
              </Dialog.Close>
            </div>
            <div className="qr-stagger flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              <ul className="qr-menu-big">
                <li style={stagger(0)}>
                  <Link href={url("/products")} onClick={() => setMenu(false)}>
                    <span>كل القطع</span>
                    <Arrow />
                  </Link>
                </li>
                {shelves.map((c, i) => (
                  <li key={c.id} style={stagger(i + 1)}>
                    <Link href={url(`/categories/${c.slug}`)} onClick={() => setMenu(false)}>
                      <span className="qr-cameo-art qr-cameo-art--sm">
                        <CategoryArt name={c.name} image={c.image} sizes="40px" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
              <Ornament className="my-7" />
              <ul className="qr-menu-small" style={stagger(shelves.length + 1)}>
                {[...quick, ...house].map((l) => (
                  <li key={l.href}>
                    <Link href={url(l.href)} onClick={() => setMenu(false)}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      openWishlist();
                    }}
                  >
                    قايمة أمنياتك{wish > 0 ? ` (${num(wish)})` : ""}
                  </button>
                </li>
              </ul>
              <div className="mt-8 space-y-5" style={stagger(shelves.length + 2)}>
                <AppearanceSegments />
                {(wa || socials.length > 0) && (
                  <div className="flex items-center gap-1">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="qr-icon -ms-2">
                        <MessageCircle />
                      </a>
                    )}
                    {socials.map(({ label, href, Icon }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="qr-icon">
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
      <WishlistDrawer storeSlug={shell.slug} storeName={shell.name} dir={shell.dir} />
      <QuickView storeSlug={shell.slug} storeName={shell.name} dir={shell.dir} />
      <SearchSheet shell={shell} />
    </>
  );
}

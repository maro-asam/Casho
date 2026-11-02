"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { House, LayoutGrid, PackageSearch, Search, ShoppingBasket } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { isActivePath } from "../../shared/store-path";
import { useCartSummary } from "../lib/cart-lines";
import { openSearch } from "../lib/events";
import { num } from "../ui";

/** Pages with their own bottom action hide the tab bar, as a pushed screen would. */
const hasOwnBar = (path: string) => path === "/cart" || path === "/checkout" || path.startsWith("/products/");

/** Phone navigation: a floating glass tab bar that shrinks while scrolling down,
 *  with the basket total riding above it once there's something in the cart. */
export default function TabBar({ storeSlug, path }: { storeSlug: string; path: string }) {
  const { count, subtotal } = useCartSummary();
  const [small, setSmall] = useState(false);
  const url = (p: string) => buildStoreUrl(storeSlug, p);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setSmall(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hasOwnBar(path)) return null;

  const tabs = [
    { href: "/", label: "الرئيسية", Icon: House },
    { href: "/categories", label: "الأقسام", Icon: LayoutGrid },
  ];

  return (
    <div className="mk-dock lg:hidden" data-small={small}>
      {count > 0 && (
        <button type="button" onClick={openCart} className="mk-basket">
          <span className="mk-basket-count">{num(count)}</span>
          <span className="flex-1 text-start">عرض السلة</span>
          <span className="mk-num">{formatPrice(subtotal)}</span>
        </button>
      )}
      <nav aria-label="التنقل" className="mk-tabbar mk-glass">
        {tabs.map(({ href, label, Icon }) => (
          <Link key={href} href={url(href)} aria-current={isActivePath(path, href) ? "page" : undefined} className="mk-tab">
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
        <button type="button" onClick={openSearch} className="mk-tab">
          <Search />
          <span>بحث</span>
        </button>
        <button type="button" onClick={openCart} aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"} className="mk-tab">
          <span className="relative">
            <ShoppingBasket />
            {count > 0 && <span className="mk-badge-dot">{num(Math.min(count, 99))}</span>}
          </span>
          <span>السلة</span>
        </button>
        <Link href={url("/track")} aria-current={isActivePath(path, "/track") ? "page" : undefined} className="mk-tab">
          <PackageSearch />
          <span>طلبي</span>
        </Link>
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { ShoppingBag, X } from "lucide-react";

import { GetCartItemsAction } from "@/actions/store/cart.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { CART_UPDATED_EVENT } from "../cart-events";
import { btn } from "../ui";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import MobileSearch from "./MobileSearch";
import SearchCombobox from "./SearchCombobox";
import StoreLogo from "./StoreLogo";
import ThemeToggle from "./ThemeToggle";
import { useStorePath } from "./use-store-path";

function useCartCount(storeSlug: string) {
  const [count, setCount] = useState(0);
  const path = useStorePath(storeSlug);

  useEffect(() => {
    let alive = true;
    const load = () =>
      GetCartItemsAction(storeSlug)
        .then(({ items }) => alive && setCount(items.reduce((t, i) => t + i.quantity, 0)))
        .catch(() => {});
    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(CART_UPDATED_EVENT, load);
    };
  }, [storeSlug, path]);

  return count;
}

function AnnouncementBar({ text, storeSlug }: { text: string; storeSlug: string }) {
  const key = `casho:announcement:${storeSlug}`;
  const [dismissed, setHidden] = useState(false);
  // Dismissed earlier this session? (read on the client only — no flash, no mismatch)
  const dismissedBefore = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return sessionStorage.getItem(key) === text;
      } catch {
        return false;
      }
    },
    () => false,
  );

  if (dismissed || dismissedBefore) return null;

  return (
    <div className="bg-foreground text-background">
      <div className="c-container relative flex min-h-9 items-center justify-center py-1.5 pe-10 ps-10">
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
          className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100 sm:end-[calc(var(--c-gutter)-0.5rem)]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CartButton({ storeSlug, count, withLabel }: { storeSlug: string; count: number; withLabel?: boolean }) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, "/cart")}
      aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
      className={btn({
        variant: "ghost",
        size: withLabel ? "md" : "icon",
        className: cn("relative", withLabel && "px-3", !withLabel && "-me-2.5"),
      })}
    >
      <ShoppingBag />
      {withLabel && <span>السلة</span>}
      {count > 0 && (
        <span
          aria-hidden
          className={cn(
            "grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-primary px-1 text-[0.6875rem] font-bold leading-none text-primary-foreground tabular-nums",
            !withLabel && "absolute end-1 top-1.5",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default function ClassicHeader({ shell }: { shell: StoreShell }) {
  const cartCount = useCartCount(shell.slug);
  const [scrolled, setScrolled] = useState(false);
  const centered = shell.navbarVariant === "centered" || shell.navbarVariant === "allaia";
  const compact = shell.navbarVariant === "compact";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logo = (maxHeight: number, className?: string) => (
    <StoreLogo
      storeSlug={shell.slug}
      storeName={shell.name}
      logo={shell.logo}
      logoRadius={shell.logoRadius}
      logoSize={shell.logoSize}
      showStoreName={shell.showStoreName}
      maxHeight={maxHeight}
      className={className}
    />
  );

  return (
    <>
      {shell.announcementText?.trim() && <AnnouncementBar text={shell.announcementText.trim()} storeSlug={shell.slug} />}

      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md transition-[border-color,box-shadow] duration-(--c-motion) supports-[backdrop-filter]:bg-background/85",
          scrolled ? "border-border shadow-[0_1px_12px_-6px_rgb(0_0_0/0.15)]" : "border-border/70",
        )}
      >
        {/* ── Phones & tablets ─────────────────────────────────────────── */}
        <div className="c-container grid h-(--c-header-h) grid-cols-[minmax(5.5rem,1fr)_minmax(0,auto)_minmax(5.5rem,1fr)] items-center gap-1 lg:hidden">
          <div className="flex items-center">
            <MobileMenu shell={shell} cartCount={cartCount} />
          </div>
          {logo(36, "justify-self-center")}
          <div className="flex items-center justify-self-end">
            <MobileSearch shell={shell} />
            <CartButton storeSlug={shell.slug} count={cartCount} />
          </div>
        </div>

        {/* ── Desktop ──────────────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <div
            className={cn(
              "c-container grid h-(--c-header-h) items-center gap-8",
              centered ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-[auto_minmax(0,1fr)_auto]",
            )}
          >
            {centered ? (
              <>
                <SearchCombobox storeSlug={shell.slug} variant="inline" className="w-full max-w-sm" />
                {logo(52)}
              </>
            ) : (
              <>
                {logo(52, "max-w-64")}
                {compact ? (
                  <div className="flex min-w-0 items-center gap-6">
                    <DesktopNav shell={{ ...shell, categories: [] }} className="flex-1" />
                    <SearchCombobox storeSlug={shell.slug} variant="inline" className="w-72 shrink-0" />
                  </div>
                ) : (
                  <SearchCombobox storeSlug={shell.slug} variant="inline" className="mx-auto w-full max-w-xl" />
                )}
              </>
            )}
            <div className="flex items-center justify-self-end gap-1">
              <ThemeToggle />
              <CartButton storeSlug={shell.slug} count={cartCount} withLabel />
            </div>
          </div>

          {!compact && (
            <div className="border-t border-border/70">
              <DesktopNav shell={shell} className="c-container" />
            </div>
          )}
        </div>
      </header>
    </>
  );
}

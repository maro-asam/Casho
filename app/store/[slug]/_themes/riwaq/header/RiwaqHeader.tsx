"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { isActivePath, useStorePath } from "../../shared/store-path";
import { useCartCount } from "../../shared/use-cart-count";
import { num } from "../ui";
import MenuOverlay from "./MenuOverlay";
import SearchOverlay from "./SearchOverlay";
import StoreMark from "./StoreMark";
import ThemeToggle from "./ThemeToggle";

/** Inline categories in the masthead index row; the rest live on /categories. */
const INDEX_LIMIT = 8;

/** Cart count that pops whenever it changes. */
function Count({ value, className }: { value: number; className?: string }) {
  return (
    <span key={value} className={cn("rq-num inline-block", value > 0 && "rq-bump", className)}>
      {num(Math.min(value, 99))}
    </span>
  );
}

function PrimaryLinks({ shell, path }: { shell: StoreShell; path: string }) {
  const links = [
    { href: "/products", label: "كل المنتجات" },
    { href: "/categories", label: "التصنيفات" },
  ];
  return (
    <ul className="flex items-center gap-7">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={buildStoreUrl(shell.slug, l.href)}
            aria-current={isActivePath(path, l.href) ? "page" : undefined}
            className="rq-link inline-flex min-h-11 items-center text-[0.9375rem] font-semibold"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Actions({ shell, count, onSearch }: { shell: StoreShell; count: number; onSearch: () => void }) {
  return (
    <div className="flex items-center justify-end gap-5">
      <button
        type="button"
        onClick={onSearch}
        className="group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold"
        aria-haspopup="dialog"
      >
        <Search className="size-[1.125rem]" />
        <span className="rq-link">بحث</span>
      </button>
      <Link
        href={buildStoreUrl(shell.slug, "/cart")}
        aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
        className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold"
      >
        <ShoppingBag className="size-[1.125rem]" />
        <span className="rq-link">السلة</span>
        <span aria-hidden className="text-(--rq-accent)">
          (<Count value={count} />)
        </span>
      </Link>
    </div>
  );
}

export default function RiwaqHeader({ shell }: { shell: StoreShell }) {
  const count = useCartCount(shell.slug);
  const path = useStorePath(shell.slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Desktop: once the masthead scrolls away, a slim bar slides in.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const announcement = shell.announcementText?.trim();
  const categories = shell.categories;
  const href = (p: string) => buildStoreUrl(shell.slug, p);

  return (
    <>
      {/* ── Phones & tablets ─────────────────────────────────────────────── */}
      {announcement && (
        <div className="bg-(--rq-ink) text-(--rq-paper) lg:hidden">
          <p className="rq-wrap line-clamp-2 py-2 text-center text-xs font-medium leading-5">{announcement}</p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-(--rq-rule) bg-(--rq-paper)/95 backdrop-blur-md lg:hidden">
        <div className="rq-wrap grid h-(--rq-bar-h) grid-cols-[minmax(4.5rem,1fr)_minmax(0,auto)_minmax(4.5rem,1fr)] items-center gap-2">
          <MenuOverlay shell={shell} count={count} path={path} />
          <StoreMark shell={shell} className="justify-self-center" />
          <div className="-me-2.5 flex items-center justify-self-end">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
              aria-haspopup="dialog"
              className="grid size-11 place-items-center [&_svg]:size-5"
            >
              <Search />
            </button>
            <Link
              href={href("/cart")}
              aria-label={count > 0 ? `السلة، فيها ${count} منتج` : "السلة"}
              className="relative grid size-11 place-items-center [&_svg]:size-5"
            >
              <ShoppingBag />
              {count > 0 && (
                <span
                  aria-hidden
                  className="absolute end-0.5 top-1 grid h-[1.125rem] min-w-[1.125rem] place-items-center bg-(--rq-accent) px-1 text-[0.6875rem] font-bold leading-none text-(--rq-accent-ink)"
                >
                  <Count value={count} />
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Desktop masthead ─────────────────────────────────────────────── */}
      <header className="hidden lg:block">
        <div className="border-b border-(--rq-rule)">
          <div className="rq-wrap flex h-10 items-center justify-between gap-8 text-[0.8125rem]">
            <p className="min-w-0 truncate text-(--rq-quiet)">{announcement || shell.description || ""}</p>
            <ul className="flex shrink-0 items-center gap-6">
              <li>
                <Link href={href("/about")} aria-current={isActivePath(path, "/about") ? "page" : undefined} className="rq-link">
                  عن المتجر
                </Link>
              </li>
              <li>
                <Link href={href("/contact")} aria-current={isActivePath(path, "/contact") ? "page" : undefined} className="rq-link">
                  تواصل معنا
                </Link>
              </li>
              <li className="-me-3">
                <ThemeToggle className="size-10" />
              </li>
            </ul>
          </div>
        </div>

        <div className="rq-wrap grid h-24 grid-cols-[1fr_auto_1fr] items-center gap-10">
          <nav aria-label="القائمة الرئيسية">
            <PrimaryLinks shell={shell} path={path} />
          </nav>
          <StoreMark shell={shell} size="lg" className="max-w-[28rem]" />
          <Actions shell={shell} count={count} onSearch={() => setSearchOpen(true)} />
        </div>

        {categories.length > 0 && (
          <nav aria-label="التصنيفات" className="border-y border-(--rq-ink)">
            <ul className="rq-wrap rq-rail h-12 items-center justify-center gap-9">
              {categories.slice(0, INDEX_LIMIT).map((c) => (
                <li key={c.id} className="shrink-0">
                  <Link
                    href={href(`/categories/${c.slug}`)}
                    aria-current={isActivePath(path, `/categories/${c.slug}`) ? "page" : undefined}
                    className="rq-link inline-flex max-w-48 items-center text-sm aria-[current=page]:text-(--rq-accent)"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="rq-sup">{num(c.productCount)}</span>
                  </Link>
                </li>
              ))}
              {categories.length > INDEX_LIMIT && (
                <li className="shrink-0">
                  <Link href={href("/categories")} className="rq-link text-sm font-semibold text-(--rq-accent)">
                    كل التصنيفات
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>
      <div ref={sentinel} aria-hidden className="hidden h-px lg:block" />

      {/* ── Desktop compact bar (after the masthead scrolls away) ────────── */}
      <div
        inert={!compact}
        className={cn(
          "fixed inset-x-0 top-0 z-40 hidden border-b border-(--rq-rule) bg-(--rq-paper)/95 backdrop-blur-md transition-transform duration-(--rq-dur) ease-(--rq-ease-out) lg:block",
          compact ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="rq-wrap grid h-(--rq-bar-h) grid-cols-[1fr_auto_1fr] items-center gap-10">
          <PrimaryLinks shell={shell} path={path} />
          <StoreMark shell={shell} />
          <Actions shell={shell} count={count} onSearch={() => setSearchOpen(true)} />
        </div>
      </div>

      <SearchOverlay shell={shell} open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

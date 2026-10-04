"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Clock, Loader2, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { SearchStoreProductsAction, type SearchSuggestion } from "@/actions/store/storefront-search.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData, StoreShell } from "../../types";
import { storeHref } from "../../shared/store-path";
import { useLocalList } from "../lib/local-list";
import { Arrow, MD_PORTAL, PlateImage, num } from "../ui";

/** Instant search: drops under the header on desktop, full screen on phones.
 *  Empty state = recent searches, categories and featured products. */
export default function SearchPanel({ shell, open, onOpenChange }: { shell: StoreShell; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useLocalList(`mada:searches:${shell.slug}`, 6);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [active, setActive] = useState(-1);
  const [featured, setFeatured] = useState<ProductCardData[] | null>(null);
  const [loading, startLoading] = useTransition();
  const term = value.trim();

  useEffect(() => {
    if (!open || featured) return;
    GetStorefrontCardsAction(shell.slug, { take: 4 }).then(setFeatured).catch(() => setFeatured([]));
  }, [open, featured, shell.slug]);

  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      startLoading(async () => {
        try {
          setResults(await SearchStoreProductsAction(shell.slug, term));
          setSearchedFor(term);
          setActive(-1);
        } catch {
          setResults([]);
        }
      });
    }, 200);
    return () => clearTimeout(t);
  }, [term, shell.slug]);

  const go = (path: string, remember?: string) => {
    if (remember) recent.pushFront(remember);
    onOpenChange(false);
    router.push(storeHref(shell.slug, path));
  };
  const searchAll = (q: string) => go(`/products${q ? `?search=${encodeURIComponent(q)}` : ""}`, q || undefined);

  const showResults = term.length >= 2;
  const matchedCats = showResults ? shell.categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5) : [];
  const noResults = showResults && !loading && searchedFor === term && results.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.45)] backdrop-blur-[2px]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(MD_PORTAL, "md-pop fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-(--md-bg) outline-none lg:h-auto lg:max-h-[86dvh] lg:rounded-b-[1.75rem] lg:shadow-2xl")}
        >
          <Dialog.Title className="sr-only">البحث في {shell.name}</Dialog.Title>
          <div className="md-wrap flex shrink-0 items-center gap-3 py-3 lg:py-5">
            <form
              role="search"
              className="relative min-w-0 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`, term);
                searchAll(term);
              }}
            >
              <label htmlFor={`${id}-q`} className="sr-only">ابحث في المتجر</label>
              <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-(--md-quiet)" />
              <input
                ref={inputRef}
                id={`${id}-q`}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                role="combobox"
                aria-expanded={showResults && results.length > 0}
                aria-controls={`${id}-list`}
                aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
                aria-autocomplete="list"
                placeholder="ابحث عن منتج، تصنيف…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((i) => Math.min(results.length - 1, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((i) => Math.max(-1, i - 1));
                  }
                }}
                className="md-field h-14 rounded-full pe-12 ps-12 text-base lg:h-16 lg:text-lg"
              />
              {value && (
                <button type="button" onClick={() => { setValue(""); inputRef.current?.focus(); }} aria-label="مسح البحث" className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-(--md-quiet) hover:bg-(--md-studio)">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                </button>
              )}
            </form>
            <Dialog.Close className="md-btn md-btn--ghost md-btn--sm shrink-0">إغلاق</Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="md-wrap pb-8 pt-2">
              {showResults ? (
                <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
                  {matchedCats.length > 0 && (
                    <section>
                      <h2 className="mb-2 text-xs font-semibold text-(--md-quiet)">تصنيفات</h2>
                      <ul className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                        {matchedCats.map((c) => (
                          <li key={c.id}>
                            <Dialog.Close asChild>
                              <Link href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} className="md-chip">
                                {c.name}
                                <span className="text-xs opacity-60">{num(c.productCount)}</span>
                              </Link>
                            </Dialog.Close>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section className={cn(matchedCats.length === 0 && "lg:col-span-2")}>
                    <h2 className="mb-2 text-xs font-semibold text-(--md-quiet)">منتجات</h2>
                    {noResults ? (
                      <div className="rounded-2xl bg-(--md-surface) p-6">
                        <p className="font-semibold">مفيش منتجات باسم «{term}»</p>
                        <p className="mt-1 text-sm text-(--md-quiet)">جرب كلمة أبسط، أو اختار تصنيف من تحت.</p>
                      </div>
                    ) : (
                      <ul id={`${id}-list`} role="listbox" aria-label="نتائج البحث" className="md-stagger grid gap-2 sm:grid-cols-2">
                        {results.map((r, i) => (
                          <li
                            key={r.id}
                            id={`${id}-opt-${i}`}
                            role="option"
                            aria-selected={active === i}
                            style={{ "--i": i } as React.CSSProperties}
                            onMouseEnter={() => setActive(i)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => go(`/products/${r.slug}`, term)}
                            className={cn("flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors", active === i ? "bg-(--md-surface) shadow-sm" : "hover:bg-(--md-surface)")}
                          >
                            <span className="md-media size-16 shrink-0 rounded-xl">
                              <PlateImage src={r.image} sizes="64px" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-sm font-medium leading-6">{r.name}</span>
                              <span className={cn("md-price text-sm", r.compareAtPrice && r.compareAtPrice > r.price && "text-(--md-sale)")}>{formatPrice(r.price)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(term)} className="md-btn md-btn--outline md-btn--sm mt-4">
                      عرض كل النتائج لـ «{term}»
                      <Arrow />
                    </button>
                  </section>
                </div>
              ) : (
                <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14">
                  <div className="space-y-8">
                    {recent.list.length > 0 && (
                      <section>
                        <div className="mb-2 flex items-center justify-between">
                          <h2 className="text-xs font-semibold text-(--md-quiet)">عمليات بحث سابقة</h2>
                          <button type="button" onClick={() => recent.list.forEach((q) => recent.remove(q))} className="min-h-9 px-2 text-xs font-semibold text-(--md-quiet) hover:text-(--md-ink)">
                            مسح
                          </button>
                        </div>
                        <ul className="flex flex-wrap gap-2">
                          {recent.list.map((q) => (
                            <li key={q}>
                              <button type="button" onClick={() => searchAll(q)} className="md-chip">
                                <Clock className="size-3.5 opacity-60" />
                                {q}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {shell.categories.length > 0 && (
                      <section>
                        <h2 className="mb-2 text-xs font-semibold text-(--md-quiet)">تصفّح التصنيفات</h2>
                        <ul className="flex flex-wrap gap-2">
                          {shell.categories.slice(0, 10).map((c) => (
                            <li key={c.id}>
                              <Dialog.Close asChild>
                                <Link href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} className="md-chip">{c.name}</Link>
                              </Dialog.Close>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                  <section>
                    <h2 className="mb-3 text-xs font-semibold text-(--md-quiet)">مختارات من المتجر</h2>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(featured ?? Array.from({ length: 4 }, () => null)).map((p, i) => (
                        <li key={p?.id ?? i}>
                          {p ? (
                            <Dialog.Close asChild>
                              <Link href={buildStoreUrl(shell.slug, `/products/${p.slug}`)} className="group block">
                                <span className="md-media block aspect-[4/5]">
                                  <PlateImage src={p.image} sizes="(max-width: 640px) 45vw, 12rem" className="transition-transform duration-500 group-hover:scale-105" />
                                </span>
                                <span className="mt-2 line-clamp-1 block text-sm font-medium">{p.name}</span>
                                <span className="md-price block text-sm">{formatPrice(p.price)}</span>
                              </Link>
                            </Dialog.Close>
                          ) : (
                            <div className="md-skel aspect-[4/5]" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

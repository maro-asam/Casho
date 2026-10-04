"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { SearchStoreProductsAction, type SearchSuggestion } from "@/actions/store/storefront-search.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { storeHref } from "../../shared/store-path";
import { Arrow, RQ_PORTAL, idx, PlateImage } from "../ui";

const RECENT_MAX = 6;

function readRecent(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {}
}

/** One search for every screen: a paper sheet that drops from the top
 *  (full-screen on phones) with a big underlined field, recent searches,
 *  categories, and live product suggestions. */
export default function SearchOverlay({
  shell,
  open,
  onOpenChange,
}: {
  shell: StoreShell;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const recentKey = `rq:recent:${shell.slug}`;

  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [active, setActive] = useState(-1);
  // Only rendered inside the open dialog, so reading storage up front is safe.
  const [recent, setRecent] = useState<string[]>(() => (typeof window === "undefined" ? [] : readRecent(recentKey)));
  const [loading, startLoading] = useTransition();

  const term = value.trim();

  // Debounced suggestions
  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      startLoading(async () => {
        try {
          const rows = await SearchStoreProductsAction(shell.slug, term);
          setResults(rows);
          setSearchedFor(term);
          setActive(-1);
        } catch {
          setResults([]);
        }
      });
    }, 220);
    return () => clearTimeout(t);
  }, [term, shell.slug]);

  const remember = (q: string) => {
    if (!q) return;
    const next = [q, ...recent.filter((r) => r !== q)];
    setRecent(next.slice(0, RECENT_MAX));
    writeRecent(recentKey, next);
  };

  const go = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const searchFor = (q: string) => {
    remember(q);
    go(storeHref(shell.slug, `/products${q ? `?search=${encodeURIComponent(q)}` : ""}`));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) {
      remember(term);
      go(storeHref(shell.slug, `/products/${results[active].slug}`));
      return;
    }
    searchFor(term);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    }
  };

  const showResults = term.length >= 2;
  const noResults = !loading && searchedFor === term && results.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgb(29_26_22/0.55)] data-[state=open]:animate-[rq-fade_200ms_ease-out]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            RQ_PORTAL,
            "fixed inset-x-0 top-0 z-50 flex h-dvh flex-col outline-none lg:h-auto lg:max-h-[85dvh] lg:border-b lg:border-(--rq-ink)",
            "data-[state=open]:animate-[rq-rise_320ms_cubic-bezier(.16,1,.3,1)]",
          )}
        >
          <Dialog.Title className="sr-only">البحث في {shell.name}</Dialog.Title>

          <div className="rq-wrap shrink-0 pt-3 lg:pt-8">
            <div className="flex items-center gap-3">
              <form role="search" onSubmit={submit} className="relative min-w-0 flex-1">
                <label htmlFor={`${listId}-q`} className="sr-only">
                  ابحث في المتجر
                </label>
                <Search aria-hidden className="pointer-events-none absolute start-0 top-1/2 size-5 -translate-y-1/2 text-(--rq-quiet) lg:size-7" />
                <input
                  ref={inputRef}
                  id={`${listId}-q`}
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showResults && results.length > 0}
                  aria-controls={`${listId}-list`}
                  aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
                  aria-autocomplete="list"
                  placeholder="بتدوّر على إيه؟"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="rq-field rq-face h-14 pe-10 ps-8 text-[1.375rem] font-semibold lg:h-20 lg:ps-12 lg:text-[2.25rem]"
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("");
                      inputRef.current?.focus();
                    }}
                    aria-label="مسح البحث"
                    className="absolute end-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-(--rq-quiet) hover:text-(--rq-ink)"
                  >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : <X className="size-5" />}
                  </button>
                )}
              </form>
              <Dialog.Close className="-me-2 inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-semibold hover:text-(--rq-accent)">
                إغلاق
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="rq-wrap pb-10 pt-6 lg:pt-8">
              {showResults ? (
                <>
                  <ul id={`${listId}-list`} role="listbox" aria-label="اقتراحات البحث" className="rq-stagger">
                    {results.map((item, i) => {
                      const onSale = !!item.compareAtPrice && item.compareAtPrice > item.price;
                      return (
                        <li
                          key={item.id}
                          id={`${listId}-opt-${i}`}
                          role="option"
                          aria-selected={active === i}
                          style={{ "--i": i } as React.CSSProperties}
                          onMouseEnter={() => setActive(i)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            remember(term);
                            go(storeHref(shell.slug, `/products/${item.slug}`));
                          }}
                          className={cn(
                            "grid cursor-pointer grid-cols-[auto_3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-(--rq-rule) py-3 transition-colors",
                            active === i && "bg-(--rq-sheet)",
                          )}
                        >
                          <span className="rq-num w-6 text-xs text-(--rq-quiet)">{idx(i + 1)}</span>
                          <span className="rq-plate relative aspect-[4/5] w-14 overflow-hidden">
                            <PlateImage src={item.image} sizes="56px" />
                          </span>
                          <span className="min-w-0 truncate text-[0.9375rem] font-medium">{item.name}</span>
                          <span className={cn("rq-price text-[0.9375rem]", onSale && "text-(--rq-accent)")}>{formatPrice(item.price)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {noResults && (
                    <div className="py-8">
                      <p className="rq-h3">مفيش منتجات باسم «{term}»</p>
                      <p className="rq-small mt-2 text-(--rq-quiet)">جرب كلمة أبسط، أو تصفّح التصنيفات تحت.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => searchFor(term)}
                    className="group mt-2 flex min-h-14 w-full items-center justify-between gap-3 text-start text-[0.9375rem] font-semibold"
                  >
                    <span className="rq-link truncate">عرض كل النتائج لـ «{term}»</span>
                    <Arrow />
                  </button>
                </>
              ) : null}

              {(!showResults || noResults) && (
                <div className={cn("grid gap-10 md:grid-cols-2 md:gap-16", showResults && "mt-8")}>
                  {recent.length > 0 && !showResults && (
                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="rq-label">عمليات بحث سابقة</h2>
                        <button
                          type="button"
                          onClick={() => {
                            setRecent([]);
                            writeRecent(recentKey, []);
                          }}
                          className="rq-btn rq-btn--text rq-btn--sm text-xs text-(--rq-quiet)"
                        >
                          مسح
                        </button>
                      </div>
                      <ul>
                        {recent.map((r) => (
                          <li key={r} className="border-b border-(--rq-rule)">
                            <button
                              type="button"
                              onClick={() => searchFor(r)}
                              className="group flex min-h-12 w-full items-center justify-between gap-3 text-start text-[0.9375rem]"
                            >
                              <span className="truncate">{r}</span>
                              <Arrow className="text-(--rq-quiet)" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {shell.categories.length > 0 && (
                    <section>
                      <h2 className="rq-label mb-3">تصفّح التصنيفات</h2>
                      <ul className="flex flex-wrap gap-2">
                        {shell.categories.map((c) => (
                          <li key={c.id}>
                            <Dialog.Close asChild>
                              <Link href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} className="rq-opt text-sm">
                                {c.name}
                              </Link>
                            </Dialog.Close>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Clock, Loader2, Search, X } from "lucide-react";

import { SearchStoreProductsAction, type SearchSuggestion } from "@/actions/store/storefront-search.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData, StoreShell } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { storeHref } from "../../shared/store-path";
import { searchesKey } from "../lib/events";
import { Chevron, PlateImage, Price } from "../ui";

type Item = Pick<SearchSuggestion, "id" | "name" | "slug" | "image" | "price" | "compareAtPrice">;

function Row({ item, id, active, onPick, onHover }: { item: Item; id?: string; active?: boolean; onPick: () => void; onHover?: () => void }) {
  return (
    <button
      type="button"
      id={id}
      role={id ? "option" : undefined}
      aria-selected={id ? active : undefined}
      tabIndex={id ? -1 : 0}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn("flex w-full items-center gap-3 rounded-(--mx-r) p-2 text-start transition-colors hover:bg-(--mx-band)", active && "bg-(--mx-band)")}
    >
      <span className="mx-media size-14 shrink-0 rounded-(--mx-r-sm)">
        <PlateImage src={item.image} sizes="56px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-5 text-(--mx-ink)">{item.name}</span>
        <Price price={item.price} compareAt={item.compareAtPrice} size="sm" chip={false} className="mt-0.5" />
      </span>
    </button>
  );
}

/** Maximize's wide search bar: an "All categories" scope select, the input
 *  and a search button, with a predictive panel under it (recent searches,
 *  store picks, matching categories and products, keyboard navigation). */
export default function SearchBar({ shell, className, autoFocus }: { shell: StoreShell; className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useLocalList(searchesKey(shell.slug), 6);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [scope, setScope] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const [picks, setPicks] = useState<ProductCardData[] | null>(null);
  const [loading, startLoading] = useTransition();
  const term = value.trim();
  const showResults = term.length >= 2;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!open || picks) return;
    GetStorefrontCardsAction(shell.slug, { take: 4 }).then(setPicks).catch(() => setPicks([]));
  }, [open, picks, shell.slug]);

  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      startLoading(async () => {
        try {
          setResults(await SearchStoreProductsAction(shell.slug, term));
          setFailed(false);
        } catch {
          setResults([]);
          setFailed(true);
        }
        setSearchedFor(term);
        setActive(-1);
      });
    }, 220);
    return () => clearTimeout(t);
  }, [term, shell.slug]);

  // Close on outside pointer / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (path: string, remember?: string) => {
    if (remember) recent.pushFront(remember);
    setOpen(false);
    inputRef.current?.blur();
    router.push(storeHref(shell.slug, path));
  };
  const searchAll = (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (scope) params.set("category", scope);
    const qs = params.toString();
    go(`/products${qs ? `?${qs}` : ""}`, q || undefined);
  };

  const matchedCats = showResults ? shell.categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5) : [];
  const noResults = showResults && !loading && searchedFor === term && results.length === 0;
  const listId = `${id}-list`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`, term);
          searchAll(term);
        }}
        className="flex h-12 items-center gap-1.5 rounded-(--mx-r) border border-(--mx-line) bg-(--mx-bg) p-1 transition-[border-color,box-shadow] focus-within:border-(--mx-btn) focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--mx-btn)_15%,transparent)]"
      >
        {shell.categories.length > 0 && (
          <>
            <label htmlFor={`${id}-scope`} className="sr-only">
              ابحث في
            </label>
            <select
              id={`${id}-scope`}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="mx-select hidden h-full max-w-44 shrink-0 truncate rounded-(--mx-r-sm) bg-(--mx-band) ps-3 text-[0.8125rem] font-medium text-(--mx-ink) outline-none sm:block"
            >
              <option value="">كل التصنيفات</option>
              {shell.categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor={`${id}-q`} className="sr-only">
          ابحث في المتجر
        </label>
        <input
          ref={inputRef}
          id={`${id}-q`}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="بتدوّر على إيه؟"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(-1, i - 1));
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-base text-(--mx-ink) outline-none placeholder:text-(--mx-quiet) sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            aria-label="مسح البحث"
            className="grid size-9 shrink-0 place-items-center rounded-full text-(--mx-quiet) hover:text-(--mx-ink) [&_svg]:size-4"
          >
            <X />
          </button>
        )}
        <button type="submit" aria-label="بحث" className="grid size-10 shrink-0 place-items-center rounded-(--mx-r-sm) text-(--mx-ink) transition-colors hover:bg-(--mx-band) [&_svg]:size-5">
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
        </button>
      </form>

      {open && (
        <div className="mx-pop absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70dvh,36rem)] overflow-y-auto overscroll-contain rounded-(--mx-r-lg) border border-(--mx-line) bg-(--mx-surface) p-4 shadow-(--mx-shadow)">
          {showResults ? (
            <div className="space-y-5">
              {matchedCats.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-semibold text-(--mx-quiet)">تصنيفات</h2>
                  <ul className="flex flex-wrap gap-2">
                    {matchedCats.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)}
                          onClick={() => setOpen(false)}
                          className="inline-flex min-h-9 items-center rounded-full bg-(--mx-band) px-3.5 text-sm font-medium text-(--mx-ink) hover:text-(--mx-link)"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h2 className="mb-1 text-xs font-semibold text-(--mx-quiet)">منتجات</h2>
                {failed ? (
                  <p className="py-3 text-sm text-(--mx-error)">البحث مش شغال دلوقتي، جرّب تاني.</p>
                ) : loading && searchedFor !== term ? (
                  <div className="grid gap-2 sm:grid-cols-2" aria-busy>
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="mx-skel size-14 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="mx-skel h-3.5 w-4/5" />
                          <div className="mx-skel h-3.5 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : noResults ? (
                  <p className="py-3 text-sm">
                    مفيش نتائج لـ «<span className="font-semibold text-(--mx-ink)">{term}</span>». جرّب كلمة أبسط.
                  </p>
                ) : (
                  <ul id={listId} role="listbox" aria-label="نتائج البحث" className="grid gap-1 sm:grid-cols-2">
                    {results.map((r, i) => (
                      <li key={r.id} role="presentation">
                        <Row item={r} id={`${id}-opt-${i}`} active={active === i} onHover={() => setActive(i)} onPick={() => go(`/products/${r.slug}`, term)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(term)} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-(--mx-link) hover:underline">
                كل النتائج لـ «{term}»
                <Chevron double />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {recent.list.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-(--mx-quiet)">بحثت عن</h2>
                    <button type="button" onClick={() => recent.list.forEach((q) => recent.remove(q))} className="min-h-8 text-xs text-(--mx-quiet) hover:text-(--mx-ink) hover:underline">
                      مسح
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {recent.list.map((q) => (
                      <li key={q}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(q)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-(--mx-band) px-3.5 text-sm text-(--mx-ink) hover:text-(--mx-link)">
                          <Clock className="size-3.5 text-(--mx-quiet)" />
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section id={listId}>
                <h2 className="mb-1 text-xs font-semibold text-(--mx-quiet)">مختارات من المتجر</h2>
                {picks === null ? (
                  <div className="grid gap-2 sm:grid-cols-2" aria-busy>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <div className="mx-skel size-14 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="mx-skel h-3.5 w-4/5" />
                          <div className="mx-skel h-3.5 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : picks.length > 0 ? (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {picks.map((p) => (
                      <li key={p.id}>
                        <Row item={p} onPick={() => go(`/products/${p.slug}`)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-2 text-sm text-(--mx-quiet)">اكتب اسم المنتج اللي بتدوّر عليه.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

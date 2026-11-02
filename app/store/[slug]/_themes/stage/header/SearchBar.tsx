"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowLeft, Clock, Loader2, Search, X } from "lucide-react";

import { SearchStoreProductsAction, type SearchSuggestion } from "@/actions/store/storefront-search.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData, StoreShell } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { storeHref } from "../../shared/store-path";
import { searchesKey } from "../lib/events";
import { PlateImage, Price } from "../ui";

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
      className={cn("flex w-full items-center gap-3 rounded-(--sg-r-sm) p-2 text-start transition-colors hover:bg-(--sg-fill)", active && "bg-(--sg-fill)")}
    >
      <span className="sg-media relative size-14 shrink-0 rounded-(--sg-r-sm)">
        <PlateImage src={item.image} sizes="56px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-5 text-(--sg-ink)">{item.name}</span>
        <Price price={item.price} compareAt={item.compareAtPrice} size="sm" className="mt-0.5" />
      </span>
    </button>
  );
}

/** apple.com's quick link: an arrow and a short label. */
function QuickLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="sg-quicklink">
      <ArrowLeft aria-hidden className="ltr:rotate-180" />
      {children}
    </Link>
  );
}

/** The search field with its panel underneath: recent searches, quick links to
 *  shelves and store picks; while typing, matching shelves and products with
 *  ↑/↓ + Enter. */
export default function SearchBar({
  shell,
  className,
  autoFocus,
  onDone,
}: {
  shell: Pick<StoreShell, "slug" | "categories">;
  className?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useLocalList(searchesKey(shell.slug), 6);
  const [value, setValue] = useState("");
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
    if (picks) return;
    GetStorefrontCardsAction(shell.slug, { take: 4 }).then(setPicks).catch(() => setPicks([]));
  }, [picks, shell.slug]);

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

  const go = (path: string, remember?: string) => {
    if (remember) recent.pushFront(remember);
    inputRef.current?.blur();
    onDone?.();
    router.push(storeHref(shell.slug, path));
  };
  const searchAll = (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const qs = params.toString();
    go(`/products${qs ? `?${qs}` : ""}`, q || undefined);
  };

  const matchedCats = showResults ? shell.categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5) : [];
  const shelves = shell.categories.filter((c) => c.productCount > 0).slice(0, 5);
  const noResults = showResults && !loading && searchedFor === term && results.length === 0;
  const listId = `${id}-list`;

  return (
    <div className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`, term);
          searchAll(term);
        }}
        className="sg-search"
      >
        <label htmlFor={`${id}-q`} className="sr-only">
          ابحث في المتجر
        </label>
        <Search aria-hidden className="size-6 shrink-0 text-(--sg-label-2)" />
        <input
          ref={inputRef}
          id={`${id}-q`}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="دوّر في المتجر"
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
          className="h-full min-w-0 flex-1 bg-transparent text-[1.5rem] font-semibold text-(--sg-ink) outline-none placeholder:font-normal placeholder:text-(--sg-label-3) sm:text-[1.75rem] [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            aria-label="مسح البحث"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-(--sg-fill) text-(--sg-label-2) hover:text-(--sg-ink) [&_svg]:size-4"
          >
            <X />
          </button>
        )}
        {loading && <Loader2 aria-hidden className="size-5 shrink-0 animate-spin text-(--sg-label-2)" />}
      </form>

      <div className="sg-search-panel">
        {showResults ? (
          <div className="space-y-6">
            {matchedCats.length > 0 && (
              <section>
                <h2 className="sg-fly-label">أقسام</h2>
                <ul>
                  {matchedCats.map((c) => (
                    <li key={c.id}>
                      <QuickLink href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} onClick={onDone}>
                        {c.name}
                      </QuickLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h2 className="sg-fly-label">منتجات</h2>
              {failed ? (
                <p className="py-3 text-sm text-(--sg-error)">البحث مش شغال دلوقتي، جرّب تاني.</p>
              ) : loading && searchedFor !== term ? (
                <div className="grid gap-2 sm:grid-cols-2" aria-busy>
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="sg-skel size-14 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="sg-skel h-3.5 w-4/5" />
                        <div className="sg-skel h-3.5 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : noResults ? (
                <p className="py-3 text-sm text-(--sg-label-2)">
                  مفيش نتائج لـ «<span className="font-semibold text-(--sg-ink)">{term}</span>». جرّب كلمة أبسط.
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
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(term)} className="sg-link text-[0.9375rem]">
              كل النتائج لـ «{term}» ›
            </button>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-7 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div className="space-y-7">
              {recent.list.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <h2 className="sg-fly-label">بحثت عن</h2>
                    <button type="button" onClick={() => recent.list.forEach((q) => recent.remove(q))} className="min-h-8 text-xs text-(--sg-label-2) hover:text-(--sg-ink) hover:underline">
                      مسح
                    </button>
                  </div>
                  <ul>
                    {recent.list.map((q) => (
                      <li key={q}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(q)} className="sg-quicklink">
                          <Clock aria-hidden />
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h2 className="sg-fly-label">روابط سريعة</h2>
                <ul>
                  {shelves.map((c) => (
                    <li key={c.id}>
                      <QuickLink href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} onClick={onDone}>
                        {c.name}
                      </QuickLink>
                    </li>
                  ))}
                  <li>
                    <QuickLink href={buildStoreUrl(shell.slug, "/track")} onClick={onDone}>
                      تتبّع طلبك
                    </QuickLink>
                  </li>
                </ul>
              </section>
            </div>
            <section id={listId}>
              <h2 className="sg-fly-label">مختارات من المتجر</h2>
              {picks === null ? (
                <div className="grid gap-2 sm:grid-cols-2" aria-busy>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="sg-skel size-14 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="sg-skel h-3.5 w-4/5" />
                        <div className="sg-skel h-3.5 w-1/3" />
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
                <p className="py-2 text-sm text-(--sg-label-2)">اكتب اسم المنتج اللي بتدوّر عليه.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

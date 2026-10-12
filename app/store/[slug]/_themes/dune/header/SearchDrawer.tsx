"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { SearchStoreProductsAction, type SearchSuggestion } from "@/actions/store/storefront-search.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData, StoreShell } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { storeHref } from "../../shared/store-path";
import { searchesKey } from "../lib/events";
import { Arrow, DN_PORTAL, PlateImage, Price, stagger } from "../ui";

type Item = Pick<SearchSuggestion, "id" | "name" | "slug" | "image" | "price" | "compareAtPrice">;

function ResultTile({ item, id, active, onPick }: { item: Item; id?: string; active?: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      id={id}
      role={id ? "option" : undefined}
      aria-selected={id ? active : undefined}
      tabIndex={id ? -1 : 0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="group block w-full text-start"
    >
      <span className={cn("dn-media block aspect-square ring-offset-2 ring-offset-(--dn-drawer) transition", active && "ring-1 ring-(--dn-ink)")}>
        <PlateImage src={item.image} sizes="(max-width: 768px) 45vw, 14rem" className="dn-zoom-img" />
      </span>
      <span className="mt-2.5 line-clamp-2 block text-sm leading-6">{item.name}</span>
      <Price price={item.price} compareAt={item.compareAtPrice} size="sm" className="mt-0.5" />
    </button>
  );
}

/** Predictive search: drops from the top over the header (full screen on
 *  phones). Empty state = recent searches, categories and store picks. */
export default function SearchDrawer({ shell, open, onOpenChange }: { shell: StoreShell; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useLocalList(searchesKey(shell.slug), 6);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [active, setActive] = useState(-1);
  const [picks, setPicks] = useState<ProductCardData[] | null>(null);
  const [loading, startLoading] = useTransition();
  const term = value.trim();

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
          setSearchedFor(term);
          setActive(-1);
        } catch {
          setResults([]);
        }
      });
    }, 220);
    return () => clearTimeout(t);
  }, [term, shell.slug]);

  const go = (path: string, remember?: string) => {
    if (remember) recent.pushFront(remember);
    onOpenChange(false);
    router.push(storeHref(shell.slug, path));
  };
  const searchAll = (q: string) => go(`/products${q ? `?search=${encodeURIComponent(q)}` : ""}`, q || undefined);

  const showResults = term.length >= 2;
  const matchedCats = showResults ? shell.categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 6) : [];
  const noResults = showResults && !loading && searchedFor === term && results.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dn-scrim fixed inset-0 z-50 bg-[rgb(29_29_28/0.45)]" />
        <Dialog.Content
          dir={shell.dir}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(DN_PORTAL, "dn-drop fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-(--dn-drawer) outline-none lg:h-auto lg:max-h-[88dvh]")}
        >
          <Dialog.Title className="sr-only">البحث في {shell.name}</Dialog.Title>
          <div className="border-b border-(--dn-line)">
            <div className="dn-wrap flex h-20 items-center gap-3 lg:h-24">
              <form
                role="search"
                className="relative flex min-w-0 flex-1 items-center gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`, term);
                  searchAll(term);
                }}
              >
                <Search aria-hidden className="size-6 shrink-0 text-(--dn-quiet)" strokeWidth={1.25} />
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
                  aria-expanded={showResults && results.length > 0}
                  aria-controls={`${id}-list`}
                  aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
                  aria-autocomplete="list"
                  placeholder="ابحث في المتجر…"
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
                  className="dn-serif h-14 min-w-0 flex-1 bg-transparent text-[1.75rem] outline-none placeholder:text-(--dn-quiet) lg:text-[2.25rem] [&::-webkit-search-cancel-button]:appearance-none"
                />
                {loading && <Loader2 aria-hidden className="size-5 shrink-0 animate-spin text-(--dn-quiet)" />}
              </form>
              <Dialog.Close className="dn-icon -me-2.5 shrink-0" aria-label="إغلاق البحث">
                <X />
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="dn-wrap py-8 lg:py-10">
              {showResults ? (
                <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
                  <section>
                    <h2 className="dn-label mb-3 text-(--dn-quiet)">تصنيفات</h2>
                    {matchedCats.length > 0 ? (
                      <ul className="space-y-1">
                        {matchedCats.map((c) => (
                          <li key={c.id}>
                            <Dialog.Close asChild>
                              <Link href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} className="inline-flex min-h-10 items-center text-[0.9375rem]">
                                <span className="dn-link">{c.name}</span>
                              </Link>
                            </Dialog.Close>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-(--dn-quiet)">مفيش تصنيف بالاسم ده.</p>
                    )}
                  </section>
                  <section>
                    <h2 className="dn-label mb-4 text-(--dn-quiet)">منتجات</h2>
                    {noResults ? (
                      <div>
                        <p className="dn-h3">مفيش نتائج لـ «{term}»</p>
                        <p className="mt-2 text-sm text-(--dn-quiet)">جرّب كلمة أبسط أو تصفح التصنيفات.</p>
                      </div>
                    ) : (
                      <ul id={`${id}-list`} role="listbox" aria-label="نتائج البحث" className="dn-stagger grid grid-cols-2 gap-x-(--dn-gap) gap-y-7 sm:grid-cols-3 xl:grid-cols-6">
                        {results.map((r, i) => (
                          <li key={r.id} role="presentation" style={stagger(i)} onMouseEnter={() => setActive(i)}>
                            <ResultTile item={r} id={`${id}-opt-${i}`} active={active === i} onPick={() => go(`/products/${r.slug}`, term)} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => searchAll(term)} className={cn("dn-btn dn-btn--outline dn-btn--sm mt-8")}>
                      كل النتائج لـ «{term}»
                      <Arrow />
                    </button>
                  </section>
                </div>
              ) : (
                <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
                  <div className="space-y-9">
                    {recent.list.length > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="dn-label text-(--dn-quiet)">بحثت عن</h2>
                          <button type="button" onClick={() => recent.list.forEach((q) => recent.remove(q))} className="min-h-9 text-xs text-(--dn-quiet) underline-offset-4 hover:text-(--dn-ink) hover:underline">
                            مسح
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {recent.list.map((q) => (
                            <li key={q}>
                              <button type="button" onClick={() => searchAll(q)} className="inline-flex min-h-10 items-center text-[0.9375rem]">
                                <span className="dn-link">{q}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {shell.categories.length > 0 && (
                      <section>
                        <h2 className="dn-label mb-3 text-(--dn-quiet)">التصنيفات</h2>
                        <ul className="space-y-1">
                          {shell.categories.slice(0, 8).map((c) => (
                            <li key={c.id}>
                              <Dialog.Close asChild>
                                <Link href={buildStoreUrl(shell.slug, `/categories/${c.slug}`)} className="inline-flex min-h-10 items-center text-[0.9375rem]">
                                  <span className="dn-link">{c.name}</span>
                                </Link>
                              </Dialog.Close>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                  <section>
                    <h2 className="dn-label mb-4 text-(--dn-quiet)">مختارات من المتجر</h2>
                    <ul className="grid grid-cols-2 gap-x-(--dn-gap) gap-y-7 sm:grid-cols-4">
                      {(picks ?? Array.from({ length: 4 }, () => null)).map((p, i) => (
                        <li key={p?.id ?? i}>
                          {p ? (
                            <ResultTile item={p} onPick={() => go(`/products/${p.slug}`)} />
                          ) : (
                            <div className="dn-skel aspect-square" />
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

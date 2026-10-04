"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowUpLeft, Loader2, Search, X } from "lucide-react";

import {
  SearchStoreProductsAction,
  type SearchSuggestion,
} from "@/actions/store/storefront-search.actions";
import { storeHref } from "./use-store-path";
import { cn, formatPrice } from "@/lib/utils";

type Props = {
  storeSlug: string;
  /** "inline" = desktop header field with a dropdown; "overlay" = full-screen mobile search. */
  variant: "inline" | "overlay";
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export default function SearchCombobox({ storeSlug, variant, autoFocus, onNavigate, className }: Props) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, startLoading] = useTransition();

  const term = value.trim();

  // Debounced suggestions
  useEffect(() => {
    // Short terms show no panel at all (see showPanel), so nothing to fetch.
    if (term.length < 2) return;
    const t = setTimeout(() => {
      startLoading(async () => {
        try {
          const rows = await SearchStoreProductsAction(storeSlug, term);
          setResults(rows);
          setSearchedFor(term);
          setActive(-1);
        } catch {
          setResults([]);
        }
      });
    }, 220);
    return () => clearTimeout(t);
  }, [term, storeSlug]);

  // Close the inline dropdown when clicking outside
  useEffect(() => {
    if (variant !== "inline" || !open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, variant]);

  const go = (url: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(url);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (active >= 0 && results[active]) {
      go(storeHref(storeSlug, `/products/${results[active].slug}`));
      return;
    }
    const qs = term ? `?search=${encodeURIComponent(term)}` : "";
    go(storeHref(storeSlug, `/products${qs}`));
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape" && variant === "inline") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else if (value) {
        setValue("");
      }
    }
  };

  const showPanel = (variant === "overlay" || open) && term.length >= 2;
  const noResults = !loading && searchedFor === term && results.length === 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">
          ابحث في المتجر
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="ابحث عن منتج…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full appearance-none rounded-(--c-radius) border border-transparent bg-(--c-subtle) pe-11 ps-11 text-base text-foreground outline-none transition-[border-color,background-color] duration-(--c-motion) placeholder:text-muted-foreground",
            "focus:border-foreground/25 focus:bg-background [&::-webkit-search-cancel-button]:hidden",
            variant === "inline" ? "h-11 sm:text-sm" : "h-12",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            aria-label="مسح البحث"
            className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </button>
        )}
      </form>

      {showPanel && (
        <div
          className={cn(
            variant === "inline" &&
              "c-fade-up absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-(--c-radius) border border-border bg-background shadow-(--c-shadow-pop)",
            // Fills the sheet below the search row
            variant === "overlay" && "fixed inset-x-0 bottom-0 top-[3.75rem] z-10 overflow-y-auto overscroll-contain bg-background",
          )}
        >
          <ul id={`${listId}-list`} role="listbox" aria-label="اقتراحات البحث" className="py-1.5">
            {results.map((item, i) => (
              <li
                key={item.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(storeHref(storeSlug, `/products/${item.slug}`))}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 transition-colors",
                  active === i && "bg-(--c-subtle)",
                )}
              >
                <div className="c-img-bg relative size-11 shrink-0 overflow-hidden rounded-(--c-radius-sm)">
                  <Image src={item.image || "/images/product-placeholder.png"} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p
                    className={cn(
                      "text-[0.8125rem] font-semibold tabular-nums",
                      item.compareAtPrice && item.compareAtPrice > item.price ? "text-(--c-sale)" : "text-muted-foreground",
                    )}
                  >
                    {formatPrice(item.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {noResults && (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">
              مفيش منتجات باسم «{term}»
            </p>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setActive(-1);
              go(storeHref(storeSlug, `/products?search=${encodeURIComponent(term)}`));
            }}
            className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-border px-4 text-sm font-semibold transition-colors hover:bg-(--c-subtle)"
          >
            <span className="truncate">عرض كل النتائج لـ «{term}»</span>
            <ArrowUpLeft className="size-4 shrink-0 ltr:-scale-x-100" />
          </button>
        </div>
      )}
    </div>
  );
}

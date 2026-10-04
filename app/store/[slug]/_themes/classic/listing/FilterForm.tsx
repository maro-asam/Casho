"use client";

import { useRouter } from "next/navigation";
import { useRef, type FormEvent } from "react";

import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { storeHref } from "../../shared/store-path";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import { btn } from "../ui";

type Props = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: { min: number; max: number } | null;
  /** sidebar: applies instantly on desktop. sheet: applied with a footer button. */
  mode: "sidebar" | "sheet";
  onApplied?: () => void;
  /** Rendered inside the form — a `type="reset"` button in it clears all filters. */
  footer?: React.ReactNode;
};

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border py-5 first:pt-0 last:border-0">
      <legend className="float-start mb-3 w-full text-sm font-bold">{legend}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

const RADIO_ROW =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-(--c-radius-sm) px-2 text-sm transition-colors hover:bg-(--c-subtle) lg:min-h-9";

export default function FilterForm({ storeSlug, query, categories, priceBounds, mode, onApplied, footer }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const min = Math.max(0, Number(data.get("minPrice") || 0));
    const max = Math.max(0, Number(data.get("maxPrice") || 0));
    const qs = productsQueryString({
      search: query.search,
      sort: query.sort,
      category: String(data.get("category") || ""),
      featured: data.get("featured") === "true",
      minPrice: max && min > max ? max : min,
      maxPrice: max && min > max ? min : max,
      page: 1,
    });
    router.push(storeHref(storeSlug, `/products${qs}`), { scroll: false });
    onApplied?.();
  };

  const reset = () => {
    router.push(storeHref(storeSlug, `/products${productsQueryString({ search: query.search })}`), { scroll: false });
    onApplied?.();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    apply();
  };

  const instant = mode === "sidebar" ? apply : undefined;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onReset={(e) => {
        e.preventDefault();
        reset();
      }}
      className="flex min-h-0 flex-1 flex-col"
      key={JSON.stringify(query)}
    >
      <div className={cn(mode === "sheet" && "flex-1 overflow-y-auto overscroll-contain px-4 pt-4")}>
        {categories.length > 0 && (
          <Fieldset legend="التصنيف">
            <div className="-mx-2 space-y-0.5">
              {[{ id: "", slug: "", name: "كل التصنيفات", productCount: null as number | null }, ...categories].map((c) => (
                <label key={c.id || "all"} className={RADIO_ROW}>
                  <input
                    type="radio"
                    name="category"
                    value={c.slug}
                    defaultChecked={query.category === c.slug}
                    onChange={instant}
                    className="size-[1.125rem] shrink-0 accent-(--primary)"
                  />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.productCount !== null && (
                    <span className="text-xs tabular-nums text-muted-foreground">{c.productCount}</span>
                  )}
                </label>
              ))}
            </div>
          </Fieldset>
        )}

        <Fieldset legend="السعر">
          <div className="grid grid-cols-2 gap-2.5">
            {(["minPrice", "maxPrice"] as const).map((name) => (
              <label key={name} className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">{name === "minPrice" ? "من" : "إلى"}</span>
                <span className="relative block">
                  <input
                    type="number"
                    inputMode="numeric"
                    name={name}
                    min={0}
                    defaultValue={query[name] || ""}
                    placeholder={
                      priceBounds ? String(Math.floor(name === "minPrice" ? priceBounds.min : priceBounds.max)) : "0"
                    }
                    className="h-11 w-full rounded-(--c-radius-sm) border border-border bg-background pe-10 ps-3 text-base tabular-nums outline-none transition-colors focus:border-foreground/40 lg:h-10 lg:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    ج.م
                  </span>
                </span>
              </label>
            ))}
          </div>
          {priceBounds && (
            <p className="mt-2 text-xs text-muted-foreground">
              الأسعار من {formatPrice(priceBounds.min)} إلى {formatPrice(priceBounds.max)}
            </p>
          )}
          {mode === "sidebar" && (
            <button type="submit" className={btn({ variant: "outline", size: "sm", full: true, className: "mt-3" })}>
              تطبيق السعر
            </button>
          )}
        </Fieldset>

        <Fieldset legend="عرض">
          <label className={cn(RADIO_ROW, "-mx-2")}>
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={query.featured}
              onChange={instant}
              className="size-[1.125rem] shrink-0 rounded accent-(--primary)"
            />
            المنتجات المميزة فقط
          </label>
        </Fieldset>
      </div>

      {footer}
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import type { ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import { clearedQueryString, filtersQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { swatchColor } from "../lib/colors";
import { btn, num } from "../ui";

type Props = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: ListingViewProps["priceBounds"];
  facets: ListingViewProps["facets"];
  /** sidebar = applies on change (desktop); sheet = applied with the footer button. */
  mode: "sidebar" | "sheet";
  onApplied?: () => void;
  footer?: React.ReactNode;
};

function Group({ title, open = true, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="md-details border-b border-(--md-line) py-1 last:border-0">
      <summary className="flex min-h-13 items-center justify-between text-[0.9375rem] font-semibold">
        {title}
        <ChevronDown aria-hidden className="md-details-icon size-4 text-(--md-quiet)" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

const ROW = "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm transition-colors hover:bg-(--md-studio) has-[:checked]:font-semibold lg:min-h-10";
const INPUT = "size-[1.125rem] shrink-0 accent-(--md-brand)";

/** Price ranges split evenly across the store's real min–max. */
function buckets(bounds: Props["priceBounds"]) {
  if (!bounds || bounds.max - bounds.min < 40) return [];
  const step = (bounds.max - bounds.min) / 4;
  const round = (v: number) => (v > 1000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10);
  return [0, 1, 2, 3].map((i) => ({ min: i === 0 ? 0 : round(bounds.min + step * i), max: i === 3 ? 0 : round(bounds.min + step * (i + 1)) }));
}

export default function FilterPanel({ storeSlug, query, categories, priceBounds, facets, mode, onApplied, footer }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const push = (qs: string) => {
    router.push(storeHref(storeSlug, `/products${qs}`), { scroll: false });
    onApplied?.();
  };
  const apply = () => formRef.current && push(filtersQueryString(query, new FormData(formRef.current)));
  const instant = mode === "sidebar" ? apply : undefined;
  const ranges = buckets(priceBounds);

  return (
    <form
      ref={formRef}
      key={JSON.stringify(query)}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className={cn(mode === "sheet" && "flex-1 overflow-y-auto overscroll-contain px-5")}>
        {categories.length > 0 && (
          <Group title="التصنيف">
            <div className="-mx-2 space-y-0.5">
              {[{ id: "", slug: "", name: "كل التصنيفات", productCount: null as number | null }, ...categories].map((c) => (
                <label key={c.id || "all"} className={ROW}>
                  <input type="radio" name="category" value={c.slug} defaultChecked={query.category === c.slug} onChange={instant} className={INPUT} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.productCount !== null && <span className="text-xs tabular-nums text-(--md-quiet)">{num(c.productCount)}</span>}
                </label>
              ))}
            </div>
          </Group>
        )}

        <Group title="السعر">
          {ranges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ranges.map((r) => {
                const on = query.minPrice === r.min && query.maxPrice === r.max;
                return (
                  <button
                    key={`${r.min}-${r.max}`}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const d = new FormData();
                      d.set("minPrice", String(r.min));
                      d.set("maxPrice", String(r.max));
                      push(filtersQueryString(query, d));
                    }}
                    className="md-chip min-h-9 px-3 text-xs"
                  >
                    {r.max === 0 ? `أكتر من ${formatPrice(r.min)}` : r.min === 0 ? `أقل من ${formatPrice(r.max)}` : `${formatPrice(r.min)} – ${formatPrice(r.max)}`}
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {(["minPrice", "maxPrice"] as const).map((name) => (
              <label key={name} className="block">
                <span className="mb-1 block text-xs text-(--md-quiet)">{name === "minPrice" ? "من" : "إلى"}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  name={name}
                  min={0}
                  defaultValue={query[name] || ""}
                  placeholder={priceBounds ? String(Math.floor(name === "minPrice" ? priceBounds.min : priceBounds.max)) : "0"}
                  className="md-field h-11 text-sm tabular-nums"
                />
              </label>
            ))}
          </div>
          {mode === "sidebar" && (
            <button type="submit" className={btn({ variant: "outline", size: "sm", full: true, className: "mt-3" })}>
              تطبيق السعر
            </button>
          )}
        </Group>

        <Group title="التوفر">
          <input type="hidden" name="inStockField" value="1" />
          <input type="hidden" name="featuredField" value="1" />
          <div className="-mx-2 space-y-0.5">
            <label className={ROW}>
              <input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock} onChange={instant} className={cn(INPUT, "rounded")} />
              المتوفر حالًا بس
            </label>
            <label className={ROW}>
              <input type="checkbox" name="featured" value="true" defaultChecked={query.featured} onChange={instant} className={cn(INPUT, "rounded")} />
              اختيارات المتجر
            </label>
          </div>
        </Group>

        {facets.colors.length > 0 && (
          <Group title="اللون">
            <div role="radiogroup" aria-label="اللون" className="flex flex-wrap gap-1.5">
              <label className="md-chip min-h-10 px-3 text-xs has-[:checked]:border-(--md-ink) has-[:checked]:bg-(--md-ink) has-[:checked]:text-(--md-bg)">
                <input type="radio" name="color" value="" defaultChecked={!query.color} onChange={instant} className="sr-only" />
                الكل
              </label>
              {facets.colors.map((c) => {
                const sw = swatchColor(c);
                return (
                  <label key={c} title={c} className={cn("cursor-pointer has-[:checked]:[&>span]:ring-2 has-[:checked]:[&>span]:ring-(--md-ink)", sw ? "" : "md-chip min-h-10 px-3 text-xs has-[:checked]:border-(--md-ink)")}>
                    <input type="radio" name="color" value={c} defaultChecked={query.color === c} onChange={instant} className="sr-only" />
                    {sw ? (
                      <span className="md-swatch grid size-10 place-items-center ring-offset-2 ring-offset-(--md-bg)" style={{ background: sw }}>
                        <span className="sr-only">{c}</span>
                      </span>
                    ) : (
                      c
                    )}
                  </label>
                );
              })}
            </div>
          </Group>
        )}

        {facets.sizes.length > 0 && (
          <Group title="المقاس">
            <div className="flex flex-wrap gap-1.5">
              {["", ...facets.sizes].map((s) => (
                <label key={s || "all"} className="md-chip min-h-10 min-w-11 px-3 text-xs has-[:checked]:border-(--md-ink) has-[:checked]:bg-(--md-ink) has-[:checked]:text-(--md-bg)">
                  <input type="radio" name="size" value={s} defaultChecked={query.size === s} onChange={instant} className="sr-only" />
                  {s || "الكل"}
                </label>
              ))}
            </div>
          </Group>
        )}

        {facets.brands.length > 0 && (
          <Group title="البراند" open={!!query.brand}>
            <div className="-mx-2 max-h-64 space-y-0.5 overflow-y-auto">
              {["", ...facets.brands].map((b) => (
                <label key={b || "all"} className={ROW}>
                  <input type="radio" name="brand" value={b} defaultChecked={query.brand === b} onChange={instant} className={INPUT} />
                  <span className="truncate">{b || "كل البراندات"}</span>
                </label>
              ))}
            </div>
          </Group>
        )}
      </div>

      {mode === "sidebar" ? (
        <button type="button" onClick={() => push(clearedQueryString(query))} className="mt-3 min-h-10 self-start text-sm font-semibold text-(--md-quiet) underline-offset-4 hover:text-(--md-ink) hover:underline">
          مسح كل الفلاتر
        </button>
      ) : (
        footer
      )}
    </form>
  );
}

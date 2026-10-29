"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import type { ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import { swatchColor } from "../../shared/colors";
import { clearedQueryString, filtersQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { btn, num } from "../ui";

export type FilterProps = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: ListingViewProps["priceBounds"];
  facets: ListingViewProps["facets"];
};

function Group({ title, open = true, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="rx-details border-b border-(--rx-line) last:border-b-0">
      <summary className="flex min-h-13 items-center justify-between gap-3 text-[0.9375rem] font-bold text-(--rx-ink)">
        {title}
        <ChevronDown className="rx-chev" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

const ROW = "rx-check flex min-h-10 cursor-pointer items-center gap-3 rounded-(--rx-r-sm) text-sm text-(--rx-text) transition-colors hover:text-(--rx-ink) has-[:checked]:font-semibold has-[:checked]:text-(--rx-ink)";
const BOX =
  "relative grid size-[1.125rem] shrink-0 place-items-center rounded-[0.3125rem] border border-(--rx-quiet) bg-(--rx-card) transition-colors after:size-2 after:scale-0 after:rounded-[1px] after:bg-(--rx-btn-ink) after:transition-transform has-[:checked]:border-(--rx-btn) has-[:checked]:bg-(--rx-btn) has-[:checked]:after:scale-100";

/** Price ranges split evenly across the store's real min–max. */
function buckets(bounds: FilterProps["priceBounds"]) {
  if (!bounds || bounds.max - bounds.min < 40) return [];
  const step = (bounds.max - bounds.min) / 4;
  const round = (v: number) => (v > 1000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10);
  return [0, 1, 2, 3].map((i) => ({ min: i === 0 ? 0 : round(bounds.min + step * i), max: i === 3 ? 0 : round(bounds.min + step * (i + 1)) }));
}

/** Filters as collapsible groups. `sidebar` applies on change (desktop);
 *  `drawer` applies with its footer button. */
export default function FilterPanel({
  storeSlug,
  query,
  categories,
  priceBounds,
  facets,
  mode,
  onApplied,
  footer,
}: FilterProps & { mode: "sidebar" | "drawer"; onApplied?: () => void; footer?: React.ReactNode }) {
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
      <div className={cn(mode === "drawer" && "flex-1 overflow-y-auto overscroll-contain px-5")}>
        {categories.length > 0 && (
          <Group title="القسم">
            <div className="max-h-72 overflow-y-auto">
              {[{ id: "", slug: "", name: "كل الأقسام", productCount: null as number | null }, ...categories].map((c) => (
                <label key={c.id || "all"} className={ROW}>
                  <input type="radio" name="category" value={c.slug} defaultChecked={query.category === c.slug} onChange={instant} className="sr-only" />
                  <span className={cn(BOX, "rounded-full after:rounded-full")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.productCount !== null && <span className="text-xs tabular-nums text-(--rx-quiet)">({num(c.productCount)})</span>}
                </label>
              ))}
            </div>
          </Group>
        )}

        <Group title="التوفر">
          <input type="hidden" name="inStockField" value="1" />
          <input type="hidden" name="featuredField" value="1" />
          <label className={ROW}>
            <input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock} onChange={instant} className="sr-only" />
            <span className={BOX} aria-hidden />
            المتوفر حالًا بس
          </label>
          <label className={ROW}>
            <input type="checkbox" name="featured" value="true" defaultChecked={query.featured} onChange={instant} className="sr-only" />
            <span className={BOX} aria-hidden />
            اختيارات المتجر
          </label>
        </Group>

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
                    className="rx-opt min-h-9 px-2.5 text-xs"
                  >
                    {r.max === 0 ? `أكتر من ${formatPrice(r.min)}` : r.min === 0 ? `أقل من ${formatPrice(r.max)}` : `${formatPrice(r.min)} – ${formatPrice(r.max)}`}
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(["minPrice", "maxPrice"] as const).map((name) => (
              <label key={name} className="block">
                <span className="mb-1 block text-xs text-(--rx-quiet)">{name === "minPrice" ? "من" : "إلى"}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  name={name}
                  min={0}
                  defaultValue={query[name] || ""}
                  placeholder={priceBounds ? String(Math.floor(name === "minPrice" ? priceBounds.min : priceBounds.max)) : "0"}
                  className="rx-field h-10 min-h-10 tabular-nums"
                />
              </label>
            ))}
          </div>
          {mode === "sidebar" && (
            <button type="submit" className={btn({ variant: "soft", size: "sm", full: true, className: "mt-2.5" })}>
              تطبيق السعر
            </button>
          )}
        </Group>

        {facets.colors.length > 0 && (
          <Group title="اللون">
            <div role="radiogroup" aria-label="اللون" className="flex flex-wrap gap-1.5">
              <label className="rx-opt min-h-10 px-3 text-xs">
                <input type="radio" name="color" value="" defaultChecked={!query.color} onChange={instant} className="sr-only" />
                الكل
              </label>
              {facets.colors.map((c) => {
                const sw = swatchColor(c);
                return sw ? (
                  <label key={c} title={c} className="rx-swatch-btn cursor-pointer">
                    <input type="radio" name="color" value={c} defaultChecked={query.color === c} onChange={instant} className="sr-only" />
                    <span className="rx-swatch size-6" style={{ background: sw }} />
                    <span className="sr-only">{c}</span>
                  </label>
                ) : (
                  <label key={c} className="rx-opt min-h-10 px-3 text-xs">
                    <input type="radio" name="color" value={c} defaultChecked={query.color === c} onChange={instant} className="sr-only" />
                    {c}
                  </label>
                );
              })}
            </div>
          </Group>
        )}

        {facets.sizes.length > 0 && (
          <Group title="الحجم">
            <div className="flex flex-wrap gap-1.5">
              {["", ...facets.sizes].map((s) => (
                <label key={s || "all"} className="rx-opt min-h-10 min-w-11 px-3 text-xs">
                  <input type="radio" name="size" value={s} defaultChecked={query.size === s} onChange={instant} className="sr-only" />
                  {s || "الكل"}
                </label>
              ))}
            </div>
          </Group>
        )}

        {facets.brands.length > 0 && (
          <Group title="الشركة المصنعة" open={!!query.brand}>
            <div className="max-h-64 overflow-y-auto">
              {["", ...facets.brands].map((b) => (
                <label key={b || "all"} className={ROW}>
                  <input type="radio" name="brand" value={b} defaultChecked={query.brand === b} onChange={instant} className="sr-only" />
                  <span className={cn(BOX, "rounded-full after:rounded-full")} aria-hidden />
                  <span className="truncate">{b || "كل الشركات"}</span>
                </label>
              ))}
            </div>
          </Group>
        )}
      </div>

      {mode === "sidebar" ? (
        <button type="button" onClick={() => push(clearedQueryString(query))} className="mt-4 self-start text-sm font-bold text-(--rx-link) hover:underline">
          مسح كل الفلاتر
        </button>
      ) : (
        footer
      )}
    </form>
  );
}

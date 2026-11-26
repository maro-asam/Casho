"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import type { ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import { filtersQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { swatchColor } from "../../shared/colors";
import { optionKind } from "../lib/coffee";
import { num, optionLabel } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

export type FilterProps = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: ListingViewProps["priceBounds"];
  facets: ListingViewProps["facets"];
};

function Group({ title, open = true, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="bn-details border-b border-(--bn-line) last:border-b-0">
      <summary className="flex min-h-14 items-center justify-between gap-3">
        <span className="bn-kicker !mb-0">{title}</span>
        <ChevronDown className="bn-chev" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

const ROW = "bn-check flex min-h-10 cursor-pointer items-center gap-3 text-sm text-(--bn-ink) has-[:checked]:font-semibold";
const BOX =
  "relative grid size-[1.0625rem] shrink-0 place-items-center border border-(--bn-ink-3) transition-colors after:size-[0.4375rem] after:scale-0 after:bg-(--bn-btn-ink) after:transition-transform has-[:checked]:border-(--bn-btn) has-[:checked]:bg-(--bn-btn) has-[:checked]:after:scale-100";

/** Price ranges split evenly across the store's real min–max. */
function buckets(bounds: FilterProps["priceBounds"]) {
  if (!bounds || bounds.max - bounds.min < 40) return [];
  const step = (bounds.max - bounds.min) / 4;
  const round = (v: number) => (v > 1000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10);
  return [0, 1, 2, 3].map((i) => ({ min: i === 0 ? 0 : round(bounds.min + step * i), max: i === 3 ? 0 : round(bounds.min + step * (i + 1)) }));
}

/** Filters as collapsible groups, applied with the drawer's footer button. */
export default function FilterPanel({ storeSlug, query, categories, priceBounds, facets, onApplied, footer }: FilterProps & { onApplied?: () => void; footer?: React.ReactNode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const push = (qs: string) => {
    router.push(storeHref(storeSlug, `/products${qs}`), { scroll: false });
    onApplied?.();
  };
  const apply = () => formRef.current && push(filtersQueryString(query, new FormData(formRef.current)));
  const ranges = buckets(priceBounds);
  const variety = optionKind(facets.colors) !== "plain" || !facets.colors.every((c) => swatchColor(c));

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
      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        {categories.length > 0 && (
          <Group title={st("القسم")}>
            <div className="max-h-72 overflow-y-auto">
              {[{ id: "", slug: "", name: st("كل الأقسام"), productCount: null as number | null }, ...categories].map((c) => (
                <label key={c.id || "all"} className={ROW}>
                  <input type="radio" name="category" value={c.slug} defaultChecked={query.category === c.slug} className="sr-only" />
                  <span className={cn(BOX, "rounded-full after:rounded-full")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.productCount !== null && <span className="bn-num text-xs text-(--bn-ink-2)">({num(c.productCount)})</span>}
                </label>
              ))}
            </div>
          </Group>
        )}

        {facets.colors.length > 0 && (
          <Group title={optionLabel("color", facets.colors)}>
            <div role="radiogroup" aria-label={st("الاختيارات")} className="flex flex-wrap gap-2">
              <label className="bn-chip bn-chip--sm">
                <input type="radio" name="color" value="" defaultChecked={!query.color} className="sr-only" />
                {st("الكل")}
              </label>
              {facets.colors.map((c) => {
                const fill = variety ? null : swatchColor(c);
                return fill ? (
                  <label key={c} title={c} className="bn-chip bn-chip--sm bn-chip--swatch">
                    <input type="radio" name="color" value={c} defaultChecked={query.color === c} className="sr-only" />
                    <span aria-hidden className="bn-swatch" style={{ background: fill }} />
                    {c}
                  </label>
                ) : (
                  <label key={c} className="bn-chip bn-chip--sm">
                    <input type="radio" name="color" value={c} defaultChecked={query.color === c} className="sr-only" />
                    {c}
                  </label>
                );
              })}
            </div>
          </Group>
        )}

        {facets.sizes.length > 0 && (
          <Group title={optionLabel("size", facets.sizes)}>
            <div className="flex flex-wrap gap-2">
              {["", ...facets.sizes].map((s) => (
                <label key={s || "all"} className="bn-chip bn-chip--sm min-w-11 justify-center">
                  <input type="radio" name="size" value={s} defaultChecked={query.size === s} className="sr-only" />
                  {s || st("الكل")}
                </label>
              ))}
            </div>
          </Group>
        )}

        <Group title={st("السعر")}>
          {ranges.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
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
                    className="bn-chip bn-chip--sm"
                  >
                    {r.max === 0 ? st("أكتر من {0}", formatPrice(r.min)) : r.min === 0 ? st("أقل من {0}", formatPrice(r.max)) : `${formatPrice(r.min)} – ${formatPrice(r.max)}`}
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {(["minPrice", "maxPrice"] as const).map((name) => (
              <label key={name} className="block">
                <span className="mb-1.5 block text-xs text-(--bn-ink-2)">{name === "minPrice" ? st("من") : st("إلى")}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  name={name}
                  min={0}
                  defaultValue={query[name] || ""}
                  placeholder={priceBounds ? String(Math.floor(name === "minPrice" ? priceBounds.min : priceBounds.max)) : "0"}
                  className="bn-field bn-num"
                />
              </label>
            ))}
          </div>
        </Group>

        <Group title={st("التوفر")}>
          <input type="hidden" name="inStockField" value="1" />
          <input type="hidden" name="featuredField" value="1" />
          <label className={ROW}>
            <input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock} className="sr-only" />
            <span className={BOX} aria-hidden />
            {st("المتوفر حالًا بس")}
          </label>
          <label className={ROW}>
            <input type="checkbox" name="featured" value="true" defaultChecked={query.featured} className="sr-only" />
            <span className={BOX} aria-hidden />
            {st("مختارات المتجر")}
          </label>
        </Group>

        {facets.brands.length > 0 && (
          <Group title={st("البراند")} open={!!query.brand}>
            <div className="max-h-64 overflow-y-auto">
              {["", ...facets.brands].map((b) => (
                <label key={b || "all"} className={ROW}>
                  <input type="radio" name="brand" value={b} defaultChecked={query.brand === b} className="sr-only" />
                  <span className={cn(BOX, "rounded-full after:rounded-full")} aria-hidden />
                  <span className="truncate">{b || st("كل البراندات")}</span>
                </label>
              ))}
            </div>
          </Group>
        )}
      </div>
      {footer}
    </form>
  );
}

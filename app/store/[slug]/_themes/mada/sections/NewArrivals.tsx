"use client";

import Link from "next/link";
import { useState } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import ProductCard from "../product/ProductCard";
import { Arrow, Wrap, btn, num } from "../ui";

/** New arrivals with an optional "on sale" tab, plus a promo tile that
 *  closes the grid. */
export default function NewArrivals({ latest, onSale, storeSlug }: { latest: ProductCardData[]; onSale: ProductCardData[]; storeSlug: string }) {
  const tabs = [
    { id: "new", label: "وصل حديثًا", items: latest },
    ...(onSale.length >= 2 ? [{ id: "sale", label: `العروض (${num(onSale.length)})`, items: onSale }] : []),
  ];
  const [tab, setTab] = useState(tabs[0].id);
  const items = (tabs.find((t) => t.id === tab) ?? tabs[0]).items.slice(0, 7);
  // The promo tile only appears when it completes the last desktop row.
  const promo = items.length === 7 || items.length === 3;

  return (
    <Wrap className="md-section">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
        <div>
          <span className="md-eyebrow mb-3">جديد</span>
          <h2 className="md-h2">آخر ما وصل للمتجر</h2>
        </div>
        {tabs.length > 1 && (
          <div role="tablist" aria-label="المنتجات" className="flex gap-1 rounded-full bg-(--md-surface) p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn("min-h-10 rounded-full px-4 text-sm font-semibold transition-colors", tab === t.id ? "bg-(--md-ink) text-(--md-bg)" : "text-(--md-quiet) hover:text-(--md-ink)")}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <ul role="tabpanel" className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
        {items.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} priority={i < 2} />
          </li>
        ))}
        {promo && (
        <li className="col-span-2 sm:col-span-1">
          <Link
            href={buildStoreUrl(storeSlug, "/products")}
            className="group flex h-full min-h-56 flex-col justify-between rounded-(--md-radius) bg-(--md-brand) p-6 text-(--md-brand-ink) transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="md-eyebrow self-start">المزيد</span>
            <span>
              <span className="md-face block text-2xl font-bold leading-snug">شوف كل المنتجات</span>
              <span className={btn({ variant: "signal", size: "sm", className: "mt-4" })}>
                تصفّح الكل
                <Arrow />
              </span>
            </span>
          </Link>
        </li>
        )}
      </ul>
      {!promo && (
        <div className="mt-10 flex justify-center">
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "outline", size: "lg" })}>
            تصفّح كل المنتجات
            <Arrow />
          </Link>
        </div>
      )}
    </Wrap>
  );
}

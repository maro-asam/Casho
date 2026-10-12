"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryLink, ProductCardData } from "../../types";
import ProductCard from "../product/ProductCard";
import { Chevron, Wrap } from "../ui";

type Tab = { key: string; label: string; image: string | null; products: ProductCardData[]; href: string };

/** Maximize "promotional collections": a centered heading, pill tabs with a
 *  small category photo, and a product grid per tab. Tabs are the store's
 *  categories that have products in this set (plus "All"); arrow keys move
 *  between tabs. */
export default function TabbedCollection({
  title,
  products,
  categories,
  storeSlug,
  href,
}: {
  title: string;
  products: ProductCardData[];
  categories: CategoryLink[];
  storeSlug: string;
  href: string;
}) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const tabs: Tab[] = [{ key: "all", label: "الكل", image: null, products, href }];
  for (const c of categories) {
    if (tabs.length >= 5) break;
    // Cards carry the category name only, so same-named categories share a tab.
    if (tabs.some((t) => t.label === c.name)) continue;
    const inCat = products.filter((p) => p.categoryName === c.name);
    if (inCat.length >= 2) tabs.push({ key: c.id, label: c.name, image: c.image, products: inCat, href: buildStoreUrl(storeSlug, `/categories/${c.slug}`) });
  }
  const [active, setActive] = useState(0);
  if (products.length === 0) return null;
  const tab = tabs[Math.min(active, tabs.length - 1)];

  const onKey = (e: KeyboardEvent) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const step = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
    let next = active;
    if (step) next = (active + step + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <section className="mx-section">
      <Wrap>
        <h2 className="mx-h2 text-center text-balance">{title}</h2>
        {tabs.length > 1 && (
          <div ref={listRef} role="tablist" aria-label={title} onKeyDown={onKey} className="mx-rail mx-bleed mt-5 gap-2 sm:justify-center">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                id={`${id}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={`${id}-panel`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                className="mx-tab shrink-0"
              >
                <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-(--mx-r-sm) bg-(--mx-plate) text-xs font-bold text-(--mx-link)">
                  {t.image ? <Image src={t.image} alt="" fill sizes="36px" className="object-cover" /> : "★"}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div id={`${id}-panel`} role={tabs.length > 1 ? "tabpanel" : undefined} aria-labelledby={tabs.length > 1 ? `${id}-tab-${active}` : undefined} key={tab.key} data-state="active" className="mx-tab-panel mt-6">
          <ul className="mx-pgrid lg:!grid-cols-3 xl:!grid-cols-6">
            {tab.products.slice(0, tab.products.length >= 12 ? 12 : tab.products.length >= 6 ? 6 : tab.products.length).map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={storeSlug} index={i} />
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <Link href={tab.href} className="inline-flex min-h-10 items-center gap-1 font-semibold text-(--mx-link) hover:underline">
              {tab.key === "all" ? "عرض كل المنتجات" : `كل ${tab.label}`}
              <Chevron double />
            </Link>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

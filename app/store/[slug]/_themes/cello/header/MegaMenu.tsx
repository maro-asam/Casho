"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { num, stagger } from "../ui";

const QUICK = [
  { href: "/products", label: "كل المنتجات" },
  { href: "/products?sort=newest", label: "وصل حديثًا" },
  { href: "/products?featured=true", label: "اختيارات المتجر" },
  { href: "/products?inStock=true", label: "المتوفر حالًا" },
  { href: "/products?sort=price-asc", label: "الأقل سعرًا" },
];

/** Cello's multi-column mega menu: shopping paths in the first column, the
 *  store's categories (photo, name, product count) across the middle
 *  columns, and the newest banner plus the top category as image cards.
 *  Escape closes and returns focus to the trigger. */
export default function MegaMenu({ id, shell, open, onClose }: { id: string; shell: StoreShell; open: boolean; onClose: (refocus?: boolean) => void }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const cats = shell.categories.slice(0, 18);
  const featuredCat = shell.categories.find((c) => c.image);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const heading = "mb-3 text-base font-semibold text-(--ce-ink)";
  const cards = [
    shell.banner && { href: url("/products"), image: shell.banner.image, title: shell.banner.title, cta: "تسوّق الآن" },
    featuredCat && { href: url(`/categories/${featuredCat.slug}`), image: featuredCat.image!, title: featuredCat.name, cta: `${num(featuredCat.productCount)} منتج` },
  ].filter(Boolean) as { href: string; image: string; title: string; cta: string }[];

  return (
    <div
      id={id}
      inert={!open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute inset-x-0 top-full z-40 hidden border-t border-(--ce-line) bg-(--ce-card) text-(--ce-ink) shadow-(--ce-shadow) transition-[opacity,transform,visibility] duration-300 ease-(--ce-ease) lg:block",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
      )}
    >
      <div className="ce-wrap grid grid-cols-[12rem_minmax(0,1fr)_auto] gap-10 py-8 xl:grid-cols-[14rem_minmax(0,1fr)_auto]">
        <div>
          <p className={heading}>تسوّق</p>
          <ul className={cn(open && "ce-stagger")}>
            {QUICK.map((l, i) => (
              <li key={l.label} style={stagger(i)}>
                <Link href={url(l.href)} onClick={() => onClose()} className="flex min-h-9 items-center text-[0.9375rem] text-(--ce-text) hover:text-(--ce-btn)">
                  <span className="ce-hover-line">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <p className={heading}>التصنيفات</p>
          <ul className={cn("grid grid-cols-2 gap-x-6 gap-y-1 xl:grid-cols-3", open && "ce-stagger")}>
            {cats.map((c, i) => (
              <li key={c.id} style={stagger(Math.min(i, 10))}>
                <Link
                  href={url(`/categories/${c.slug}`)}
                  onClick={() => onClose()}
                  className="group flex min-h-12 items-center gap-3 rounded-(--ce-r-sm) px-2 transition-colors hover:bg-(--ce-band)"
                >
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-(--ce-r-sm) bg-(--ce-band)">
                    {c.image && <Image src={c.image} alt="" fill sizes="36px" className="ce-product-img" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-(--ce-ink) group-hover:text-(--ce-btn)">{c.name}</span>
                  <span className="ce-num shrink-0 text-xs text-(--ce-quiet)">{num(c.productCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {shell.categories.length > cats.length && (
            <Link href={url("/categories")} onClick={() => onClose()} className="ce-link mt-4 text-sm text-(--ce-ink)">
              كل التصنيفات ({num(shell.categories.length)})
            </Link>
          )}
        </div>

        {cards.length > 0 && (
          <div className="flex gap-4">
            {cards.map((c) => (
              <Link key={c.href} href={c.href} onClick={() => onClose()} className="group relative block h-64 w-48 overflow-hidden rounded-(--ce-r) bg-(--ce-navy) xl:w-56">
                <Image src={c.image} alt="" fill sizes="14rem" className="ce-zoom-img object-cover" />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_16_48/0.75),transparent_60%)]" />
                <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="line-clamp-2 block text-lg leading-snug font-semibold">{c.title}</span>
                  <span className="mt-2 inline-block border-b border-white/80 pb-0.5 text-sm">{c.cta}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

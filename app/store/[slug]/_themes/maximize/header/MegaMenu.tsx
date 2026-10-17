"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Chevron, num, stagger } from "../ui";

const QUICK = [
  { href: "/products", label: "كل المنتجات" },
  { href: "/products?sort=newest", label: "وصل حديثًا" },
  { href: "/products?featured=true", label: "اختيارات المتجر" },
  { href: "/products?inStock=true", label: "المتوفر حالًا" },
  { href: "/products?sort=price-asc", label: "الأقل سعرًا" },
];

/** Desktop "All categories" mega menu in Maximize's tabbed style: the
 *  categories as a list on the start side; hovering or focusing one shows
 *  its photo, size and shopping paths, with the store's newest banner as a
 *  promo. Escape closes and returns focus to the trigger. */
export default function MegaMenu({ id, shell, open, onClose }: { id: string; shell: StoreShell; open: boolean; onClose: (refocus?: boolean) => void }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const cats = shell.categories.slice(0, 14);
  const [activeId, setActiveId] = useState(cats[0]?.id);
  const active = cats.find((c) => c.id === activeId) ?? cats[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!active) return null;

  return (
    <div
      id={id}
      inert={!open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute inset-x-0 top-full z-40 hidden border-t border-(--mx-line) bg-(--mx-surface) text-(--mx-ink) shadow-(--mx-shadow) transition-[opacity,transform,visibility] duration-300 ease-(--mx-ease) lg:block",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
      )}
    >
      <div className="mx-wrap grid grid-cols-[17rem_minmax(0,1fr)_auto] gap-8 py-7 xl:grid-cols-[19rem_minmax(0,1fr)_auto]">
        <ul className={cn("max-h-[26rem] space-y-0.5 overflow-y-auto pe-2", open && "mx-stagger")}>
          {cats.map((c, i) => {
            const on = c.id === active.id;
            return (
              <li key={c.id} style={stagger(i)}>
                <Link
                  href={url(`/categories/${c.slug}`)}
                  onMouseEnter={() => setActiveId(c.id)}
                  onFocus={() => setActiveId(c.id)}
                  onClick={() => onClose()}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-(--mx-r-sm) px-3 text-[0.9375rem] font-medium transition-colors",
                    on ? "bg-(--mx-band) text-(--mx-link)" : "hover:bg-(--mx-band)",
                  )}
                >
                  <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-(--mx-plate)">
                    {c.image && <Image src={c.image} alt="" fill sizes="28px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <ChevronLeft aria-hidden className={cn("size-4 shrink-0 transition-opacity ltr:rotate-180", on ? "opacity-100" : "opacity-0")} />
                </Link>
              </li>
            );
          })}
          {shell.categories.length > cats.length && (
            <li>
              <Link href={url("/categories")} onClick={() => onClose()} className="mx-link mx-3 mt-2">
                كل التصنيفات ({num(shell.categories.length)})
              </Link>
            </li>
          )}
        </ul>

        <div key={active.id} className="mx-pop grid min-w-0 grid-cols-[minmax(0,1fr)_12rem] gap-6">
          <Link href={url(`/categories/${active.slug}`)} onClick={() => onClose()} className="group relative block min-h-72 overflow-hidden rounded-(--mx-r-lg) bg-(--mx-tint)">
            {active.image && <Image src={active.image} alt="" fill sizes="40vw" className="mx-zoom-img object-cover" />}
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.65),transparent_60%)]" />
            <span className="absolute inset-x-0 bottom-0 p-6 text-white">
              <span className="block text-sm opacity-85">{num(active.productCount)} منتج</span>
              <span className="mx-display mt-1 block text-2xl text-white">{active.name}</span>
              <span className="mt-3 inline-flex items-center gap-1 border-b border-white/80 pb-0.5 text-sm font-semibold">
                تسوّق {active.name}
                <Chevron />
              </span>
            </span>
          </Link>
          <div>
            <p className="mb-2 text-xs font-semibold text-(--mx-quiet)">تسوّق</p>
            <ul>
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link href={url(l.href)} onClick={() => onClose()} className="flex min-h-10 items-center text-[0.9375rem]">
                    <span className="mx-hover-line">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {shell.banner && (
          <BannerLink banner={shell.banner} storeSlug={shell.slug} onClick={() => onClose()} className="group relative block w-56 overflow-hidden rounded-(--mx-r-lg) bg-(--mx-dark) xl:w-64">
            <BannerImage banner={shell.banner} sizes="16rem" className="mx-zoom-img object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.7),transparent_55%)]" />
            <span className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="mx-display line-clamp-2 block text-lg text-white">{shell.banner.title}</span>
              {shell.banner.link && (
                <span className="mt-2 inline-flex items-center gap-1 border-b border-white/80 pb-0.5 text-sm font-semibold">
                  {shell.banner.cta}
                  <Chevron />
                </span>
              )}
            </span>
          </BannerLink>
        )}
      </div>
    </div>
  );
}

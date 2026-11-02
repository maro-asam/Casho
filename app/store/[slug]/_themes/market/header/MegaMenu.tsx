"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { CategoryArt, Chevron, num } from "../ui";

/** Aisles popover under the bar: every aisle as an app icon with its product
 *  count, and the newest banner on the end side.
 *  Escape closes it and returns focus to the trigger. */
export default function MegaMenu({ id, shell, open, onClose }: { id: string; shell: StoreShell; open: boolean; onClose: (refocus?: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const url = (p: string) => buildStoreUrl(shell.slug, p);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id={id}
      hidden={!open}
      className={cn("mk-mega mk-glass absolute inset-x-(--mk-gutter) top-full z-40 mt-2 hidden lg:block", open && "mk-pop")}
    >
      <div className={cn("grid max-h-[min(70dvh,34rem)] gap-6 overflow-y-auto p-5", shell.banner && "grid-cols-[minmax(0,1fr)_17rem]")}>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="mk-h4">كل الأقسام</p>
            <Link href={url("/categories")} onClick={() => onClose()} className="mk-link text-sm">
              عرض الكل
              <Chevron />
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-2 xl:grid-cols-4">
            {shell.categories.map((c) => (
              <li key={c.id}>
                <Link href={url(`/categories/${c.slug}`)} onClick={() => onClose()} className="group flex min-h-16 items-center gap-3 rounded-(--mk-r) p-2 transition-colors hover:bg-(--mk-fill)">
                  <span className="mk-aisle-art relative size-11 shrink-0 overflow-hidden">
                    <CategoryArt name={c.name} image={c.image} sizes="44px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-(--mk-ink) ">{c.name}</span>
                    <span className="text-xs text-(--mk-label-2)">{num(c.productCount)} منتج</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {shell.banner ? (
          <BannerLink banner={shell.banner} storeSlug={shell.slug} onClick={() => onClose()} className="group relative block min-h-64 overflow-hidden rounded-(--mk-r) bg-(--mk-cell)">
            <BannerImage banner={shell.banner} sizes="17rem" className="mk-zoom-img object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.82),transparent_65%)]" />
            <span className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="line-clamp-2 block text-lg font-bold">{shell.banner.title}</span>
              {shell.banner.link && (
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                  {shell.banner.cta}
                  <Chevron />
                </span>
              )}
            </span>
          </BannerLink>
        ) : null}
      </div>
    </div>
  );
}

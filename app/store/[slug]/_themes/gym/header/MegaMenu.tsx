"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { whatsappHref } from "../../shared/social";
import { COACH_MESSAGE, waWith } from "../lib/coach";
import { CategoryArt, Chevron, num } from "../ui";

/** "All shelves" panel under the header: every shelf as an icon tile with its
 *  product count, and the newest banner (or an ask-us card) on the end side.
 *  Escape closes it and returns focus to the trigger. */
export default function MegaMenu({ id, shell, open, onClose }: { id: string; shell: StoreShell; open: boolean; onClose: (refocus?: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const wa = whatsappHref(shell.contact.whatsapp);

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
      className={cn("absolute inset-x-0 top-full z-40 hidden border-b border-(--gy-line) bg-(--gy-surface) shadow-(--gy-shadow) lg:block", open && "gy-pop")}
    >
      <div className="gy-wrap grid max-h-[min(70dvh,34rem)] grid-cols-[minmax(0,1fr)_19rem] gap-8 overflow-y-auto py-7">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="gy-h4">كل الأقسام</p>
            <Link href={url("/categories")} onClick={() => onClose()} className="gy-link text-sm">
              عرض الكل
              <Chevron />
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-2 xl:grid-cols-4">
            {shell.categories.map((c) => (
              <li key={c.id}>
                <Link href={url(`/categories/${c.slug}`)} onClick={() => onClose()} className="group flex min-h-16 items-center gap-3 rounded-(--gy-r) p-2 transition-colors hover:bg-(--gy-tint)">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-(--gy-r-sm)">
                    <CategoryArt name={c.name} image={c.image} sizes="48px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-(--gy-ink) group-hover:text-(--gy-link)">{c.name}</span>
                    <span className="text-xs text-(--gy-quiet)">{num(c.productCount)} منتج</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {shell.banner ? (
          <BannerLink banner={shell.banner} storeSlug={shell.slug} onClick={() => onClose()} className="group relative block min-h-64 overflow-hidden rounded-(--gy-r) bg-(--gy-deep)">
            <BannerImage banner={shell.banner} sizes="19rem" className="gy-zoom-img object-cover" />
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
        ) : wa ? (
          <a href={waWith(wa, COACH_MESSAGE)} target="_blank" rel="noopener noreferrer" className="gy-knurl flex flex-col justify-end rounded-(--gy-r) bg-(--gy-btn) p-6 text-(--gy-btn-ink)">
            <MessageCircle className="size-9" strokeWidth={1.75} />
            <span className="gy-h3 mt-4 !text-current">محتار تبدأ بإيه؟</span>
            <span className="mt-1 text-sm leading-6 opacity-90">قولنا هدفك على واتساب، ونرشحلك اللي يناسبك.</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

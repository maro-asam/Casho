"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreShell } from "../../types";
import { Arrow, PlateImage, btn, num } from "../ui";

/** Desktop mega menu: categories as visual links, quick shopping paths, and a
 *  promo card from the newest banner. Opens on hover/click, closes on Escape. */
export default function MegaMenu({ shell, open, onClose }: { shell: StoreShell; open: boolean; onClose: () => void }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const cats = shell.categories.slice(0, 12);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      id="md-mega"
      inert={!open}
      className={cn(
        "absolute inset-x-0 top-full hidden border-t border-(--md-line) bg-(--md-surface) shadow-[0_30px_60px_-30px_rgb(18_23_20/0.3)] transition-[opacity,transform] duration-300 ease-(--md-ease) lg:block",
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <div className="md-wrap grid grid-cols-12 gap-10 py-9">
        <div className="col-span-7">
          <p className="mb-4 text-xs font-semibold text-(--md-quiet)">تسوّق حسب التصنيف</p>
          {cats.length > 0 ? (
            <ul className="grid grid-cols-3 gap-x-6 gap-y-2">
              {cats.map((c) => (
                <li key={c.id}>
                  <Link href={url(`/categories/${c.slug}`)} onClick={onClose} className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-(--md-studio)">
                    <span className="md-media size-12 shrink-0 rounded-xl">
                      <PlateImage src={c.image} sizes="48px" className="transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-medium">{c.name}</span>
                      <span className="block text-xs text-(--md-quiet)">{num(c.productCount)} منتج</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--md-quiet)">لسه مفيش تصنيفات — تقدر تتصفح كل المنتجات.</p>
          )}
        </div>

        <div className="col-span-2 border-s border-(--md-line) ps-8">
          <p className="mb-4 text-xs font-semibold text-(--md-quiet)">روابط سريعة</p>
          <ul className="space-y-1">
            {[
              { href: "/products", label: "كل المنتجات" },
              { href: "/products", label: "وصل حديثًا" },
              { href: "/products?featured=true", label: "اختيارات المتجر" },
              { href: "/products?inStock=true", label: "المتوفر حالًا" },
              { href: "/categories", label: "كل التصنيفات" },
            ].map((l) => (
              <li key={l.label}>
                <Link href={url(l.href)} onClick={onClose} className="inline-flex min-h-10 items-center text-[0.9375rem] transition-colors hover:text-(--md-brand)">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-3">
          {shell.banner ? (
            <Link href={url("/products")} onClick={onClose} className="group relative block h-full min-h-56 overflow-hidden rounded-(--md-radius)">
              <Image src={shell.banner.image} alt="" fill sizes="22rem" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.75),transparent_60%)]" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="md-face line-clamp-2 block text-lg font-bold leading-snug">{shell.banner.title}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold">
                  تسوّق دلوقتي
                  <Arrow />
                </span>
              </span>
            </Link>
          ) : (
            <div className="flex h-full min-h-56 flex-col justify-end rounded-(--md-radius) bg-(--md-brand) p-6 text-(--md-brand-ink)">
              <span className="md-eyebrow self-start">جديد</span>
              <p className="md-face mt-3 text-xl font-bold leading-snug">آخر المنتجات وصلت</p>
              <Link href={url("/products")} onClick={onClose} className={btn({ variant: "signal", size: "sm", className: "mt-4 self-start" })}>
                تصفّح
                <Arrow />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

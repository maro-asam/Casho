"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, StoreShell } from "../../types";
import { BannerLink } from "../../shared/banner";
import { Arrow, num, stagger } from "../ui";

/** `banner` set → the merchant's banner, linked to wherever they chose. */
type Promo = { key: string; href: string; image: string; title: string; note: string; banner?: BannerData };

/** Desktop mega menu: categories in grouped columns, quick shopping paths, and
 *  up to two image promos (newest banner, then the biggest category with a
 *  photo). Opens on hover/click; Escape closes and returns focus. */
export default function MegaMenu({ id, shell, open, onClose }: { id: string; shell: StoreShell; open: boolean; onClose: (refocus?: boolean) => void }) {
  const url = (p: string) => buildStoreUrl(shell.slug, p);
  const cats = shell.categories.slice(0, 18);
  const columns: (typeof cats)[] = [];
  for (let i = 0; i < cats.length; i += 6) columns.push(cats.slice(i, i + 6));

  const promos: Promo[] = [];
  if (shell.banner) promos.push({ key: "banner", href: "", image: shell.banner.image, title: shell.banner.title, note: shell.banner.link ? shell.banner.cta : (shell.banner.subtitle ?? ""), banner: shell.banner });
  const featuredCat = [...shell.categories].filter((c) => c.image).sort((a, b) => b.productCount - a.productCount)[0];
  if (featuredCat) promos.push({ key: featuredCat.id, href: url(`/categories/${featuredCat.slug}`), image: featuredCat.image!, title: featuredCat.name, note: `${num(featuredCat.productCount)} منتج` });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      id={id}
      inert={!open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute inset-x-0 top-full hidden border-t border-(--dn-line) bg-(--dn-bg) text-(--dn-ink) shadow-(--dn-shadow) transition-[opacity,transform,visibility] duration-500 ease-(--dn-ease) lg:block",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0",
      )}
    >
      <div className="dn-wrap flex gap-12 py-10 xl:gap-16">
        <div className="flex min-w-0 flex-1 gap-10 xl:gap-14">
          {columns.map((col, c) => (
            <div key={c} className="min-w-0 max-w-56 flex-1">
              <p className="dn-label mb-4 text-(--dn-quiet)">{c === 0 ? "التصنيفات" : " "}</p>
              <ul className={cn(open && "dn-stagger")}>
                {col.map((cat, n) => (
                  <li key={cat.id} style={stagger(c * 6 + n)}>
                    <Link href={url(`/categories/${cat.slug}`)} onClick={() => onClose()} className="group flex min-h-9 items-center justify-between gap-3 text-[0.9375rem]">
                      <span className="dn-link truncate">{cat.name}</span>
                      <span className="text-xs tabular-nums text-(--dn-quiet) opacity-0 transition-opacity group-hover:opacity-100">{num(cat.productCount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="w-44 shrink-0">
            <p className="dn-label mb-4 text-(--dn-quiet)">تسوّق</p>
            <ul className={cn(open && "dn-stagger")}>
              {[
                { href: "/products", label: "كل المنتجات" },
                { href: "/products?sort=newest", label: "وصل حديثًا" },
                { href: "/products?featured=true", label: "اختيارات المتجر" },
                { href: "/products?inStock=true", label: "المتوفر حالًا" },
                { href: "/categories", label: "كل التصنيفات" },
              ].map((l, n) => (
                <li key={l.label} style={stagger(Math.min(cats.length, 6) + n)}>
                  <Link href={url(l.href)} onClick={() => onClose()} className="flex min-h-9 items-center text-[0.9375rem]">
                    <span className="dn-link">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {promos.length > 0 && (
          <ul className={cn("flex shrink-0 gap-5", open && "dn-stagger")}>
            {promos.map((p, n) => {
              const body = (
                <>
                  <span className="dn-media block aspect-[4/5]">
                    <Image src={p.image} alt="" fill sizes="16rem" className="dn-zoom-img object-cover" />
                  </span>
                  <span className="dn-h4 mt-3 line-clamp-1 block">{p.title}</span>
                  <span className="dn-label mt-1 flex items-center gap-1.5 text-(--dn-quiet)">
                    {p.note}
                    {(!p.banner || p.banner.link) && (
                      <Arrow className="transition-transform duration-500 group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                    )}
                  </span>
                </>
              );
              return (
                <li key={p.key} className="w-56 xl:w-64" style={stagger(n + 2)}>
                  {p.banner ? (
                    <BannerLink banner={p.banner} storeSlug={shell.slug} onClick={() => onClose()} className="group block">
                      {body}
                    </BannerLink>
                  ) : (
                    <Link href={p.href} onClick={() => onClose()} className="group block">
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

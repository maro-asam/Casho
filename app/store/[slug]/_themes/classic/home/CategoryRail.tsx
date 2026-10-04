import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";

/** Home "shop by category": a swipeable rail on phones, a grid on desktop.
 *  Honors the merchant's category style (circle / square / pill). */
export default function CategoryRail({
  categories,
  storeSlug,
  style,
}: {
  categories: CategoryLink[];
  storeSlug: string;
  style: CategoryCardStyle;
}) {
  if (style === "pill") {
    return (
      <ul className="c-rail c-bleed gap-2 lg:mx-0 lg:flex-wrap lg:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
              className="inline-flex h-11 items-center gap-2.5 rounded-full border border-border bg-background pe-4 ps-1.5 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              <span className="c-img-bg relative grid size-8 place-items-center overflow-hidden rounded-full text-xs font-bold text-muted-foreground">
                {c.image ? <Image src={c.image} alt="" fill sizes="32px" className="object-cover" /> : c.name.charAt(0)}
              </span>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const round = style === "circle";

  return (
    <ul
      className={cn(
        "c-rail c-bleed gap-3 sm:gap-4",
        "lg:mx-0 lg:grid lg:overflow-visible lg:px-0",
        categories.length >= 8
          ? "lg:grid-cols-6 xl:grid-cols-8"
          : categories.length >= 6
            ? "lg:grid-cols-6"
            : categories.length === 5
              ? "lg:grid-cols-5"
              : "lg:grid-cols-4",
      )}
    >
      {categories.map((c, i) => (
        <li
          key={c.id}
          className={cn(
            "shrink-0 lg:w-auto",
            round ? "w-[4.75rem] sm:w-24" : "w-[6.5rem] sm:w-32",
            // Desktop shows one tidy row; the rest live behind "كل التصنيفات"
            i >= 8 ? "lg:hidden" : i >= 6 && "lg:hidden xl:block",
          )}
        >
          <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group flex flex-col items-center gap-2.5">
            <span
              className={cn(
                "c-img-bg relative grid w-full place-items-center overflow-hidden",
                round ? "aspect-square rounded-full lg:mx-auto lg:max-w-32" : "aspect-square rounded-(--c-radius)",
              )}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes={round ? "128px" : "(max-width: 1024px) 144px, 200px"}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground/70">{c.name.charAt(0)}</span>
              )}
            </span>
            <span className="line-clamp-2 w-full text-center text-[0.8125rem] font-medium leading-5 sm:text-sm">
              {c.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

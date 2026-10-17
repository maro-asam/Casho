import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";

/** Secondary promo banners (banners after the hero slides). */
export default function PromoTiles({ banners, storeSlug }: { banners: BannerData[]; storeSlug: string }) {
  return (
    <ul
      className={cn(
        "c-rail c-bleed gap-3 sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0",
        banners.length === 1 ? "sm:grid-cols-1" : banners.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {banners.map((b) => (
        <li key={b.id} className="w-[82%] shrink-0 sm:w-auto">
          <BannerLink
            banner={b}
            storeSlug={storeSlug}
            className="group relative block aspect-[16/9] overflow-hidden rounded-(--c-radius) sm:aspect-[2/1]"
          >
            <BannerImage
              banner={b}
              sizes="(max-width: 640px) 82vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
              <span className="min-w-0">
                <span className="line-clamp-2 block text-base font-bold leading-snug sm:text-lg">{b.title}</span>
                {b.subtitle && <span className="mt-0.5 line-clamp-1 block text-sm text-white/80">{b.subtitle}</span>}
              </span>
              {b.link && (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                  {b.cta}
                  <ChevronLeft className="size-4 transition-transform duration-(--c-motion) group-hover:-translate-x-0.5 ltr:rotate-180" />
                </span>
              )}
            </span>
          </BannerLink>
        </li>
      ))}
    </ul>
  );
}

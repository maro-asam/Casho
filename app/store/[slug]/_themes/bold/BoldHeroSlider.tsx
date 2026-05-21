"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeData } from "../types";

type HeroProduct = StoreThemeData["products"][number];

type BoldHeroSliderProps = {
  storeName: string;
  storeSlug: string;
  coverImage?: string | null;
  banners: StoreThemeData["banners"];
  heroProduct?: HeroProduct | null;
};

function getProductImage(product?: HeroProduct | null): string | null {
  if (!product) return null;

  const p = product as HeroProduct & {
    image?: string | null;
    imageUrl?: string | null;
    thumbnail?: string | null;
    thumbnailUrl?: string | null;
    mainImage?: string | null;
    coverImage?: string | null;
    images?: Array<
      | string
      | {
          url?: string | null;
          image?: string | null;
          imageUrl?: string | null;
          secure_url?: string | null;
        }
    >;
  };

  if (p.image) return p.image;
  if (p.imageUrl) return p.imageUrl;
  if (p.thumbnail) return p.thumbnail;
  if (p.thumbnailUrl) return p.thumbnailUrl;
  if (p.mainImage) return p.mainImage;
  if (p.coverImage) return p.coverImage;

  const firstImage = p.images?.[0];

  if (typeof firstImage === "string") return firstImage;
  if (firstImage?.url) return firstImage.url;
  if (firstImage?.image) return firstImage.image;
  if (firstImage?.imageUrl) return firstImage.imageUrl;
  if (firstImage?.secure_url) return firstImage.secure_url;

  return null;
}

export default function BoldHeroSlider({
  storeName,
  storeSlug,
  coverImage,
  banners,
  heroProduct,
}: BoldHeroSliderProps) {
  const slides = useMemo(() => {
    const items: { id: string; image: string; title: string }[] = [];

    if (coverImage) {
      items.push({
        id: "cover",
        image: coverImage,
        title: storeName,
      });
    }

    for (const banner of banners || []) {
      if (!banner.image) continue;

      const alreadyExists = items.some((item) => item.image === banner.image);

      if (!alreadyExists) {
        items.push({
          id: banner.id,
          image: banner.image,
          title: banner.title || storeName,
        });
      }
    }

    const productImage = getProductImage(heroProduct);

    if (productImage) {
      const alreadyExists = items.some((item) => item.image === productImage);

      if (!alreadyExists) {
        items.push({
          id: `product-${heroProduct?.id || "hero"}`,
          image: productImage,
          title: heroProduct?.name || storeName,
        });
      }
    }

    return items;
  }, [banners, coverImage, heroProduct, storeName]);

  const firstSlide = slides[0];

  console.log("BoldHeroSlider debug:", {
    coverImage,
    banners,
    heroProduct,
    productImage: getProductImage(heroProduct),
    slides,
  });

  return (
    <div className="relative min-h-130 overflow-hidden bg-muted lg:h-full lg:min-h-0">
      {firstSlide ? (
        <Image
          src={firstSlide.image}
          alt={firstSlide.title}
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--store-primary),transparent_55%),radial-gradient(circle_at_70%_25%,var(--store-secondary),transparent_28%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

      <div className="absolute right-5 top-5 border border-white/25 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-white backdrop-blur">
        Casho Drop
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 bg-black/45 p-5 text-white backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--store-secondary)">
              <Sparkles className="size-4" />
              Highlight
            </p>

            <h2 className="line-clamp-2 text-2xl font-bold leading-tight">
              {heroProduct?.name || "منتجات مختارة بعناية"}
            </h2>
          </div>

          {heroProduct && (
            <Link
              href={buildStoreUrl(storeSlug, `/products/${heroProduct.slug}`)}
              className="inline-flex shrink-0 items-center justify-center border border-white/30 px-5 py-3 text-sm font-bold transition hover:bg-white hover:text-black"
            >
              عرض المنتج
              <ArrowLeft className="ms-2 size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
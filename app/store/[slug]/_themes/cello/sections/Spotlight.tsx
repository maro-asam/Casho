"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import BuyForm from "../product/BuyForm";
import { PlateImage, Price, Rating, StockLine, Wrap, num } from "../ui";

/** Cello's "featured product" block: a white panel with the gallery (main
 *  image + thumbnails) beside the full buy box, for the store's first
 *  featured product. Loads the same real product data as the quick view. */
export default function Spotlight({ storeSlug, slug }: { storeSlug: string; slug: string }) {
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    GetQuickViewProductAction(storeSlug, slug)
      .then((p) => alive && (p ? setProduct(p) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [storeSlug, slug]);

  if (failed) return null;
  const href = buildStoreUrl(storeSlug, `/products/${slug}`);

  return (
    <section className="ce-section bg-(--ce-band)/60">
      <Wrap className="max-w-[80rem]">
        <div className="grid gap-6 rounded-(--ce-r-lg) bg-(--ce-card) p-4 shadow-(--ce-shadow-sm) sm:p-8 lg:grid-cols-2 lg:gap-8">
          {!product ? (
            <>
              <div className="ce-skel aspect-square" />
              <div className="space-y-4 pt-2" aria-busy>
                <div className="ce-skel h-9 w-3/4" />
                <div className="ce-skel h-7 w-40" />
                <div className="ce-skel mt-10 h-12 w-full" />
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-(--ce-r) border border-(--ce-line)">
                  <PlateImage key={active} src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 36rem" alt={product.name} className="ce-pop p-[8%]" />
                </div>
                {product.gallery.length > 1 && (
                  <div className="ce-rail mt-3 gap-2.5">
                    {product.gallery.slice(0, 8).map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`الصورة ${num(i + 1)}`}
                        aria-current={i === active}
                        className={cn("relative aspect-square w-20 shrink-0 rounded-(--ce-r-sm) border sm:w-28", i === active ? "border-(--ce-ink)" : "border-(--ce-line) hover:border-(--ce-quiet)")}
                      >
                        <PlateImage src={src} sizes="112px" className="p-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="ce-h1">
                  <Link href={href} className="hover:text-(--ce-btn)">
                    {product.name}
                  </Link>
                </h2>
                {product.rating && <Rating value={product.rating.average} count={product.rating.count} size="md" className="mt-2" />}
                <Price price={product.price} compareAt={product.compareAtPrice} size="lg" chip className="mt-3" />
                <hr className="my-5 border-(--ce-line)" />
                {product.description && <p className="mb-5 line-clamp-3 text-[0.9375rem] leading-7">{product.description}</p>}
                <StockLine stock={product.stock} count className="mb-5" />
                <BuyForm storeSlug={storeSlug} product={{ ...product, image: product.gallery[0] ?? null }} />
                <Link href={href} className="mt-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-(--ce-ink) hover:text-(--ce-btn)">
                  عرض تفاصيل المنتج
                  <ArrowLeft aria-hidden className="size-4 ltr:rotate-180" />
                </Link>
              </div>
            </>
          )}
        </div>
      </Wrap>
    </section>
  );
}

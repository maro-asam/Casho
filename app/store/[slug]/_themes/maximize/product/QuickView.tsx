"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { QUICK_VIEW_EVENT } from "../lib/events";
import { Chevron, MX_PORTAL, PlateImage, Price, Rating, StockLine, discountPercent, num } from "../ui";
import BuyForm from "./BuyForm";

/** Global quick-view host: a centered popup on desktop, a bottom sheet on phones. */
export default function QuickView({ storeSlug, dir }: { storeSlug: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      setProduct(null);
      setFailed(false);
      setActive(0);
      setOpen(true);
      GetQuickViewProductAction(storeSlug, slug)
        .then((p) => (p ? setProduct(p) : setFailed(true)))
        .catch(() => setFailed(true));
    };
    window.addEventListener(QUICK_VIEW_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_VIEW_EVENT, onOpen);
  }, [storeSlug]);

  const off = product ? discountPercent(product.price, product.compareAtPrice) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="mx-scrim fixed inset-0 z-50 bg-[rgb(16_15_15/0.5)]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            MX_PORTAL,
            "mx-modal mx-modal--sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-(--mx-r-lg) bg-(--mx-surface) outline-none",
            "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[88dvh] lg:w-[min(62rem,calc(100vw-4rem))] lg:rounded-(--mx-r-lg)",
          )}
        >
          <Dialog.Title className="sr-only">{product?.name ?? "نظرة سريعة"}</Dialog.Title>
          <Dialog.Close className="mx-fab absolute end-3 top-3 z-10" aria-label="إغلاق">
            <X />
          </Dialog.Close>

          <div className="overflow-y-auto overscroll-contain">
            {failed ? (
              <p className="p-12 text-center text-(--mx-quiet)">المنتج ده مش متاح دلوقتي.</p>
            ) : !product ? (
              <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-8" aria-busy>
                <div className="mx-skel aspect-square rounded-(--mx-r)" />
                <div className="space-y-4 pt-4">
                  <div className="mx-skel h-3 w-24" />
                  <div className="mx-skel h-8 w-4/5" />
                  <div className="mx-skel h-6 w-32" />
                  <div className="mx-skel mt-10 h-12 w-full" />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 p-4 pt-14 sm:p-6 sm:pt-14 lg:grid-cols-2 lg:gap-10 lg:p-8">
                <div className="min-w-0">
                  <div className="mx-media aspect-square">
                    <PlateImage key={active} src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 30rem" alt={product.name} className="mx-pop" />
                    {off > 0 && <span className="mx-badge mx-badge--drop absolute start-3 top-3">خصم {num(off)}٪</span>}
                  </div>
                  {product.gallery.length > 1 && (
                    <div className="mx-rail mt-2.5 gap-2">
                      {product.gallery.slice(0, 8).map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setActive(i)}
                          aria-label={`الصورة ${i + 1}`}
                          aria-current={i === active}
                          className={cn("mx-media aspect-square w-16 shrink-0 rounded-(--mx-r-sm) border-2 transition-colors", i === active ? "border-(--mx-ink)" : "border-transparent opacity-70 hover:opacity-100")}
                        >
                          <PlateImage src={src} sizes="64px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-4">
                  <p className="text-sm text-(--mx-quiet)">{product.brand || product.category.name}</p>
                  <h2 className="mx-h2 mt-1">{product.name}</h2>
                  {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-2" />}
                  <Price price={product.price} compareAt={product.compareAtPrice} size="lg" className="mt-3" />
                  {product.description && <p className="mt-4 line-clamp-3 text-sm leading-7">{product.description}</p>}
                  <StockLine stock={product.stock} className="mt-4" />
                  <div className="mt-5 border-t border-(--mx-line) pt-5">
                    <BuyForm storeSlug={storeSlug} product={{ ...product, image: product.gallery[0] ?? null }} onAdded={() => setOpen(false)} />
                  </div>
                  <Link href={buildStoreUrl(storeSlug, `/products/${product.slug}`)} onClick={() => setOpen(false)} className="mx-link mt-6">
                    التفاصيل الكاملة
                    <Chevron />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

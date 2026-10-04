"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { QUICK_VIEW_EVENT } from "../lib/events";
import { Arrow, MD_PORTAL, PlateImage, Price, Rating, discountPercent, num } from "../ui";
import BuyForm from "./BuyForm";
import { WishlistButton } from "./CardActions";

/** Global quick-view host: a centered dialog on desktop, a bottom sheet on phones. */
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

  const discount = product ? discountPercent(product.price, product.compareAtPrice) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.5)] backdrop-blur-[2px]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            MD_PORTAL,
            "md-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-(--md-bg) outline-none",
            "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[86dvh] lg:w-[min(64rem,calc(100vw-4rem))] lg:rounded-[1.75rem] lg:[animation-name:md-pop] lg:data-[state=closed]:[animation:md-fade_160ms_ease-in_reverse_both]",
          )}
        >
          <Dialog.Title className="sr-only">{product?.name ?? "نظرة سريعة"}</Dialog.Title>
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-(--md-line-strong) lg:hidden" aria-hidden />
          <Dialog.Close className="md-fab absolute end-3 top-3 z-10 size-10" aria-label="إغلاق">
            <X />
          </Dialog.Close>

          <div className="overflow-y-auto overscroll-contain">
            {failed ? (
              <p className="p-10 text-center text-(--md-quiet)">المنتج ده مش متاح دلوقتي.</p>
            ) : !product ? (
              <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-8" aria-busy>
                <div className="md-skel aspect-[4/5]" />
                <div className="space-y-3 pt-4">
                  <div className="md-skel h-4 w-24" />
                  <div className="md-skel h-8 w-4/5" />
                  <div className="md-skel h-6 w-32" />
                  <div className="md-skel mt-8 h-12 w-full rounded-full" />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 p-4 pt-3 sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
                <div className="min-w-0">
                  <div className="md-media aspect-[4/5]">
                    <PlateImage src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 30rem" alt={product.name} />
                    {discount > 0 && <span className="md-badge md-badge--sale absolute start-3 top-3">−{num(discount)}٪</span>}
                  </div>
                  {product.gallery.length > 1 && (
                    <div className="md-rail mt-3 gap-2">
                      {product.gallery.slice(0, 8).map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setActive(i)}
                          aria-label={`الصورة ${i + 1}`}
                          aria-current={i === active}
                          className={cn("md-media aspect-square w-16 shrink-0 rounded-xl ring-offset-2 ring-offset-(--md-bg) transition", i === active ? "ring-2 ring-(--md-ink)" : "opacity-70 hover:opacity-100")}
                        >
                          <PlateImage src={src} sizes="64px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-4">
                  <p className="text-sm text-(--md-quiet)">{product.brand || product.category.name}</p>
                  <h2 className="md-h2 mt-1 text-[1.5rem] sm:text-[1.75rem]">{product.name}</h2>
                  {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-2" />}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
                    <WishlistButton storeSlug={storeSlug} product={product} className="border border-(--md-line) shadow-none" />
                  </div>
                  {product.description && <p className="mt-4 line-clamp-3 text-sm leading-7 text-(--md-quiet)">{product.description}</p>}
                  <div className="mt-6">
                    <BuyForm
                      storeSlug={storeSlug}
                      product={{ ...product, image: product.gallery[0] ?? null }}
                      onAdded={() => setOpen(false)}
                    />
                  </div>
                  <Link
                    href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
                    onClick={() => setOpen(false)}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    التفاصيل الكاملة
                    <Arrow />
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

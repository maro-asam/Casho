"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { QUICK_VIEW_EVENT } from "../lib/events";
import { Arrow, DN_PORTAL, PlateImage, Price, Rating, discountPercent, num } from "../ui";
import BuyForm from "./BuyForm";

/** Global quick-view host: a centered modal on desktop, a bottom sheet on phones. */
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
        <Dialog.Overlay className="dn-scrim fixed inset-0 z-50 bg-[rgb(29_29_28/0.45)]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            DN_PORTAL,
            "dn-modal dn-modal--sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden bg-(--dn-drawer) outline-none",
            "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[88dvh] lg:w-[min(68rem,calc(100vw-5rem))]",
          )}
        >
          <Dialog.Title className="sr-only">{product?.name ?? "نظرة سريعة"}</Dialog.Title>
          <Dialog.Close className="dn-fab absolute end-3 top-3 z-10" aria-label="إغلاق">
            <X />
          </Dialog.Close>

          <div className="overflow-y-auto overscroll-contain">
            {failed ? (
              <p className="p-12 text-center text-(--dn-quiet)">المنتج ده مش متاح دلوقتي.</p>
            ) : !product ? (
              <div className="grid gap-8 p-5 lg:grid-cols-2 lg:p-10" aria-busy>
                <div className="dn-skel aspect-square" />
                <div className="space-y-4 pt-4">
                  <div className="dn-skel h-3 w-24" />
                  <div className="dn-skel h-9 w-4/5" />
                  <div className="dn-skel h-6 w-32" />
                  <div className="dn-skel mt-10 h-13 w-full rounded-full" />
                </div>
              </div>
            ) : (
              <div className="grid gap-7 p-4 pt-14 sm:p-6 sm:pt-14 lg:grid-cols-2 lg:gap-12 lg:p-10">
                <div className="min-w-0">
                  <div className="dn-media aspect-square">
                    <PlateImage key={active} src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 32rem" alt={product.name} className="animate-[dn-fade_500ms_ease-out]" />
                    {discount > 0 && <span className="dn-tag dn-tag--sale absolute start-0 top-0">خصم {num(discount)}٪</span>}
                  </div>
                  {product.gallery.length > 1 && (
                    <div className="dn-rail mt-3 gap-2">
                      {product.gallery.slice(0, 8).map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setActive(i)}
                          aria-label={`الصورة ${i + 1}`}
                          aria-current={i === active}
                          className={cn("dn-media aspect-square w-16 shrink-0 transition-opacity", i === active ? "outline outline-1 outline-offset-2 outline-(--dn-ink)" : "opacity-60 hover:opacity-100")}
                        >
                          <PlateImage src={src} sizes="64px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-4">
                  <p className="dn-label text-(--dn-quiet)">{product.brand || product.category.name}</p>
                  <h2 className="dn-h2 mt-2 text-[2rem] sm:text-[2.375rem]">{product.name}</h2>
                  {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-2" />}
                  <Price price={product.price} compareAt={product.compareAtPrice} size="lg" className="mt-4" />
                  {product.description && <p className="mt-5 line-clamp-3 text-sm leading-7 text-(--dn-quiet)">{product.description}</p>}
                  <div className="dn-rule mt-6 pt-6">
                    <BuyForm storeSlug={storeSlug} product={{ ...product, image: product.gallery[0] ?? null }} onAdded={() => setOpen(false)} />
                  </div>
                  <Link href={buildStoreUrl(storeSlug, `/products/${product.slug}`)} onClick={() => setOpen(false)} className="dn-link dn-label mt-6">
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

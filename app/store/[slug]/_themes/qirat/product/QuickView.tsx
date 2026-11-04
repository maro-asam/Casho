"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { QUICK_VIEW_EVENT } from "../lib/events";
import { Kicker, PlateImage, Price, QR_PORTAL, Rating, StockLine, TextLink } from "../ui";
import BuyForm from "./BuyForm";

/** Global quick view: a centered panel on desktop, a bottom sheet on phones. */
export default function QuickView({ storeSlug, storeName, dir }: { storeSlug: string; storeName: string; dir: "rtl" | "ltr" }) {
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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            QR_PORTAL,
            "qr-modal qr-modal--sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden bg-(--qr-sheet) outline-none",
            "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[88dvh] lg:w-[min(64rem,calc(100vw-4rem))]",
          )}
        >
          <Dialog.Title className="sr-only">{product?.name ?? "نظرة سريعة"}</Dialog.Title>
          <Dialog.Close className="qr-fab absolute end-3 top-3 z-10" aria-label="إغلاق">
            <X />
          </Dialog.Close>

          <div className="overflow-y-auto overscroll-contain">
            {failed ? (
              <p className="p-12 text-center text-(--qr-ink-2)">القطعة دي مش متاحة دلوقتي.</p>
            ) : !product ? (
              <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-8" aria-busy>
                <div className="qr-skel aspect-[3/4]" />
                <div className="space-y-4 pt-6">
                  <div className="qr-skel h-3 w-24" />
                  <div className="qr-skel h-9 w-4/5" />
                  <div className="qr-skel h-6 w-32" />
                  <div className="qr-skel mt-10 h-12 w-full" />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 p-4 pt-14 sm:p-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:p-8">
                <div className="min-w-0">
                  <div className="qr-plate relative overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }}>
                    <PlateImage key={active} src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 30rem" alt={product.name} className="qr-pop" />
                  </div>
                  {product.gallery.length > 1 && (
                    <div className="qr-rail mt-3 gap-2">
                      {product.gallery.slice(0, 8).map((src, i) => (
                        <button key={src} type="button" onClick={() => setActive(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === active} className="qr-thumb w-16 shrink-0">
                          <PlateImage src={src} sizes="64px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 pb-4">
                  <Kicker>{product.brand || product.category.name}</Kicker>
                  <h2 className="qr-h2 mt-2 text-balance">{product.name}</h2>
                  {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-3" />}
                  <Price price={product.price} compareAt={product.compareAtPrice} size="lg" save className="mt-4" />
                  <StockLine stock={product.stock} className="mt-3" />
                  {product.description && <p className="mt-5 line-clamp-3 text-sm leading-7 text-(--qr-ink-2)">{product.description}</p>}
                  <div className="mt-8">
                    <BuyForm
                      storeSlug={storeSlug}
                      storeName={storeName}
                      product={{ ...product, image: product.gallery[0] ?? null }}
                      onAdded={() => setOpen(false)}
                    />
                  </div>
                  {/* Closes the sheet as the link navigates. */}
                  <div className="mt-7" onClickCapture={() => setOpen(false)}>
                    <TextLink href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}>كل تفاصيل القطعة</TextLink>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

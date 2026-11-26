"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetQuickViewProductAction, type QuickViewProduct } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { QUICK_VIEW_EVENT } from "../lib/events";
import { coffeeLine, readProfile, splitDescription } from "../lib/coffee";
import { BN_PORTAL, Kicker, Notes, PlateImage, Price, Rating, RoastMeter, StockLine, TextLink } from "../ui";
import BuyForm from "./BuyForm";
import { st } from "@/lib/i18n/storefront";

function Body({ product, storeSlug, onClose }: { product: QuickViewProduct; storeSlug: string; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const profile = readProfile({ name: product.name, categoryName: product.category.name, attributes: product.attributes, sizes: product.sizes, colors: product.colors, description: product.description });
  const story = splitDescription(product.description).story;
  return (
    <div className="grid gap-6 p-4 pt-14 sm:p-6 sm:pt-14 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:p-8">
      <div className="min-w-0">
        <div className="bn-plate relative overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
          <PlateImage key={active} src={product.gallery[active]} sizes="(max-width: 1024px) 92vw, 30rem" alt={product.name} className="bn-pop" />
        </div>
        {product.gallery.length > 1 && (
          <div className="bn-rail mt-3 gap-2">
            {product.gallery.slice(0, 8).map((src, i) => (
              <button key={src} type="button" onClick={() => setActive(i)} aria-label={st("الصورة {0}", i + 1)} aria-current={i === active} className="bn-thumb w-16 shrink-0">
                <PlateImage src={src} sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0 pb-4">
        <Kicker>{(profile.isCoffee && coffeeLine(profile)) || product.brand || product.category.name}</Kicker>
        <h2 className="bn-h2 mt-2 text-balance">{product.name}</h2>
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-3" />}
        <Price price={product.price} compareAt={product.compareAtPrice} size="lg" save className="mt-4" />
        <StockLine stock={product.stock} className="mt-2" />
        {profile.isCoffee && (profile.notes.length > 0 || profile.roast) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {profile.roast && <RoastMeter level={profile.roast.level} size="md" label />}
            <Notes notes={profile.notes} max={4} chips />
          </div>
        )}
        {story && <p className="mt-5 line-clamp-3 text-sm leading-7 text-(--bn-ink-2)">{story}</p>}
        <div className="mt-7">
          <BuyForm
            storeSlug={storeSlug}
            product={{ ...product, image: product.gallery[0] ?? null, categoryName: product.category.name }}
            onAdded={onClose}
          />
        </div>
        {/* Closes the sheet as the link navigates. */}
        <div className="mt-7" onClickCapture={onClose}>
          <TextLink href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}>{st("كل التفاصيل")}</TextLink>
        </div>
      </div>
    </div>
  );
}

/** Global quick view: a centered panel on desktop, a bottom sheet on phones. */
export default function QuickView({ storeSlug, dir }: { storeSlug: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      setProduct(null);
      setFailed(false);
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
        <Dialog.Overlay className={cn(BN_PORTAL, "bn-scrim fixed inset-0 z-50")} />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            BN_PORTAL,
            "bn-modal bn-modal--sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden bg-(--bn-sheet) outline-none",
            "lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[88dvh] lg:w-[min(64rem,calc(100vw-4rem))]",
          )}
        >
          <Dialog.Title className="sr-only">{product?.name ?? st("نظرة سريعة")}</Dialog.Title>
          <Dialog.Close className="bn-fab absolute end-3 top-3 z-10" aria-label={st("إغلاق")}>
            <X />
          </Dialog.Close>
          <div className="overflow-y-auto overscroll-contain">
            {failed ? (
              <p className="p-12 text-center text-(--bn-ink-2)">{st("المنتج ده مش متاح دلوقتي.")}</p>
            ) : !product ? (
              <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-8" aria-busy>
                <div className="bn-skel aspect-square" />
                <div className="space-y-4 pt-6">
                  <div className="bn-skel h-3 w-24" />
                  <div className="bn-skel h-9 w-4/5" />
                  <div className="bn-skel h-6 w-32" />
                  <div className="bn-skel mt-10 h-12 w-full" />
                </div>
              </div>
            ) : (
              <Body key={product.id} product={product} storeSlug={storeSlug} onClose={() => setOpen(false)} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

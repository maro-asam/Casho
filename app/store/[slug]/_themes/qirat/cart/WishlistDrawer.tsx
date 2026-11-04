"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Send, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { storeHref } from "../../shared/store-path";
import { WISHLIST_EVENT, openQuickView, wishKey } from "../lib/events";
import { waShare, wishlistMessage } from "../lib/qirat";
import { Ornament, PlateImage, QR_PORTAL, btn, num, stagger } from "../ui";

/** The shopper's wishlist (kept in this browser). Casho has no accounts, so
 *  instead of "save to account" the list can be sent — to themselves, or to
 *  someone who might gift a piece — as a WhatsApp message with links. */
export default function WishlistDrawer({ storeSlug, storeName, dir }: { storeSlug: string; storeName: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const { list, remove } = useLocalList(wishKey(storeSlug), 60);
  const [cards, setCards] = useState<ProductCardData[] | null>(null);
  const ids = list.slice(0, 40).join(",");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(WISHLIST_EVENT, onOpen);
    return () => window.removeEventListener(WISHLIST_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open || !ids) return;
    let alive = true;
    GetStorefrontCardsAction(storeSlug, { ids: ids.split(",") })
      .then((c) => alive && setCards(c))
      .catch(() => alive && setCards([]));
    return () => {
      alive = false;
    };
  }, [open, ids, storeSlug]);

  const loading = !!ids && cards === null;
  const shown = ids ? (cards ?? []).filter((c) => list.includes(c.id)) : [];
  const share = () => {
    const items = shown.map((p) => ({ name: p.name, url: new URL(storeHref(storeSlug, `/products/${p.slug}`), window.location.origin).toString() }));
    window.open(waShare(wishlistMessage(items, storeName)), "_blank", "noopener");
  };
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
        <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,27rem)] flex-col bg-(--qr-sheet) outline-none")}>
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--qr-line) px-6">
            <Dialog.Title className="qr-h3 flex items-baseline gap-2">
              قايمة أمنياتك
              {list.length > 0 && <span className="text-sm text-(--qr-ink-2)">({num(list.length)})</span>}
            </Dialog.Title>
            <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!loading && shown.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="qr-empty-icon">
                  <Heart />
                </span>
                <p className="qr-h3 mt-6">لسه ما حفظتش قطع</p>
                <Ornament className="mt-4" />
                <p className="mt-4 max-w-xs text-sm leading-6 text-(--qr-ink-2)">دوس على القلب فوق أي قطعة عجبتك، وهتلاقيها هنا لما ترجع.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-7" })}>
                    اكتشف المجموعة
                  </Link>
                </Dialog.Close>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-4 p-6" aria-busy>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="qr-skel aspect-[3/4]" />
                    <div className="qr-skel h-3.5 w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="qr-stagger grid grid-cols-2 gap-x-4 gap-y-6 p-6">
                {shown.map((p, i) => (
                  <li key={p.id} style={stagger(i)} className="relative min-w-0 text-center">
                    <Link href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} onClick={close} className="group block">
                      <span className="qr-plate relative block aspect-[3/4] overflow-hidden">
                        <PlateImage src={p.image} sizes="12rem" className={cn("qr-zoom", p.stock <= 0 && "opacity-50 grayscale")} />
                      </span>
                      <span className="qr-serif mt-2.5 line-clamp-2 block text-[0.9375rem] leading-6 text-(--qr-ink)">{p.name}</span>
                      <span className="qr-price block text-sm">{p.stock > 0 ? formatPrice(p.price) : "نفدت"}</span>
                    </Link>
                    <button type="button" onClick={() => remove(p.id)} aria-label={`شيل ${p.name} من القايمة`} className="qr-fab absolute end-2 top-2 size-8 [&_svg]:size-3.5">
                      <X />
                    </button>
                    {p.stock > 0 && (
                      <button type="button" onClick={() => openQuickView(p.slug)} className="qr-link mt-1.5 justify-center text-xs">
                        <span className="qr-underline">{p.hasOptions ? "اختار وأضف" : "أضف للحقيبة"}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {shown.length > 0 && (
            <div className="shrink-0 space-y-2 border-t border-(--qr-line) px-6 pt-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <button type="button" onClick={share} className={btn({ variant: "gold", size: "lg", full: true })}>
                <Send />
                ابعت القايمة لحد يهاديك
              </button>
              <p className="text-center text-xs text-(--qr-ink-2)">هتتفتح واتساب والقايمة جاهزة بروابط القطع.</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { CART_OPEN_EVENT, notifyCartUpdated } from "../../shared/cart-events";
import { unitPriceFor } from "../../shared/commerce";
import { openQuickView } from "../lib/events";
import { qrToast } from "../toast";
import { Ornament, PlateImage, QR_PORTAL, btn, featureLabel, num, stagger } from "../ui";

type Cart = Awaited<ReturnType<typeof GetCartItemsAction>>;

/** The bag: slides in from the reading end (a sheet on phones), opens on bag
 *  clicks and after a product-page add, edits quantities in place, and
 *  suggests a couple more pieces. */
export default function CartDrawer({ storeSlug, dir }: { storeSlug: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [failed, setFailed] = useState(false);
  const [suggest, setSuggest] = useState<ProductCardData[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  const load = useCallback(async () => {
    try {
      const c = await GetCartItemsAction(storeSlug);
      setCart(c);
      setFailed(false);
      GetStorefrontCardsAction(storeSlug, { excludeIds: c.items.map((i) => i.product.id), take: 4 })
        .then(setSuggest)
        .catch(() => {});
    } catch {
      setFailed(true);
    }
  }, [storeSlug]);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      load();
    };
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CART_OPEN_EVENT, onOpen);
  }, [load]);

  const mutate = (itemId: string, fn: () => Promise<unknown>) => {
    setBusyId(itemId);
    start(async () => {
      try {
        const res = (await fn()) as { success?: boolean; message?: string } | undefined;
        if (res && res.success === false && res.message) qrToast.error(res.message);
        await load();
        notifyCartUpdated();
      } catch {
        qrToast.error("حصلت مشكلة، حاول تاني");
      } finally {
        setBusyId(null);
      }
    });
  };

  const items = cart?.items ?? [];
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
        <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,27rem)] flex-col bg-(--qr-sheet) outline-none")}>
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--qr-line) px-6">
            <Dialog.Title className="qr-h3 flex items-baseline gap-2">
              حقيبتك
              {count > 0 && <span className="text-sm text-(--qr-ink-2)">({num(count)})</span>}
            </Dialog.Title>
            <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق الحقيبة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {failed ? (
              <div className="px-6 py-16 text-center">
                <p>مقدرناش نحمّل الحقيبة.</p>
                <button type="button" onClick={load} className={btn({ variant: "outline", size: "sm", className: "mt-4" })}>
                  حاول تاني
                </button>
              </div>
            ) : !cart ? (
              <div className="space-y-5 p-6" aria-busy>
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="qr-skel aspect-[3/4] w-20" />
                    <div className="flex-1 space-y-2.5 pt-2">
                      <div className="qr-skel h-4 w-3/4" />
                      <div className="qr-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="qr-empty-icon">
                  <ShoppingBag />
                </span>
                <p className="qr-h3 mt-6">حقيبتك فاضية</p>
                <Ornament className="mt-4" />
                <p className="mt-4 text-sm text-(--qr-ink-2)">القطع اللي تختارها هتستناك هنا.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-7" })}>
                    اكتشف المجموعة
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <ul className="qr-stagger divide-y divide-(--qr-line) px-6">
                {items.map((item, i) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const busy = busyId === item.id;
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} style={stagger(i)} className={cn("flex gap-4 py-5 transition-opacity", busy && "opacity-55")}>
                      <Link href={href} onClick={close} tabIndex={-1} aria-hidden className="qr-plate relative aspect-[3/4] w-20 shrink-0 overflow-hidden">
                        <PlateImage src={item.product.image} sizes="80px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={href} onClick={close} className="qr-serif line-clamp-2 text-[1.0625rem] leading-6 text-(--qr-ink) hover:text-(--qr-gold-ink)">
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => mutate(item.id, () => RemoveCartItemAction(item.id, storeSlug))}
                            disabled={busy}
                            aria-label={`إزالة ${item.product.name}`}
                            className="qr-icon -me-2 -mt-1.5 size-8 shrink-0 text-(--qr-ink-2) hover:text-(--qr-error) [&_svg]:size-4"
                          >
                            <X />
                          </button>
                        </div>
                        {features.length > 0 && <p className="mt-1 text-xs text-(--qr-ink-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</p>}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <div className="qr-qty qr-qty--sm">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "decrement"))}
                              aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"}
                            >
                              <Minus />
                            </button>
                            <output className="qr-num">{busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : num(item.quantity)}</output>
                            <button
                              type="button"
                              disabled={busy || item.quantity >= item.product.stock}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "increment"))}
                              aria-label="زيادة الكمية"
                            >
                              <Plus />
                            </button>
                          </div>
                          <p className="qr-price">{formatPrice(unit * item.quantity)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart && suggest.length > 0 && (
              <section className="border-t border-(--qr-line) bg-(--qr-alt) px-6 py-6">
                <h3 className="qr-kicker mb-4">{items.length ? "تكمّل الطلّة" : "مختارات ليك"}</h3>
                <ul className="grid grid-cols-2 gap-4">
                  {suggest.slice(0, items.length ? 2 : 4).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => openQuickView(p.slug)} className="group block w-full text-center">
                        <span className="qr-plate relative block aspect-[3/4] overflow-hidden">
                          <PlateImage src={p.image} sizes="12rem" className="qr-zoom" />
                        </span>
                        <span className="qr-serif mt-2 line-clamp-1 block text-[0.9375rem] text-(--qr-ink)">{p.name}</span>
                        <span className="qr-price block text-sm">{formatPrice(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {items.length > 0 && cart && (
            <div className="shrink-0 space-y-3 border-t border-(--qr-line) px-6 pt-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-(--qr-ink-2)">المجموع</span>
                <span className="qr-price text-xl">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-(--qr-ink-2)">
                <ShieldCheck className="size-3.5 shrink-0 text-(--qr-gold-ink)" />
                الشحن وأكواد الخصم بتتحسب في الحقيبة وصفحة الدفع.
              </p>
              <Dialog.Close asChild>
                <Link href={buildStoreUrl(storeSlug, "/checkout")} className={btn({ size: "lg", full: true })}>
                  كمّل الطلب
                </Link>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="qr-link mx-auto flex w-fit justify-center text-sm">
                  <span className="qr-underline">عرض الحقيبة كاملة</span>
                </Link>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

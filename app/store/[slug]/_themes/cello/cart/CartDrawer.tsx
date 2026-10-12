"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { CART_OPEN_EVENT, notifyCartUpdated } from "../../shared/cart-events";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { openQuickView } from "../lib/events";
import { ceToast } from "../toast";
import { CE_PORTAL, PlateImage, btn, num, stagger } from "../ui";

type Cart = Awaited<ReturnType<typeof GetCartItemsAction>>;

/** Slide-out cart from the reading end: opens on cart clicks and after every
 *  add, edits quantities in place, and recommends a few more products. */
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
        if (res && res.success === false && res.message) ceToast.error(res.message);
        await load();
        notifyCartUpdated();
      } catch {
        ceToast.error("حصلت مشكلة، حاول تاني");
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
        <Dialog.Overlay className="ce-scrim fixed inset-0 z-50 bg-[rgb(16_15_15/0.5)]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(CE_PORTAL, "ce-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,27rem)] flex-col bg-(--ce-surface) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--ce-line) px-5">
            <Dialog.Title className="ce-h3 flex items-center gap-2">
              سلة المشتريات
              {count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-(--ce-btn) px-1.5 text-xs font-bold text-(--ce-btn-ink)">{num(count)}</span>}
            </Dialog.Title>
            <Dialog.Close className="ce-icon -me-2" aria-label="إغلاق السلة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {failed ? (
              <div className="px-6 py-16 text-center">
                <p className="text-(--ce-ink)">مقدرناش نحمّل السلة.</p>
                <button type="button" onClick={load} className={btn({ variant: "outline", size: "sm", className: "mt-4" })}>
                  حاول تاني
                </button>
              </div>
            ) : !cart ? (
              <div className="space-y-5 p-5" aria-busy>
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="ce-skel aspect-square w-22 rounded-(--ce-r)" />
                    <div className="flex-1 space-y-2.5 pt-2">
                      <div className="ce-skel h-4 w-3/4" />
                      <div className="ce-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--ce-tint) text-(--ce-link)">
                  <ShoppingCart className="size-7" />
                </span>
                <p className="ce-h3 mt-5">سلتك فاضية</p>
                <p className="mt-2 text-sm text-(--ce-quiet)">لفّ في المتجر واختار اللي يعجبك.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-6" })}>
                    تسوّق المنتجات
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <ul className="ce-stagger divide-y divide-(--ce-line) px-5">
                {items.map((item, i) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const busy = busyId === item.id;
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} style={stagger(i)} className={cn("flex gap-3.5 py-4 transition-opacity", busy && "opacity-55")}>
                      <Link href={href} onClick={close} tabIndex={-1} aria-hidden className="ce-media aspect-square w-22 shrink-0">
                        <PlateImage src={item.product.image} sizes="88px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link href={href} onClick={close} className="line-clamp-2 text-sm font-semibold leading-6 text-(--ce-ink) hover:text-(--ce-link)">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && <p className="mt-0.5 text-xs text-(--ce-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>}
                        <p className="ce-price mt-1 text-[0.9375rem]">{formatPrice(unit * item.quantity)}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-(--ce-r-sm) border border-(--ce-line)">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "decrement"))}
                              aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"}
                              className="grid size-9 place-items-center disabled:opacity-40 [&_svg]:size-3.5"
                            >
                              <Minus />
                            </button>
                            <span className="ce-num w-7 text-center text-sm font-semibold text-(--ce-ink)">{busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : num(item.quantity)}</span>
                            <button
                              type="button"
                              disabled={busy || item.quantity >= item.product.stock}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "increment"))}
                              aria-label="زيادة الكمية"
                              className="grid size-9 place-items-center disabled:opacity-40 [&_svg]:size-3.5"
                            >
                              <Plus />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => mutate(item.id, () => RemoveCartItemAction(item.id, storeSlug))}
                            disabled={busy}
                            aria-label={`إزالة ${item.product.name}`}
                            className="ce-icon size-9 text-(--ce-quiet) hover:text-(--ce-error) [&_svg]:size-4"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart && suggest.length > 0 && (
              <section className="border-t border-(--ce-line) bg-(--ce-band) px-5 py-5">
                <h3 className="ce-h4 mb-3">{items.length ? "ممكن يعجبك كمان" : "مقترحات ليك"}</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {suggest.slice(0, items.length ? 2 : 4).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => openQuickView(p.slug)} className="group block w-full rounded-(--ce-r) bg-(--ce-bg) p-2 text-start">
                        <span className="ce-media block aspect-square">
                          <PlateImage src={p.image} sizes="12rem" className="ce-zoom-img" />
                        </span>
                        <span className="mt-2 line-clamp-1 block text-sm font-semibold text-(--ce-ink)">{p.name}</span>
                        <span className="ce-price block text-sm">{formatPrice(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {items.length > 0 && cart && (
            <div className="shrink-0 space-y-3 border-t border-(--ce-line) px-5 pt-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-(--ce-ink)">المجموع الفرعي</span>
                <span className="ce-price text-xl">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <p className="text-xs text-(--ce-quiet)">الشحن وأكواد الخصم بتتحسب في صفحة السلة والدفع.</p>
              <div className="grid grid-cols-2 gap-2.5">
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/cart")} className={btn({ variant: "outline", size: "lg" })}>
                    عرض السلة
                  </Link>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/checkout")} className={btn({ size: "lg" })}>
                    إتمام الطلب
                  </Link>
                </Dialog.Close>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

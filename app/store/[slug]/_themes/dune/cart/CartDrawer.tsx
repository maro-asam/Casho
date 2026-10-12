"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { CART_OPEN_EVENT, notifyCartUpdated } from "../../shared/cart-events";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { openQuickView } from "../lib/events";
import { dnToast } from "../toast";
import { DN_PORTAL, PlateImage, btn, num, stagger } from "../ui";

type Cart = Awaited<ReturnType<typeof GetCartItemsAction>>;

/** Slide-out cart from the reading end: opens on cart clicks and after every
 *  add, edits quantities in place, and suggests a few more products. */
export default function CartDrawer({ storeSlug, dir }: { storeSlug: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [suggest, setSuggest] = useState<ProductCardData[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  const load = useCallback(async () => {
    try {
      const c = await GetCartItemsAction(storeSlug);
      setCart(c);
      GetStorefrontCardsAction(storeSlug, { excludeIds: c.items.map((i) => i.product.id), take: 4 })
        .then(setSuggest)
        .catch(() => {});
    } catch {
      setCart(null);
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
        if (res && res.success === false && res.message) dnToast.error(res.message);
        await load();
        notifyCartUpdated();
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
        <Dialog.Overlay className="dn-scrim fixed inset-0 z-50 bg-[rgb(29_29_28/0.45)]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(DN_PORTAL, "dn-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,28rem)] flex-col bg-(--dn-drawer) outline-none")}
        >
          <div className="flex h-18 shrink-0 items-center justify-between gap-3 border-b border-(--dn-line) px-6">
            <Dialog.Title className="dn-h3 flex items-baseline gap-2">
              السلة
              {count > 0 && <span className="dn-num text-lg text-(--dn-quiet)">({num(count)})</span>}
            </Dialog.Title>
            <Dialog.Close className="dn-icon -me-2.5" aria-label="إغلاق السلة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!cart ? (
              <div className="space-y-5 p-6" aria-busy>
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="dn-skel aspect-square w-24" />
                    <div className="flex-1 space-y-2.5 pt-2">
                      <div className="dn-skel h-4 w-3/4" />
                      <div className="dn-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <p className="dn-h2">سلتك فاضية</p>
                <p className="mt-3 text-sm text-(--dn-quiet)">لفّ في المتجر واختار اللي يعجبك.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-8" })}>
                    تسوّق المنتجات
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <ul className="dn-stagger divide-y divide-(--dn-line) px-6">
                {items.map((item, i) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const busy = busyId === item.id;
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} style={stagger(i)} className={cn("flex gap-4 py-5 transition-opacity", busy && "opacity-55")}>
                      <Link href={href} onClick={close} tabIndex={-1} aria-hidden className="dn-media aspect-square w-24 shrink-0">
                        <PlateImage src={item.product.image} sizes="96px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <Link href={href} onClick={close} className="line-clamp-2 text-[0.9375rem] leading-6 hover:underline">
                            {item.product.name}
                          </Link>
                          <p className="dn-price shrink-0 text-[1.0625rem]">{formatPrice(unit * item.quantity)}</p>
                        </div>
                        {features.length > 0 && <p className="mt-0.5 text-xs text-(--dn-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <div className="flex items-center rounded-full border border-(--dn-line-ink)">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "decrement"))}
                              aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"}
                              className="grid size-9 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-3"
                            >
                              <Minus />
                            </button>
                            <span className="dn-num w-6 text-center">{busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : num(item.quantity)}</span>
                            <button
                              type="button"
                              disabled={busy || item.quantity >= item.product.stock}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "increment"))}
                              aria-label="زيادة الكمية"
                              className="grid size-9 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-3"
                            >
                              <Plus />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => mutate(item.id, () => RemoveCartItemAction(item.id, storeSlug))}
                            disabled={busy}
                            className="min-h-9 text-xs text-(--dn-quiet) underline underline-offset-4 hover:text-(--dn-ink)"
                          >
                            إزالة<span className="sr-only"> {item.product.name}</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart && suggest.length > 0 && (
              <section className="border-t border-(--dn-line) px-6 py-6">
                <h3 className="dn-label mb-4 text-(--dn-quiet)">{items.length ? "ممكن يعجبك كمان" : "مقترحات ليك"}</h3>
                <ul className="grid grid-cols-2 gap-4">
                  {suggest.slice(0, items.length ? 2 : 4).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => openQuickView(p.slug)} className="group block w-full text-start">
                        <span className="dn-media block aspect-square">
                          <PlateImage src={p.image} sizes="12rem" className="dn-zoom-img" />
                        </span>
                        <span className="mt-2 line-clamp-1 block text-sm">{p.name}</span>
                        <span className="dn-price block text-base">{formatPrice(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {items.length > 0 && cart && (
            <div className="shrink-0 space-y-4 border-t border-(--dn-line) px-6 pb-6 pt-5" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-baseline justify-between">
                <span className="dn-label">المجموع الفرعي</span>
                <span className="dn-price text-[1.625rem]">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <p className="text-xs text-(--dn-quiet)">الشحن والخصومات بتتحسب في الخطوة الجاية.</p>
              <Dialog.Close asChild>
                <Link href={buildStoreUrl(storeSlug, "/checkout")} className={btn({ size: "lg", full: true })}>
                  إتمام الطلب
                </Link>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="dn-link dn-label mx-auto flex w-fit">
                  عرض السلة وكود الخصم
                </Link>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

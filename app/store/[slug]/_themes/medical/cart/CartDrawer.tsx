"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { CART_OPEN_EVENT, notifyCartUpdated } from "../../shared/cart-events";
import { unitPriceFor } from "../../shared/commerce";
import { openQuickView } from "../lib/events";
import { rxToast } from "../toast";
import { OPTION_LABEL, PlateImage, RX_PORTAL, btn, num, stagger } from "../ui";

type Cart = Awaited<ReturnType<typeof GetCartItemsAction>>;

/** Slide-out cart from the reading end: opens on cart clicks and after a
 *  product-page add, edits quantities in place, and suggests a few more
 *  products the shopper may need. */
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
        if (res && res.success === false && res.message) rxToast.error(res.message);
        await load();
        notifyCartUpdated();
      } catch {
        rxToast.error("حصلت مشكلة، حاول تاني");
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
        <Dialog.Overlay className={cn(RX_PORTAL, "rx-scrim fixed inset-0 z-50")} />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(RX_PORTAL, "rx-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,27rem)] flex-col bg-(--rx-surface) outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--rx-line) px-5">
            <Dialog.Title className="rx-h3 flex items-center gap-2">
              سلتك
              {count > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-(--rx-tint) px-2 text-xs font-bold text-(--rx-tint-ink)">{num(count)}</span>}
            </Dialog.Title>
            <Dialog.Close className="rx-icon -me-2" aria-label="إغلاق السلة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {failed ? (
              <div className="px-6 py-16 text-center">
                <p className="text-(--rx-ink)">مقدرناش نحمّل السلة.</p>
                <button type="button" onClick={load} className={btn({ variant: "outline", size: "sm", className: "mt-4" })}>
                  حاول تاني
                </button>
              </div>
            ) : !cart ? (
              <div className="space-y-5 p-5" aria-busy>
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="rx-skel aspect-square w-20 rounded-(--rx-r)" />
                    <div className="flex-1 space-y-2.5 pt-2">
                      <div className="rx-skel h-4 w-3/4" />
                      <div className="rx-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--rx-tint) text-(--rx-btn)">
                  <ShoppingBag className="size-7" />
                </span>
                <p className="rx-h3 mt-5">سلتك فاضية</p>
                <p className="mt-2 text-sm text-(--rx-quiet)">ابحث عن اللي محتاجه أو تصفّح الأقسام.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-6" })}>
                    تسوّق المنتجات
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <ul className="rx-stagger divide-y divide-(--rx-line) px-5">
                {items.map((item, i) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const busy = busyId === item.id;
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} style={stagger(i)} className={cn("flex gap-3.5 py-4 transition-opacity", busy && "opacity-55")}>
                      <Link href={href} onClick={close} tabIndex={-1} aria-hidden className="rx-media aspect-square w-20 shrink-0">
                        <PlateImage src={item.product.image} sizes="80px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link href={href} onClick={close} className="line-clamp-2 text-sm font-semibold leading-6 text-(--rx-ink) hover:text-(--rx-btn)">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && <p className="mt-0.5 text-xs text-(--rx-quiet)">{features.map(([k, v]) => `${OPTION_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-(--rx-line)">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "decrement"))}
                              aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"}
                              className="grid size-8 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-3.5"
                            >
                              <Minus />
                            </button>
                            <span className="rx-num w-7 text-center text-sm font-bold text-(--rx-ink)">{busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : num(item.quantity)}</span>
                            <button
                              type="button"
                              disabled={busy || item.quantity >= item.product.stock}
                              onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "increment"))}
                              aria-label="زيادة الكمية"
                              className="grid size-8 place-items-center rounded-full disabled:opacity-40 [&_svg]:size-3.5"
                            >
                              <Plus />
                            </button>
                          </div>
                          <p className="rx-price text-[0.9375rem]">{formatPrice(unit * item.quantity)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => mutate(item.id, () => RemoveCartItemAction(item.id, storeSlug))}
                        disabled={busy}
                        aria-label={`إزالة ${item.product.name}`}
                        className="rx-icon -me-2 size-9 self-start text-(--rx-quiet) hover:text-(--rx-error) [&_svg]:size-4"
                      >
                        <Trash2 />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart && suggest.length > 0 && (
              <section className="border-t border-(--rx-line) bg-(--rx-band) px-5 py-5">
                <h3 className="rx-h4 mb-3">{items.length ? "ممكن تحتاج كمان" : "مقترحات ليك"}</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {suggest.slice(0, items.length ? 2 : 4).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => openQuickView(p.slug)} className="group block w-full rounded-(--rx-r) bg-(--rx-card) p-2 text-start">
                        <span className="rx-media block aspect-square">
                          <PlateImage src={p.image} sizes="12rem" className="rx-zoom-img" />
                        </span>
                        <span className="mt-2 line-clamp-1 block text-sm font-semibold text-(--rx-ink)">{p.name}</span>
                        <span className="rx-price block text-sm">{formatPrice(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {items.length > 0 && cart && (
            <div className="shrink-0 space-y-3 border-t border-(--rx-line) px-5 pt-4" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-(--rx-ink)">المجموع</span>
                <span className="rx-price text-xl">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-(--rx-quiet)">
                <ShieldCheck className="size-3.5 shrink-0" />
                الشحن وأكواد الخصم بتتحسب في السلة وصفحة الدفع.
              </p>
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

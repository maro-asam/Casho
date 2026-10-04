"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { CART_OPEN_EVENT, notifyCartUpdated } from "../../shared/cart-events";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { openQuickView } from "../lib/events";
import { mdToast } from "../toast";
import { MD_PORTAL, PlateImage, btn, num } from "../ui";

type Cart = Awaited<ReturnType<typeof GetCartItemsAction>>;

/** Slide-out cart: opens from the reading end on cart clicks and after adds. */
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
      const ids = c.items.map((i) => i.product.id);
      GetStorefrontCardsAction(storeSlug, { excludeIds: ids, take: 6 }).then(setSuggest).catch(() => {});
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
        if (res && res.success === false && res.message) mdToast.error(res.message);
        await load();
        notifyCartUpdated();
      } finally {
        setBusyId(null);
      }
    });
  };

  const items = cart?.items ?? [];
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.5)]" />
        <Dialog.Content
          dir={dir}
          aria-describedby={undefined}
          className={cn(MD_PORTAL, "md-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,27rem)] flex-col bg-(--md-bg) shadow-2xl outline-none")}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--md-line) px-5">
            <Dialog.Title className="md-h3 flex items-center gap-2">
              السلة
              {count > 0 && <span className="md-badge md-badge--new">{num(count)}</span>}
            </Dialog.Title>
            <Dialog.Close className={btn({ variant: "ghost", icon: true, className: "-me-2" })} aria-label="إغلاق السلة">
              <X />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!cart ? (
              <div className="space-y-4 p-5">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-3.5">
                    <div className="md-skel aspect-[4/5] w-20" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="md-skel h-4 w-3/4" />
                      <div className="md-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--md-signal) text-(--md-signal-ink)">
                  <ShoppingBag className="size-7" />
                </span>
                <p className="md-h3 mt-5">سلتك فاضية</p>
                <p className="mt-1.5 text-sm text-(--md-quiet)">ابدأ بالمنتجات اللي تحت أو لفّ في المتجر.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-6" })}>
                    تسوّق المنتجات
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <ul className="divide-y divide-(--md-line) px-5">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const busy = busyId === item.id;
                  return (
                    <li key={item.id} className={cn("flex gap-3.5 py-4 transition-opacity", busy && "opacity-60")}>
                      <Link href={buildStoreUrl(storeSlug, `/products/${item.product.slug}`)} onClick={() => setOpen(false)} tabIndex={-1} aria-hidden className="md-media aspect-[4/5] w-20 shrink-0 rounded-xl">
                        <PlateImage src={item.product.image} sizes="80px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={buildStoreUrl(storeSlug, `/products/${item.product.slug}`)} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium leading-6 hover:text-(--md-brand)">
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => mutate(item.id, () => RemoveCartItemAction(item.id, storeSlug))}
                            disabled={busy}
                            aria-label={`إزالة ${item.product.name}`}
                            className="-me-2 -mt-1.5 grid size-10 shrink-0 place-items-center rounded-full text-(--md-quiet) hover:bg-(--md-studio) hover:text-(--md-sale)"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {features.length > 0 && (
                          <p className="text-xs text-(--md-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                          <div className="flex h-10 items-center rounded-full border border-(--md-line) bg-(--md-surface)">
                            <button type="button" disabled={busy} onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "decrement"))} aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"} className="grid size-10 place-items-center rounded-full disabled:opacity-40">
                              <Minus className="size-3.5" />
                            </button>
                            <span className="md-price w-7 text-center text-sm">{busy ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : num(item.quantity)}</span>
                            <button type="button" disabled={busy || item.quantity >= item.product.stock} onClick={() => mutate(item.id, () => UpdateCartItemQtyAction(item.id, storeSlug, "increment"))} aria-label="زيادة الكمية" className="grid size-10 place-items-center rounded-full disabled:opacity-40">
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <p className="md-price text-sm">{formatPrice(unit * item.quantity)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart && suggest.length > 0 && (
              <section className="border-t border-(--md-line) px-5 py-5">
                <h3 className="mb-3 text-sm font-semibold">{items.length ? "ممكن يعجبك كمان" : "مقترحات ليك"}</h3>
                <ul className="md-rail md-bleed gap-3 [--md-gutter:1.25rem]">
                  {suggest.map((p) => (
                    <li key={p.id} className="w-36 shrink-0">
                      <button type="button" onClick={() => openQuickView(p.slug)} className="group block w-full text-start">
                        <span className="md-media block aspect-[4/5] rounded-xl">
                          <PlateImage src={p.image} sizes="144px" className="transition-transform duration-500 group-hover:scale-105" />
                        </span>
                        <span className="mt-2 line-clamp-1 block text-xs font-medium">{p.name}</span>
                        <span className="md-price block text-xs">{formatPrice(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {items.length > 0 && cart && (
            <div className="shrink-0 space-y-3 border-t border-(--md-line) bg-(--md-surface) p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-(--md-quiet)">المجموع الفرعي</span>
                <span className="md-price text-xl">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <p className="text-xs text-(--md-quiet)">الشحن والخصومات بتتحسب في صفحة السلة.</p>
              <div className="grid grid-cols-[auto_1fr] gap-2.5">
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/cart")} className={btn({ variant: "outline", size: "lg" })}>
                    عرض السلة
                  </Link>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/checkout")} className={btn({ size: "lg" })}>
                    <Lock />
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Loader2, Plus, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { WISHLIST_OPEN_EVENT, openQuickView } from "../lib/events";
import { useLocalList, wishlistKey } from "../lib/local-list";
import HorizontalCard from "../product/HorizontalCard";
import { mdToast } from "../toast";
import { MD_PORTAL, btn, num } from "../ui";

function AddButton({ storeSlug, product, onDone }: { storeSlug: string; product: ProductCardData; onDone: () => void }) {
  const { add, pending } = useAddToCart(storeSlug);
  if (product.stock <= 0) return <span className="text-xs text-(--md-quiet)">نفد</span>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (product.hasOptions) {
          onDone();
          return openQuickView(product.slug);
        }
        const res = await add(product.id);
        if (!res.ok) return mdToast.error(res.message);
        onDone();
        openCart();
      }}
      aria-label={`أضف ${product.name} للسلة`}
      className={btn({ size: "sm", icon: true })}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
    </button>
  );
}

/** Saved products (kept in this browser — there are no shopper accounts). */
export default function WishlistDrawer({ storeSlug, dir }: { storeSlug: string; dir: "rtl" | "ltr" }) {
  const [open, setOpen] = useState(false);
  const { list, remove } = useLocalList(wishlistKey(storeSlug));
  const [cards, setCards] = useState<ProductCardData[] | null>(null);
  const ids = list.join(",");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(WISHLIST_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(WISHLIST_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    GetStorefrontCardsAction(storeSlug, { ids: ids ? ids.split(",") : [] })
      .then((c) => alive && setCards(c))
      .catch(() => alive && setCards([]));
    return () => {
      alive = false;
    };
  }, [open, ids, storeSlug]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.5)]" />
        <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(MD_PORTAL, "md-drawer fixed inset-y-0 end-0 z-50 flex w-[min(100vw,25rem)] flex-col bg-(--md-bg) shadow-2xl outline-none")}>
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-(--md-line) px-5">
            <Dialog.Title className="md-h3 flex items-center gap-2">
              المفضلة
              {list.length > 0 && <span className="md-badge md-badge--new">{num(list.length)}</span>}
            </Dialog.Title>
            <Dialog.Close className={btn({ variant: "ghost", icon: true, className: "-me-2" })} aria-label="إغلاق المفضلة">
              <X />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5">
            {list.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--md-signal) text-(--md-signal-ink)">
                  <Heart className="size-7" />
                </span>
                <p className="md-h3 mt-5">لسه مفيش حاجة محفوظة</p>
                <p className="mt-1.5 max-w-xs text-sm text-(--md-quiet)">دوس على القلب في أي منتج عشان ترجعله بسهولة. القائمة بتتحفظ على الجهاز ده.</p>
                <Dialog.Close asChild>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ className: "mt-6" })}>
                    تصفّح المنتجات
                  </Link>
                </Dialog.Close>
              </div>
            ) : !cards ? (
              <div className="space-y-4 py-5">
                {list.slice(0, 3).map((id) => (
                  <div key={id} className="flex gap-3.5">
                    <div className="md-skel aspect-[4/5] w-[4.5rem]" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="md-skel h-4 w-3/4" />
                      <div className="md-skel h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-(--md-line)">
                {cards.map((p) => (
                  <li key={p.id} className="py-4">
                    <HorizontalCard
                      product={p}
                      storeSlug={storeSlug}
                      onNavigate={() => setOpen(false)}
                      trailing={
                        <div className="flex flex-col items-center gap-1">
                          <AddButton storeSlug={storeSlug} product={p} onDone={() => setOpen(false)} />
                          <button type="button" onClick={() => remove(p.id)} aria-label={`إزالة ${p.name} من المفضلة`} className="grid size-10 place-items-center rounded-full text-(--md-quiet) hover:text-(--md-sale)">
                            <X className="size-4" />
                          </button>
                        </div>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

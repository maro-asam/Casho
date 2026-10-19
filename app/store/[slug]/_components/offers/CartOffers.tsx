"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AcceptOfferAction, TrackOfferViewsAction } from "@/actions/store/offers.actions";
import type { StorefrontOffer } from "@/lib/offers/storefront-offers";
import { notifyCartUpdated } from "../../_themes/shared/cart-events";
import { storeHref } from "../conversion/widget-position";
import { OFFER_VARS, OfferRow, isPreviewFrame, sessionOnce } from "./offer-ui";

/** "Complete your order" — the merchant's cross-sells for what's in the cart. */
export function CartOffers({ storeSlug, offers }: { storeSlug: string; offers: StorefrontOffer[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    if (isPreviewFrame()) return;
    const ids = offers.map((o) => o.id).filter((id) => sessionOnce(`casho:offer-view:${storeSlug}:${id}`));
    if (ids.length) void TrackOfferViewsAction(storeSlug, ids).catch(() => null);
  }, [offers, storeSlug]);

  if (offers.length === 0) return null;

  const accept = async (offer: StorefrontOffer, features: Record<string, string>) => {
    setPendingId(offer.id);
    setError(null);
    try {
      const res = await AcceptOfferAction(storeSlug, offer.id, { features });
      if (!res.success) {
        setError({ id: offer.id, message: res.message });
        return;
      }
      notifyCartUpdated(res.added);
      router.refresh();
    } catch {
      setError({ id: offer.id, message: "حصلت مشكلة، حاول تاني" });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section
      dir="rtl"
      style={OFFER_VARS}
      aria-labelledby="cart-offers-title"
      className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-12"
    >
      <div className="rounded-2xl border border-(--of-border) bg-(--of-bg) p-4 text-(--of-fg) sm:p-5">
        <h2 id="cart-offers-title" className="text-base font-bold">
          {offers[0].headline}
        </h2>
        <p className="mt-0.5 text-xs text-(--of-muted)">كمّل طلبك بالسعر ده — العرض بيتطبق طول ما المنتج الأساسي في السلة.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {offers.map((o) => (
            <li key={o.id} className="rounded-xl border border-(--of-border) p-3">
              <OfferRow
                offer={o}
                href={storeHref(pathname, storeSlug, `/products/${o.product.slug}`)}
                ctaLabel="ضيف للسلة"
                pending={pendingId === o.id}
                error={error?.id === o.id ? error.message : null}
                onAccept={(f) => accept(o, f)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

import { AcceptOfferAction, GetProductOffersAction, TrackOfferViewsAction } from "@/actions/store/offers.actions";
import type { ProductOffers, StorefrontOffer } from "@/lib/offers/storefront-offers";
import { CART_UPDATED_EVENT, notifyCartUpdated, type CartAddedDetail } from "../../_themes/shared/cart-events";
import { storeHref, storePath } from "../conversion/widget-position";
import { OFFER_VARS, OfferRow, isPreviewFrame, sessionOnce } from "./offer-ui";

// ─────────────────────────────────────────────────────────────────────────────
//  After a shopper adds a product, shows the merchant's offer for it:
//    upsell  → "upgrade instead"   (no → downsell, if there is one)
//    no upsell → cross-sells ("goes well with")
//  Once per product per visit; never on checkout / order pages.
// ─────────────────────────────────────────────────────────────────────────────

type Stage =
  | { kind: "upsell"; offer: StorefrontOffer }
  | { kind: "downsell"; offer: StorefrontOffer }
  | { kind: "cross"; offers: StorefrontOffer[] }
  | { kind: "done"; message: string };

type Session = { added: CartAddedDetail; offers: ProductOffers };

const QUIET = /^\/(checkout|order)(\/|$)/;

export function OfferHost({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const tracked = useRef(new Set<string>());
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const close = useCallback(() => {
    setStage(null);
    setSession(null);
    setDoneIds([]);
    setError(null);
  }, []);

  // Listen for real adds (not the ones this UI makes).
  useEffect(() => {
    let alive = true;
    const onAdded = async (event: Event) => {
      const added = (event as CustomEvent<CartAddedDetail | undefined>).detail;
      if (!added || added.fromOffer || isPreviewFrame()) return;
      if (QUIET.test(storePath(pathRef.current, storeSlug))) return;
      if (!sessionOnce(`casho:offers:${storeSlug}:${added.productId}`)) return;

      const offers = await GetProductOffersAction(storeSlug, added.productId).catch(() => null);
      if (!alive || !offers) return;
      const first: Stage | null = offers.upsell
        ? { kind: "upsell", offer: offers.upsell }
        : offers.crossSells.length
          ? { kind: "cross", offers: offers.crossSells }
          : null;
      if (!first) return;
      setSession({ added, offers });
      setDoneIds([]);
      setError(null);
      setStage(first);
    };
    window.addEventListener(CART_UPDATED_EVENT, onAdded);
    return () => {
      alive = false;
      window.removeEventListener(CART_UPDATED_EVENT, onAdded);
    };
  }, [storeSlug]);

  // Count each offer once per visit when it's actually shown.
  useEffect(() => {
    if (!stage || stage.kind === "done") return;
    const ids = (stage.kind === "cross" ? stage.offers : [stage.offer]).map((o) => o.id).filter((id) => !tracked.current.has(id));
    if (!ids.length) return;
    ids.forEach((id) => tracked.current.add(id));
    void TrackOfferViewsAction(storeSlug, ids).catch(() => null);
  }, [stage, storeSlug]);

  useEffect(() => {
    if (!stage) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, close]);

  const decline = () => {
    if (!session || !stage) return close();
    const { downsell, crossSells } = session.offers;
    // upsell → downsell → cross-sells, skipping whatever the merchant didn't set up.
    if (stage.kind === "upsell" && downsell) return setStage({ kind: "downsell", offer: downsell });
    if ((stage.kind === "upsell" || stage.kind === "downsell") && crossSells.length) return setStage({ kind: "cross", offers: crossSells });
    close();
  };

  const accept = async (offer: StorefrontOffer, features: Record<string, string>) => {
    if (!session) return;
    setPendingId(offer.id);
    setError(null);
    try {
      const res = await AcceptOfferAction(storeSlug, offer.id, {
        triggerProductId: session.added.productId,
        quantity: session.added.quantity,
        features,
      });
      if (!res.success) {
        setError({ id: offer.id, message: res.message });
        return;
      }
      notifyCartUpdated(res.added);
      router.refresh();
      if (stage?.kind === "cross") setDoneIds((ids) => [...ids, offer.id]);
      else setStage({ kind: "done", message: res.message });
    } catch {
      setError({ id: offer.id, message: "حصلت مشكلة، حاول تاني" });
    } finally {
      setPendingId(null);
    }
  };

  if (!stage || !session) return null;

  const productHref = (o: StorefrontOffer) => storeHref(pathname, storeSlug, `/products/${o.product.slug}`);
  const cartHref = storeHref(pathname, storeSlug, "/cart");
  const title =
    stage.kind === "done" ? stage.message : stage.kind === "cross" ? stage.offers[0].headline : stage.offer.headline;

  return (
    <div dir="rtl" style={OFFER_VARS} className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden onClick={close} className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-200" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="casho-offer-title"
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-(--of-bg) text-(--of-fg) shadow-2xl animate-in slide-in-from-bottom-4 fade-in-0 duration-300 sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-(--of-border) px-5 py-4">
          {stage.kind === "done" && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />}
          <div className="min-w-0 flex-1">
            <h2 id="casho-offer-title" className="text-base font-bold leading-snug">
              {title}
            </h2>
            {stage.kind === "upsell" && (
              <p className="mt-0.5 text-xs text-(--of-muted)">بدل «{session.added.name}» — هنبدّله لك في السلة.</p>
            )}
            {stage.kind === "cross" && <p className="mt-0.5 text-xs text-(--of-muted)">«{session.added.name}» اتضاف للسلة.</p>}
          </div>
          <button type="button" onClick={close} aria-label="إغلاق" className="-me-2 -mt-1 grid size-9 place-items-center rounded-full hover:bg-(--of-soft)">
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {(stage.kind === "upsell" || stage.kind === "downsell") && (
            <OfferRow
              featured
              offer={stage.offer}
              href={productHref(stage.offer)}
              ctaLabel={stage.kind === "upsell" ? "أيوه، طوّر اختياري" : "ضيفه للسلة"}
              pending={pendingId === stage.offer.id}
              error={error?.id === stage.offer.id ? error.message : null}
              onAccept={(f) => accept(stage.offer, f)}
            />
          )}
          {stage.kind === "cross" && (
            <ul className="divide-y divide-(--of-border)">
              {stage.offers.map((o) => (
                <li key={o.id} className="py-3 first:pt-0 last:pb-0">
                  <OfferRow
                    offer={o}
                    href={productHref(o)}
                    ctaLabel="ضيف"
                    pending={pendingId === o.id}
                    done={doneIds.includes(o.id)}
                    error={error?.id === o.id ? error.message : null}
                    onAccept={(f) => accept(o, f)}
                  />
                </li>
              ))}
            </ul>
          )}
          {stage.kind === "done" && <p className="text-sm text-(--of-muted)">تقدر تكمّل تسوق أو تروح للسلة تخلّص طلبك.</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-(--of-border) px-5 py-3 sm:flex-row sm:justify-between">
          {stage.kind === "upsell" || stage.kind === "downsell" ? (
            <button type="button" onClick={decline} className="min-h-10 text-sm font-medium text-(--of-muted) underline-offset-4 hover:underline">
              {stage.kind === "upsell" ? `لا شكرًا، هكمّل بـ«${session.added.name}»` : "لا شكرًا"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={close}
                className="min-h-10 rounded-[0.6rem] border border-(--of-border) px-4 text-sm font-semibold hover:bg-(--of-soft)"
              >
                كمّل التسوق
              </button>
              <a
                href={cartHref}
                className="inline-flex min-h-10 items-center justify-center rounded-[0.6rem] bg-(--of-accent) px-4 text-sm font-semibold text-(--of-accent-fg) hover:opacity-90"
              >
                روح للسلة
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

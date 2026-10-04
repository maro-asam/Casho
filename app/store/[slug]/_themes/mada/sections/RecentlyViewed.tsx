"use client";

import { useEffect, useState } from "react";

import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import type { ProductCardData } from "../../types";
import { recentKey, useLocalList } from "../lib/local-list";
import ProductCard from "../product/ProductCard";
import { Carousel, SLIDE } from "../product/ProductCarousel";
import { SectionHeader, Wrap } from "../ui";

/** Products this shopper opened before (kept in this browser). */
export default function RecentlyViewed({ storeSlug, excludeId, title = "شفتهم مؤخرًا" }: { storeSlug: string; excludeId?: string; title?: string }) {
  const { list, remove } = useLocalList(recentKey(storeSlug), 12);
  const ids = list.filter((id) => id !== excludeId).slice(0, 10).join(",");
  const [cards, setCards] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (!ids) return;
    let alive = true;
    GetStorefrontCardsAction(storeSlug, { ids: ids.split(",") })
      .then((c) => alive && setCards(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ids, storeSlug]);

  const shown = ids ? cards : [];
  if (shown.length === 0) return null;

  return (
    <Wrap className="md-section">
      <SectionHeader
        title={title}
        actions={
          <button type="button" onClick={() => list.forEach(remove)} className="md-btn md-btn--ghost md-btn--sm text-(--md-quiet)">
            مسح
          </button>
        }
      />
      <Carousel label={title}>
        {shown.map((p) => (
          <li key={p.id} className={SLIDE}>
            <ProductCard product={p} storeSlug={storeSlug} variant="compact" sizes="(max-width: 640px) 46vw, 23vw" />
          </li>
        ))}
      </Carousel>
    </Wrap>
  );
}

/** Records the current product as viewed. */
export function TrackView({ storeSlug, productId }: { storeSlug: string; productId: string }) {
  const { pushFront } = useLocalList(recentKey(storeSlug), 12);
  useEffect(() => {
    pushFront(productId);
  }, [productId, pushFront]);
  return null;
}

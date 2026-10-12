"use client";

import { useEffect, useState } from "react";

import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import type { ProductCardData } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { recentKey } from "../lib/events";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import { SectionHeader, Wrap } from "../ui";

/** Products this shopper opened before (kept in this browser). */
export default function RecentlyViewed({ storeSlug, excludeId }: { storeSlug: string; excludeId?: string }) {
  const { list, remove } = useLocalList(recentKey(storeSlug), 12);
  const ids = list.filter((id) => id !== excludeId).slice(0, 6).join(",");
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
    <Wrap className="ce-section">
      <SectionHeader
        title="شفتهم مؤخرًا"
        actions={
          <button type="button" onClick={() => list.forEach(remove)} className="min-h-10 text-sm text-(--ce-quiet) hover:text-(--ce-ink) hover:underline">
            مسح السجل
          </button>
        }
      />
      <Rail label="شفتهم مؤخرًا">
        {shown.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 46vw, 16vw" />
          </li>
        ))}
      </Rail>
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

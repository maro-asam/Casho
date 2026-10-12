"use client";

import { useEffect, useState } from "react";

import { GetStorefrontCardsAction } from "@/actions/store/storefront-products.actions";
import type { ProductCardData } from "../../types";
import { useLocalList } from "../../shared/local-list";
import { recentKey } from "../lib/events";
import ProductCard from "../product/ProductCard";
import { SectionHeader, Wrap } from "../ui";

/** Products this shopper opened before (kept in this browser). */
export default function RecentlyViewed({ storeSlug, excludeId }: { storeSlug: string; excludeId?: string }) {
  const { list, remove } = useLocalList(recentKey(storeSlug), 12);
  const ids = list.filter((id) => id !== excludeId).slice(0, 4).join(",");
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
    <Wrap className="dn-section">
      <SectionHeader
        title="شفتهم مؤخرًا"
        actions={
          <button type="button" onClick={() => list.forEach(remove)} className="dn-link dn-label text-(--dn-quiet)">
            مسح
          </button>
        }
      />
      <ul className="dn-rail dn-bleed gap-(--dn-gap) md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {shown.map((p) => (
          <li key={p.id} className="w-[44%] shrink-0 md:w-auto">
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 44vw, 22vw" />
          </li>
        ))}
      </ul>
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

import type { ProductCardData } from "../../types";
import { FAMILY_COLORS, project } from "../lib/coffee";
import { cardProfile } from "../product/ProductCard";
import { Band, SectionHead, Wrap } from "../ui";
import OriginsMap, { type MapOrigin } from "./OriginsMap";
import { st } from "@/lib/i18n/storefront";

/** Where the store's coffees come from, from their own details. */
export function originsOf(products: ProductCardData[]): MapOrigin[] {
  const groups = new Map<string, MapOrigin>();
  for (const p of products) {
    const prof = cardProfile(p);
    if (!prof.isCoffee) continue;
    // A blend is pinned on each of its countries; an origin the map doesn't know is listed without a pin.
    const places = prof.origins.length
      ? prof.origins
      : prof.origin
        ? [prof.origin]
        : [];
    for (const o of places) {
      const g =
        groups.get(o.id) ??
        groups
          .set(o.id, {
            id: o.id,
            label: o.label,
            at: o.ll ? project(o.ll) : null,
            items: [],
          })
          .get(o.id)!;
      if (g.items.length < 6)
        g.items.push({
          slug: p.slug,
          name: p.name,
          image: p.image,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          roast: prof.roast?.level ?? null,
          process: prof.process,
          notes: prof.notes
            .slice(0, 3)
            .map((n) => ({ label: n.label, color: FAMILY_COLORS[n.family] })),
        });
    }
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length);
}

/** "حزام البن": the coffee belt between the tropics as a dot map, a pin on
 *  every origin the store sells, and that origin's coffees beside it. */
export default function Origins({
  origins,
  storeSlug,
}: {
  origins: MapOrigin[];
  storeSlug: string;
}) {
  return (
    <Band tone="espresso" className="bn-section bn-origins">
      <Wrap>
        <SectionHead
          kicker={st("حزام البن")}
          title={st("قهوتنا جاية منين؟")}
          note={st(
            "كل نقطة على الخريطة محصول عندنا دلوقتي. دوس عليها وشوف قهوتها.",
          )}
        />
        <OriginsMap origins={origins} storeSlug={storeSlug} />
      </Wrap>
    </Band>
  );
}

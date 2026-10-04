import type { ProductCardData } from "../../types";
import ProductCard from "./ProductCard";

/** A horizontally swipeable row of products on phones/tablets that becomes
 *  a regular grid on desktop — keeps the home page short on mobile. */
export default function ProductRail({ products, storeSlug }: { products: ProductCardData[]; storeSlug: string }) {
  return (
    <ul className="c-rail c-bleed gap-3 sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-[repeat(var(--store-grid-cols,4),minmax(0,1fr))] lg:gap-x-5 lg:gap-y-9 lg:overflow-visible lg:px-0">
      {products.map((product) => (
        <li key={product.id} className="w-[44%] min-w-0 shrink-0 sm:w-[30%] md:w-[23%] lg:w-auto">
          <ProductCard
            product={product}
            storeSlug={storeSlug}
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 25vw"
          />
        </li>
      ))}
    </ul>
  );
}

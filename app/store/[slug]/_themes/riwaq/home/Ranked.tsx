import type { ProductCardData } from "../../types";
import ProductCard from "../product/ProductCard";
import { num } from "../ui";

/** Best sellers as a ranked rail — big outlined numerals set against each entry. */
export default function Ranked({ products, storeSlug }: { products: ProductCardData[]; storeSlug: string }) {
  return (
    <ol className="rq-rail rq-bleed gap-6 sm:gap-8">
      {products.map((p, i) => (
        <li key={p.id} className="grid w-[78%] shrink-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-2 sm:w-[44%] lg:w-[29%] xl:w-[24%]">
          <span
            aria-hidden
            className="rq-face -mb-2 select-none text-[5.5rem] font-semibold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--rq-ink)] sm:text-[7rem]"
          >
            {num(i + 1)}
          </span>
          <div className="min-w-0">
            <span className="sr-only">رقم {num(i + 1)} في الأكثر مبيعًا: </span>
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 640px) 60vw, (max-width: 1024px) 34vw, 20vw" />
          </div>
        </li>
      ))}
    </ol>
  );
}

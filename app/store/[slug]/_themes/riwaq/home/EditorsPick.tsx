import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import QuickAdd from "../product/QuickAdd";
import { Arrow, Price, discountPercent, idx, num, PlateImage } from "../ui";

/** Featured products as a magazine spread: one hero product told large,
 *  the rest as a numbered index beside it. */
export default function EditorsPick({ products, storeSlug }: { products: ProductCardData[]; storeSlug: string }) {
  const [lead, ...rest] = products;
  const list = rest.slice(0, 4);
  const href = (p: ProductCardData) => buildStoreUrl(storeSlug, `/products/${p.slug}`);
  const leadDiscount = discountPercent(lead.price, lead.compareAtPrice);

  // A single pick becomes a spread: the plate beside its story.
  const solo = list.length === 0;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
      <article className={solo ? "group relative grid grid-cols-1 gap-8 lg:col-span-12 lg:grid-cols-12 lg:items-end lg:gap-14" : "group relative lg:col-span-7"}>
        <div className={`rq-plate relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] ${solo ? "lg:col-span-7" : ""} lg:aspect-[6/5]`}>
          <PlateImage
            src={lead.image}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
          />
          {leadDiscount > 0 && <span className="rq-badge rq-badge--sale absolute start-0 top-0">−{num(leadDiscount)}٪</span>}
        </div>
        <div className={solo ? "grid grid-cols-1 gap-6 lg:col-span-5 lg:pb-4" : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"}>
          <div className="min-w-0">
            {lead.categoryName && <p className="rq-caption">{lead.categoryName}</p>}
            <h3 className="rq-h2 mt-1">
              <Link href={href(lead)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                {lead.name}
              </Link>
            </h3>
            <Price price={lead.price} compareAt={lead.compareAtPrice} size="lg" className="mt-3" />
          </div>
          <div className="relative z-[2] flex items-center gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 font-semibold">
              <span className="rq-link">شوف التفاصيل</span>
              <Arrow />
            </span>
            {lead.stock > 0 && (
              <QuickAdd
                storeSlug={storeSlug}
                productId={lead.id}
                productName={lead.name}
                productHref={href(lead)}
                hasOptions={lead.hasOptions}
              />
            )}
          </div>
        </div>
      </article>

      {list.length > 0 && (
        <ol className="self-start border-t border-(--rq-ink) lg:col-span-5">
          {list.map((p, i) => (
            <li key={p.id} className="group relative grid grid-cols-[auto_4.5rem_minmax(0,1fr)] items-center gap-4 border-b border-(--rq-rule) py-4 sm:gap-5">
              <span className="rq-num w-6 text-sm text-(--rq-accent)">{idx(i + 2)}</span>
              <span className="rq-plate relative aspect-[4/5] w-[4.5rem] overflow-hidden">
                <PlateImage src={p.image} sizes="72px" className="transition-transform duration-700 group-hover:scale-105" />
              </span>
              <span className="min-w-0">
                {p.categoryName && <span className="rq-caption block truncate">{p.categoryName}</span>}
                <Link
                  href={href(p)}
                  className="mt-0.5 line-clamp-2 text-[0.9375rem] font-medium leading-6 after:absolute after:inset-0 after:content-[''] group-hover:text-(--rq-accent)"
                >
                  {p.name}
                </Link>
                <Price price={p.price} compareAt={p.compareAtPrice} size="sm" className="mt-1.5" />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

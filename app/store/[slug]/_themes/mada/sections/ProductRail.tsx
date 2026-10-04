import type { ProductCardData } from "../../types";
import ProductCard from "../product/ProductCard";
import { Carousel, SLIDE } from "../product/ProductCarousel";
import { SectionHeader, Wrap } from "../ui";

/** Titled product carousel (best sellers, related, trending…). */
export default function ProductRail({
  products,
  storeSlug,
  eyebrow,
  title,
  subtitle,
  href,
}: {
  products: ProductCardData[];
  storeSlug: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <Wrap className="md-section md-reveal">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} href={href} />
      <Carousel label={title}>
        {products.map((p) => (
          <li key={p.id} className={SLIDE}>
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 23vw" />
          </li>
        ))}
      </Carousel>
    </Wrap>
  );
}

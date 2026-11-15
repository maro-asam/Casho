import type { ProductCardData } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import { SectionHeader, Wrap } from "../ui";

/** Titled product collection: a grid on desktop, a swipeable rail on phones. */
export default function ProductSection({
  products,
  storeSlug,
  title,
  subtitle,
  href,
  max = 8,
  cols = 4,
}: {
  products: ProductCardData[];
  storeSlug: string;
  title: string;
  subtitle?: string;
  href?: string;
  max?: number;
  /** Desktop columns (the Studio's "products per row"). */
  cols?: 3 | 4 | 5;
}) {
  if (products.length === 0) return null;
  // Whole desktop rows only so a section never ends ragged.
  const n = Math.min(products.length, max);
  const shown = products.slice(0, n >= cols ? n - (n % cols) : n);
  return (
    <Wrap data-reveal className="dn-section">
      <SectionHeader title={title} subtitle={subtitle} href={href} />
      <ProductGrid products={shown} storeSlug={storeSlug} railOnMobile cols={cols} />
    </Wrap>
  );
}

import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Swatches, Wrap, btn, delay, discountPercent, num } from "../ui";

/** One product told large: photo on one half, its story on the other. */
export default function Spotlight({ product, storeSlug, eyebrow = "من اختيارات المتجر" }: { product: ProductCardData; storeSlug: string; eyebrow?: string }) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const discount = discountPercent(product.price, product.compareAtPrice);
  return (
    <Wrap data-reveal className="dn-section">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-(--dn-gap)">
        <Link href={href} aria-label={product.name} className="dn-crop group block dn-card">
          <span className="dn-media relative block aspect-square">
            <PlateImage src={product.image} sizes="(max-width: 768px) 100vw, 50vw" className={product.hoverImage ? "dn-card-img-1 has-swap" : "dn-zoom-img"} />
            {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="dn-card-img-2 object-cover" />}
            {discount > 0 && <span className="dn-tag dn-tag--sale absolute start-0 top-0">خصم {num(discount)}٪</span>}
          </span>
        </Link>
        <div className="flex flex-col items-center px-2 text-center md:px-10 lg:px-20">
          <p className="dn-label dn-appear text-(--dn-quiet)">{eyebrow}</p>
          <h2 className="dn-h1 dn-appear mt-4 text-balance" style={delay(1)}>
            {product.name}
          </h2>
          {(product.brand || product.categoryName) && (
            <p className="dn-appear mt-3 text-sm text-(--dn-quiet)" style={delay(1)}>
              {product.brand || product.categoryName}
            </p>
          )}
          <div className="dn-appear mt-5 flex flex-col items-center gap-3" style={delay(2)}>
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" className="justify-center" />
            <Swatches colors={product.colors} />
          </div>
          <Link href={href} className={btn({ variant: "outline", className: "dn-appear mt-8" })} style={delay(3)}>
            عرض المنتج
          </Link>
        </div>
      </div>
    </Wrap>
  );
}

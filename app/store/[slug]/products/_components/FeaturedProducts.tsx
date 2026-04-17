import Link from "next/link";
import { Sparkles, MousePointer2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ProductCard from "@/app/store/[slug]/_components/shared/ProductCard";

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  isFeatured: boolean;
  category?: {
    name: string;
    slug: string;
  } | null;
};

type FeaturedProductsProps = {
  products: FeaturedProduct[];
  storeSlug: string;
};

const FeaturedProducts = ({ products, storeSlug }: FeaturedProductsProps) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-10 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-primary md:text-2xl">
            <Sparkles className="size-5" />
            المنتجات المميزة
          </h2>
          <p className="text-sm text-muted-foreground">
            أبرز المنتجات المختارة داخل المتجر
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href={`/store/${storeSlug}/featured`}>
            كل المنتجات المميزة
            <MousePointer2 />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeSlug={storeSlug}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;

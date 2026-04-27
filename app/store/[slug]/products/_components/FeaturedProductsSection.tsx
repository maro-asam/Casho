import ProductCard from "@/app/store/[slug]/_components/shared/ProductCard";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  isFeatured?: boolean;
  category?: {
    name: string;
    slug: string;
  } | null;
};

type Props = {
  title: string;
  description?: string;
  products: ProductItem[];
  storeSlug: string;
};

const FeaturedProductsSection = ({
  title,
  description,
  products,
  storeSlug,
}: Props) => {
  if (!products.length) return null;

  return (
    <section className="mb-8 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
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

export default FeaturedProductsSection;
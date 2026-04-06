import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FolderOpen, Package, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProductCard from "../../_components/shared/ProductCard";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "../../_components/products/ProductGallery";
import AddToCartButton from "../../_components/shared/AddToCartButton";
import BuyNowButton from "../../_components/BuyNowButton";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

type ProductDetailsRouteProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

function calculateDiscount(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export default async function ProductDetailsRoute({
  params,
}: ProductDetailsRouteProps) {
  const { slug, productSlug } = await params;

  if (!slug || !productSlug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
    },
  });

  if (!store || store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return notFound();
  }

  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      storeId: store.id,
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!product) return notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      storeId: store.id,
      categoryId: product.categoryId,
      isActive: true,
      NOT: {
        id: product.id,
      },
    },
    take: 4,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image: true,
      isFeatured: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPercentage = calculateDiscount(
    product.price,
    product.compareAtPrice,
  );

  const gallery =
    product.images.length > 0
      ? [
          product.image,
          ...product.images.filter((img) => img !== product.image),
        ]
      : [product.image];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-screen-2xl space-y-5 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={`/store/${store.slug}`}>
              <ArrowRight className="size-4" />
              الرجوع للمتجر
            </Link>
          </Button>

          <span>/</span>

          <Link
            href={`/store/${store.slug}`}
            className="transition hover:text-foreground"
          >
            {store.name}
          </Link>

          <span>/</span>

          <Link
            href={`/store/${store.slug}/categories/${product.category.slug}`}
            className="transition hover:text-foreground"
          >
            {product.category.name}
          </Link>

          <span>/</span>

          <span className="font-medium text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_800px]">
          <div className="order-2 space-y-6 xl:order-2">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <FolderOpen className="ml-1 size-4" />
                  {product.category.name}
                </Badge>

                {product.isFeatured && (
                  <Badge className="rounded-full px-3 py-1">
                    <Star className="ml-1 size-4" />
                    منتج مميز
                  </Badge>
                )}

                {hasDiscount && (
                  <Badge className="rounded-full px-3 py-1">
                    خصم {discountPercentage}%
                  </Badge>
                )}

                {product.brand && (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {product.brand}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-normal tracking-tight md:text-4xl">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-extrabold text-primary md:text-4xl">
                    {formatPrice(product.price)}
                  </p>

                  {hasDiscount && product.compareAtPrice && (
                    <p className="text-lg font-medium text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </p>
                  )}
                </div>

                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  {product.description?.trim()
                    ? product.description
                    : `منتج متوفر داخل متجر ${store.name}. يمكنك تصفح تفاصيل المنتج، معرفة سعره، واستكشاف منتجات مشابهة من نفس التصنيف.`}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="size-4 text-primary" />
                    تفاصيل المنتج
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">السعر الحالي</span>
                    <span className="font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {hasDiscount && product.compareAtPrice && (
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="text-muted-foreground">
                        السعر قبل الخصم
                      </span>
                      <span className="font-medium text-foreground line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">التصنيف</span>
                    <span className="font-medium text-foreground">
                      {product.category.name}
                    </span>
                  </div>

                  {product.brand && (
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="text-muted-foreground">البراند</span>
                      <span className="font-medium text-foreground">
                        {product.brand}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">المخزون</span>
                    <Badge
                      variant={product.stock > 0 ? "default" : "secondary"}
                    >
                      {product.stock > 0
                        ? `${product.stock} قطعة`
                        : "نفد المخزون"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-muted-foreground">مميز</span>
                    <Badge variant={product.isFeatured ? "default" : "outline"}>
                      {product.isFeatured ? "نعم" : "لا"}
                    </Badge>
                  </div>

                  {product.weight !== null && (
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="text-muted-foreground">الوزن</span>
                      <span className="font-medium text-foreground">
                        {product.weight} كجم
                      </span>
                    </div>
                  )}

                  {product.sizes.length > 0 && (
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="text-muted-foreground">المقاسات</span>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <Badge
                            key={size}
                            variant="outline"
                            className="rounded-full"
                          >
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colors.length > 0 && (
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-muted-foreground">الألوان</span>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <Badge
                            key={color}
                            variant="outline"
                            className="rounded-full"
                          >
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <ProductGallery
            productName={product.name}
            mainImage={product.image}
            images={gallery}
          />
        </div>

        <Card className="border-primary/10 bg-muted/30 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">جاهز للشراء؟</h2>
                <p className="text-sm text-muted-foreground">
                  تقدر تضيف المنتج للعربة أو تشتريه الآن مباشرة.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {product.stock > 0 ? (
                  <>
                    <AddToCartButton
                      variant="default"
                      size="lg"
                      storeSlug={store.slug}
                      productId={product.id}
                    />

                    <BuyNowButton
                      storeSlug={store.slug}
                      productId={product.id}
                    />
                  </>
                ) : (
                  <Button size="lg" disabled className="rounded-xl">
                    غير متوفر حاليًا
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold md:text-3xl">منتجات مشابهة</h2>
              <p className="text-sm text-muted-foreground">
                منتجات من نفس التصنيف قد تعجبك أيضًا
              </p>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link
                href={`/store/${store.slug}/categories/${product.category.slug}`}
              >
                عرض الكل
              </Link>
            </Button>
          </div>

          {relatedProducts.length === 0 ? (
            <Card className="rounded-3xl border-dashed shadow-sm">
              <CardContent className="flex min-h-45 flex-col items-center justify-center gap-3 p-6 text-center">
                <Package className="size-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    لا توجد منتجات مشابهة حاليًا
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    سيتم عرض منتجات من نفس التصنيف هنا بمجرد إضافتها.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  FolderOpen,
  Package,
  ShoppingBag,
  Star,
  Store as StoreIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProductCard from "../../_components/shared/ProductCard";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProductDetailsRouteProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

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

  if (!store || store.subscriptionStatus !== "active") {
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-screen-2xl py-6">
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
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-normal tracking-tight md:text-4xl">
                  {product.name}
                </h1>

                <p className="text-3xl font-extrabold text-primary md:text-4xl">
                  {formatPrice(product.price)}
                </p>

                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  منتج متوفر داخل متجر{" "}
                  <span className="font-semibold text-foreground">
                    {store.name}
                  </span>
                  . يمكنك تصفح تفاصيل المنتج، معرفة سعره، واستكشاف منتجات مشابهة
                  من نفس التصنيف.
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <Card className="rounded-22xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="size-4 text-primary" />
                    تفاصيل المنتج
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-muted-foreground">السعر</span>
                    <span className="font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-muted-foreground">التصنيف</span>
                    <span className="font-medium text-foreground">
                      {product.category.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-muted-foreground">الحالة</span>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "متوفر" : "غير متوفر"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-muted-foreground">مميز</span>
                    <Badge variant={product.isFeatured ? "default" : "outline"}>
                      {product.isFeatured ? "نعم" : "لا"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاريخ الإضافة</span>
                    <span className="font-medium text-foreground">
                      {formatDate(product.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-primary/10 bg-muted/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">جاهز للشراء؟</h2>
                    <p className="text-sm text-muted-foreground">
                      تقدر تضيف المنتج للسلة أو تكمل تصفح باقي المنتجات.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="rounded-xl">
                      <ShoppingBag className="ml-2 size-4" />
                      أضف إلى السلة
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="rounded-xl"
                    >
                      <Link href={`/store/${store.slug}`}>
                        <StoreIcon className="ml-2 size-4" />
                        متابعة التسوق
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="order-1 h-fit overflow-hidden rounded-3xl border-border/60 shadow-sm xl:order-1">
            <CardContent>
              <div className="relative aspect-square w-full overflow-hidden rounded-22xl bg-muted/30">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>

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

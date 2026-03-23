import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PackageOpen, Store as StoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ProductCard from "@/app/store/[slug]/_components/shared/ProductCard";

import StoreBanner from "./_components/StoreBanner";
import StoreCategories from "./_components/StoreCategories";
import FeaturedProducts from "./_components/products/FeaturedProducts";
import StoreSectionHeader from "@/app/store/[slug]/_components/shared/StoreSectionHeader";

type StoreHomeRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: StoreHomeRouteProps): Promise<Metadata> {
  const { slug } = await params;

  const store = await prisma.store.findFirst({
    where: { slug },
    select: {
      name: true,
      subscriptionStatus: true,
    },
  });

  if (!store) {
    return {
      title: "المتجر غير موجود",
      description: "تعذر العثور على هذا المتجر",
    };
  }

  return {
    title: store.name,
    description:
      store.subscriptionStatus === "active"
        ? `تصفح منتجات متجر ${store.name} وأضف ما يعجبك إلى السلة`
        : `متجر ${store.name} غير مفعل حالياً`,
  };
}

export default async function StoreHomeRoute({ params }: StoreHomeRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      categories: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      banners: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          image: true,
        },
      },
      products: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          isFeatured: true,
          isActive: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== "active") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-lg rounded-22xl shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-22xl bg-muted">
              <StoreIcon className="size-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">هذا المتجر غير مُفعّل</CardTitle>
            <CardDescription className="text-sm leading-6">
              يحتاج صاحب المتجر إلى تفعيل الاشتراك حتى يظهر المتجر للزوار بشكل
              كامل.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="py-6">
        <StoreBanner banners={store.banners} storeSlug={store.slug} />

        <FeaturedProducts
          storeSlug={store.slug}
          products={store.products
            .filter((product) => product.isFeatured && product.isActive)
            .slice(0, 8)}
        />

        <StoreCategories categories={store.categories} storeSlug={store.slug} />

        {store.products.length === 0 ? (
          <Card className="rounded-22xl border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-22xl bg-muted">
                <PackageOpen className="size-7 text-muted-foreground" />
              </div>

              <h2 className="mb-2 text-xl font-semibold">
                لا توجد منتجات متاحة حاليًا
              </h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                لم يتم إضافة منتجات نشطة إلى هذا المتجر بعد. يمكنك تصفح
                التصنيفات لاحقًا أو العودة في وقت آخر.
              </p>

              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link href={`/store/${store.slug}/categories`}>
                    عرض التصنيفات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            <StoreSectionHeader
              title="شاهد المزيد"
              btn="كل المنتجات"
              href={`/store/${store.slug}/products`}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {store.products.slice(0, 12).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

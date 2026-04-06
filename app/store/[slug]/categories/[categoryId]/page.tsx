import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Store as StoreIcon,
  FolderOpen,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

type PageProps = {
  params: Promise<{
    slug: string;
    categoryId: string;
  }>;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function CategoryProducts({ params }: PageProps) {
  const { slug, categoryId } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return (
      <div
        className="wrapper min-h-[70vh] flex items-center justify-center"
        dir="rtl"
      >
        <Card className="p-10 text-center rounded-3xl">
          <h1 className="text-xl font-bold mb-2">المتجر غير مفعل</h1>
          <p className="text-sm text-muted-foreground mb-5">
            لا يمكن عرض المنتجات حاليًا
          </p>

          <Button asChild>
            <Link href={`/store/${store.slug}`}>
              <ArrowRight className="size-4" />
              الرجوع للمتجر
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      storeId: store.id,
    },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) return notFound();

  return (
    <div className="wrapper py-10 space-y-8" dir="rtl">
      {/* HEADER */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full px-3 py-1">
            <FolderOpen className="size-4" />
            تصنيف
          </Badge>

          <h1 className="text-3xl font-bold">{category.name}</h1>

          <p className="text-sm text-muted-foreground">
            متجر: {store.name} • عدد المنتجات: {category.products.length}
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/store/${store.slug}`}>
            <ArrowRight className="size-4" />
            الرجوع للمتجر
          </Link>
        </Button>
      </section>

      {/* EMPTY */}
      {category.products.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                لا توجد منتجات في هذا التصنيف
              </h3>
              <p className="text-sm text-muted-foreground max-w-md leading-7">
                يبدو أنه لم يتم إضافة أي منتجات هنا بعد.
              </p>
            </div>

            <Button asChild>
              <Link href={`/store/${store.slug}`}>
                <StoreIcon className="size-4" />
                تصفح باقي المنتجات
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* PRODUCTS GRID */
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {category.products.map((product) => (
            <Link
              key={product.id}
              href={`/store/${store.slug}/products/${product.slug}`}
              className="group"
            >
              <Card className="overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-0">
                  {/* IMAGE */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={
                        product.image ||
                        "https://placehold.co/600x600?text=No+Image"
                      }
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        عرض المنتج →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

import { AddToCartAction } from "@/actions/store/cart.actions";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findFirst({
    where: { slug },
    include: { products: true },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">هذا المتجر غير مُفعّل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              يحتاج التاجر إلى تفعيل الاشتراك لإظهار المتجر للزوار.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10" dir="rtl">
      <div className="flex items-center justify-between gap-4 mb-10">
        <h1 className="text-4xl font-bold">{store.name}</h1>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/store/${store.slug}/categories`}>عرض التصنيفات</Link>
          </Button>

          <Button asChild variant="default">
            <Link href={`/store/${store.slug}/cart`}>عرض السلة</Link>
          </Button>
        </div>
      </div>

      {store.products.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              لا توجد منتجات متاحة حاليًا.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {store.products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.image && (
                <div className="relative w-full h-48">
                  <Image
                    fill
                    src={product.image}
                    alt={product.name}
                    className="object-cover"
                  />
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {product.price} جنيه
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button asChild variant="link" className="px-0">
                  <Link href={`/store/${store.slug}/product/${product.slug}`}>
                    عرض المنتج
                  </Link>
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";
                    await AddToCartAction(store.slug, product.id);
                  }}
                >
                  <Button type="submit" className="w-full">
                    إضافة للسلة
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

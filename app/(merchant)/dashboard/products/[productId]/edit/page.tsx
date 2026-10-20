import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

import EditProductForm from "@/app/(merchant)/dashboard/products/_components/EditProductForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("تعديل المنتج"),
};
}

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  await loadDashboardLocale();
  const { productId } = await params;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!store) {
    redirect("/");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      costPrice: true,
      sku: true,
      barcode: true,
      image: true,
      images: true,
      brand: true,
      stock: true,
      lowStockThreshold: true,
      sizes: true,
      colors: true,
      tags: true,
      weight: true,
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      type: true,
      bundleItems: true,
      categoryId: true,
      attributes: true,
      wholesaleOptions: true,
    },
  });
  if (!product) {
    redirect("/products");
  }

  const [categories, bundleProducts] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true, type: "SIMPLE", NOT: { id: productId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true },
    }),
  ]);

  return (
    <div dir={tdir()}>
      <EditProductForm
        product={product}
        categories={categories}
        products={bundleProducts}
        storefrontUrl={buildStoreUrl(store.slug, `/products/${product.slug}`)}
      />
    </div>
  );
}

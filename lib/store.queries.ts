import { prisma } from "@/lib/prisma";

export async function getStoreWithCategoriesAndProducts(
  storeSlug: string,
  categorySlug?: string,
) {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
    },
  });

  if (!store) return null;

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true },
  });

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, price: true, image: true, slug: true },
  });

  return { store, categories, products };
}

export async function getStoreCategories(storeSlug: string) {
  const store = await prisma.store.findFirst({
    where: { slug: storeSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      subscriptionStatus: true,
    },
  });

  if (!store) return null;

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true },
  });

  return { store, categories };
}

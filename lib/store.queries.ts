import { prisma } from "@/lib/prisma";

export async function getStoreWithCategoriesAndProducts(
  storeSlug: string,
  categorySlug?: string,
) {
  // Single query: fetch store + categories + filtered products together
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      categories: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true },
      },
      products: {
        where: {
          ...(categorySlug
            ? { category: { slug: categorySlug } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          slug: true,
        },
      },
    },
  });

  if (!store) return null;

  const { categories, products, ...storeInfo } = store;
  return { store: storeInfo, categories, products };
}

export async function getStoreCategories(storeSlug: string) {
  // Single query: fetch store + categories together
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      subscriptionStatus: true,
      categories: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!store) return null;

  const { categories, ...storeInfo } = store;
  return { store: storeInfo, categories };
}

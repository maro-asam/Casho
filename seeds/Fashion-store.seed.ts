import "dotenv/config";
import { prisma } from "../lib/prisma";

type SeedFashionStoreInput = {
  storeId: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function seedFashionStore({ storeId }: SeedFashionStoreInput) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true },
  });

  if (!store) {
    throw new Error("المتجر غير موجود");
  }

  const categoriesSeed = [
    {
      name: "فساتين",
      slug: "dresses",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "تيشيرتات",
      slug: "t-shirts",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "أطقم",
      slug: "sets",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "شنط",
      slug: "bags",
      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "أحذية",
      slug: "shoes",
      image:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "عروض",
      slug: "offers",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    },
  ] as const;

  const bannersSeed = [
    {
      title: "كولكشن جديد يوصل لحد باب البيت",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
      isActive: true,
    },
    {
      title: "ستايل يومي بسيط وشيك",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80",
      isActive: true,
    },
    {
      title: "خصومات على القطع المميزة",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
      isActive: true,
    },
  ] as const;

  const createdCategories = await Promise.all(
    categoriesSeed.map((category) =>
      prisma.category.upsert({
        where: {
          storeId_slug: {
            storeId,
            slug: category.slug,
          },
        },
        update: {
          name: category.name,
          image: category.image,
        },
        create: {
          name: category.name,
          slug: category.slug,
          image: category.image,
          storeId,
        },
      }),
    ),
  );

  const categoryMap = new Map(
    createdCategories.map((category) => [category.slug, category.id]),
  );

  await Promise.all(
    bannersSeed.map((banner, index) =>
      prisma.banner.upsert({
        where: {
          id: `${storeId}-fashion-banner-${index + 1}`,
        },
        update: {
          title: banner.title,
          image: banner.image,
          isActive: banner.isActive,
        },
        create: {
          id: `${storeId}-fashion-banner-${index + 1}`,
          title: banner.title,
          image: banner.image,
          isActive: banner.isActive,
          storeId,
        },
      }),
    ),
  );

  const productsSeed = [
    {
      name: "فستان كاجوال ناعم",
      slug: "fashion-casual-soft-dress",
      description: "فستان يومي بخامة مريحة وتصميم شيك مناسب للخروج والمشاوير.",
      price: 799,
      compareAtPrice: 999,
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Luna",
      stock: 14,
      sizes: ["S", "M", "L", "XL"],
      colors: ["أسود", "بيج", "أوف وايت"],
      tags: ["فستان", "كاجوال", "حريمي"],
      weight: 0.4,
      attributes: {
        material: "Cotton Blend",
        fit: "Regular",
        season: "All Season",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "dresses",
    },
    {
      name: "فستان سواريه بسيط",
      slug: "fashion-simple-evening-dress",
      description: "فستان أنيق مناسب للمناسبات والخروجات بستايل هادي وراقي.",
      price: 1399,
      compareAtPrice: 1650,
      image:
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Veloura",
      stock: 8,
      sizes: ["M", "L", "XL"],
      colors: ["أسود", "نبيتي", "كحلي"],
      tags: ["فستان", "سواريه", "مناسبات"],
      weight: 0.45,
      attributes: {
        material: "Soft Satin",
        fit: "Slim",
        sleeve: "Long Sleeve",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "dresses",
    },
    {
      name: "تيشيرت أوفر سايز",
      slug: "fashion-oversized-tshirt",
      description: "تيشيرت مريح وعملي يناسب اللوك اليومي والكاجوال.",
      price: 349,
      compareAtPrice: 449,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Mode",
      stock: 22,
      sizes: ["M", "L", "XL"],
      colors: ["أبيض", "أسود", "روز"],
      tags: ["تيشيرت", "أوفر سايز", "كاجوال"],
      weight: 0.22,
      attributes: {
        material: "Cotton",
        fit: "Oversized",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "t-shirts",
    },
    {
      name: "تيشيرت مطبوع",
      slug: "fashion-printed-tshirt",
      description: "تيشيرت بطباعة عصرية مناسب للجامعة والخروجات اليومية.",
      price: 379,
      compareAtPrice: 479,
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Nova",
      stock: 18,
      sizes: ["S", "M", "L"],
      colors: ["أبيض", "رمادي"],
      tags: ["تيشيرت", "مطبوع", "صيفي"],
      weight: 0.2,
      attributes: {
        material: "100% Cotton",
        printType: "Front Print",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "t-shirts",
    },
    {
      name: "طقم صيفي شيك",
      slug: "fashion-summer-chic-set",
      description: "طقم صيفي مريح وشيك مناسب للخروجات النهارية والبحر.",
      price: 950,
      compareAtPrice: 1150,
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Lime",
      stock: 10,
      sizes: ["M", "L", "XL"],
      colors: ["بيج", "لبني", "أبيض"],
      tags: ["طقم", "صيفي", "حريمي"],
      weight: 0.5,
      attributes: {
        material: "Linen Blend",
        pieces: 2,
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "sets",
    },
    {
      name: "طقم خروجات مودرن",
      slug: "fashion-modern-outing-set",
      description: "طقم عملي بستايل عصري مناسب للشغل والخروجات.",
      price: 1099,
      compareAtPrice: 1299,
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Mira",
      stock: 9,
      sizes: ["S", "M", "L"],
      colors: ["أسود", "بيج"],
      tags: ["طقم", "مودرن", "خروجات"],
      weight: 0.55,
      attributes: {
        material: "Crepe",
        pieces: 2,
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "sets",
    },
    {
      name: "شنطة كتف بسيطة",
      slug: "fashion-minimal-shoulder-bag",
      description: "شنطة أنيقة وعملية تناسب أغلب الإطلالات اليومية.",
      price: 699,
      compareAtPrice: 850,
      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Muse",
      stock: 15,
      sizes: [],
      colors: ["أسود", "هافان", "أوف وايت"],
      tags: ["شنطة", "كتف", "اكسسوار"],
      weight: 0.35,
      attributes: {
        material: "PU Leather",
        closure: "Zip",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "bags",
    },
    {
      name: "شنطة كروس صغيرة",
      slug: "fashion-small-cross-bag",
      description: "شنطة كروس خفيفة للمشاوير السريعة واللوك الكاجوال.",
      price: 599,
      compareAtPrice: 720,
      image:
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Chicly",
      stock: 17,
      sizes: [],
      colors: ["وردي", "أسود", "بيج"],
      tags: ["شنطة", "كروس", "بناتي"],
      weight: 0.28,
      attributes: {
        material: "Faux Leather",
        strapType: "Adjustable",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "bags",
    },
    {
      name: "كوتشي كاجوال أبيض",
      slug: "fashion-casual-white-sneakers",
      description:
        "كوتشي مريح مناسب للاستخدام اليومي ويتماشى مع أغلب الستايلات.",
      price: 899,
      compareAtPrice: 1099,
      image:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "StepUp",
      stock: 13,
      sizes: ["37", "38", "39", "40", "41"],
      colors: ["أبيض"],
      tags: ["كوتشي", "كاجوال", "أحذية"],
      weight: 0.7,
      attributes: {
        material: "Synthetic Leather",
        sole: "Rubber",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "shoes",
    },
    {
      name: "صندل شيك للبنات",
      slug: "fashion-chic-sandal",
      description: "صندل خفيف ومريح مناسب للصيف والخروجات اليومية.",
      price: 549,
      compareAtPrice: 650,
      image:
        "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
      ],
      brand: "Noura",
      stock: 11,
      sizes: ["37", "38", "39", "40"],
      colors: ["بيج", "ذهبي", "أسود"],
      tags: ["صندل", "صيفي", "أحذية"],
      weight: 0.42,
      attributes: {
        material: "PU",
        heelType: "Flat",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "shoes",
    },
  ] as const;

  const products = productsSeed.map((product) => {
    const categoryId = categoryMap.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Category not found for slug: ${product.categorySlug}`);
    }

    return {
      ...product,
      categoryId,
      storeId,
    };
  });

  await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { slug: product.slug || slugify(`${storeId}-${product.name}`) },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
          images: [...product.images],
          brand: product.brand,
          stock: product.stock,
          sizes: [...product.sizes],
          colors: [...product.colors],
          tags: [...product.tags],
          weight: product.weight,
          attributes: product.attributes,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          hasVariants: product.hasVariants,
          storeId: product.storeId,
          categoryId: product.categoryId,
        },
        create: {
          name: product.name,
          slug: product.slug || slugify(`${storeId}-${product.name}`),
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
          images: [...product.images],
          brand: product.brand,
          stock: product.stock,
          sizes: [...product.sizes],
          colors: [...product.colors],
          tags: [...product.tags],
          weight: product.weight,
          attributes: product.attributes,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          hasVariants: product.hasVariants,
          storeId: product.storeId,
          categoryId: product.categoryId,
        },
      }),
    ),
  );

  return {
    success: true,
    storeId,
    categoriesCount: createdCategories.length,
    bannersCount: bannersSeed.length,
    productsCount: products.length,
  };
}

async function main() {
  const storeId = process.argv[2];

  if (!storeId) {
    throw new Error(
      "حط storeId كأول argument. مثال: pnpm tsx prisma/seeds/fashion-store.seed.ts STORE_ID",
    );
  }

  const result = await seedFashionStore({ storeId });
  console.log("Fashion store seeded successfully:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

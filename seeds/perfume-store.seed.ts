import "dotenv/config";
import { prisma } from "../lib/prisma";

type SeedPerfumeStoreInput = {
  storeId: string;
};

const perfumeImages = {
  banner1:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottle.jpg",
  banner2:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottles.JPG",
  banner3:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20MET%20sf.1981.512.2ab.jpg",

  p1a: "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottle.jpg",
  p1b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20MET%20sf.1981.512.2ab.jpg",

  p2a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20(one%20of%20six)%20(part%20of%20a%20set)%20MET%20210021.jpg",
  p2b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottle%20MET%20DP242904.jpg",

  p3a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Glass%20perfume%20bottle%20MET%20DP-13080-021.jpg",
  p3b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20and%20stopper%20IMG%201122.jpg",

  p4a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20in%20the%20shape%20of%20a%20hes-vase%20inlaid%20with%20the%20figure%20of%20a%20princess%20MET%20DP310890.jpg",
  p4b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bottle%2C%20perfume%20(AM%201957.17.7-11).jpg",

  p5a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20in%20shape%20of%20athlete%2C%20agora%20museum%20athens%2C%20080630.jpg",
  p5b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Moscow.%20State%20Historical%20Museum.%20Perfume%20bottle%20P4151939%202600.jpg",

  p6a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Pair%20of%20Perfume%20Bottles%20LACMA%20M.80.205.19-.20%20(3%20of%206).jpg",
  p6b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20(one%20of%20six)%20(part%20of%20a%20set)%20MET%20210021.jpg",

  p7a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20MET%20sf.1981.512.2ab.jpg",
  p7b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottle%20MET%20DP242904.jpg",

  p8a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bottle%2C%20perfume%20(AM%201957.17.7-11).jpg",
  p8b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottle.jpg",

  p9a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Glass%20perfume%20bottle%20MET%20DP-13080-021.jpg",
  p9b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20and%20stopper%20IMG%201122.jpg",

  p10a:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20Bottles.JPG",
  p10b:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Perfume%20bottle%20MET%20sf.1981.512.2ab.jpg",
};

export async function seedPerfumeStore({
  storeId,
}: SeedPerfumeStoreInput) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true },
  });

  if (!store) {
    throw new Error("المتجر غير موجود");
  }

  const categoriesSeed = [
    {
      name: "عطور رجالي",
      slug: "mens-perfumes",
      image: perfumeImages.p1a,
    },
    {
      name: "عطور حريمي",
      slug: "womens-perfumes",
      image: perfumeImages.p2a,
    },
    {
      name: "عطور يونيسكس",
      slug: "unisex-perfumes",
      image: perfumeImages.p3a,
    },
    {
      name: "بوكسات هدايا",
      slug: "gift-boxes",
      image: perfumeImages.p10a,
    },
    {
      name: "عطور صغيرة",
      slug: "travel-size",
      image: perfumeImages.p7a,
    },
    {
      name: "العروض",
      slug: "offers",
      image: perfumeImages.p6a,
    },
  ] as const;

  const bannersSeed = [
    {
      title: "ريحة تثبت وتفرق من أول رشة",
      image: perfumeImages.banner1,
      isActive: true,
    },
    {
      title: "عطور رجالي وحريمي تناسب كل ذوق",
      image: perfumeImages.banner2,
      isActive: true,
    },
    {
      title: "بوكسات هدايا جاهزة للمناسبات",
      image: perfumeImages.banner3,
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

  await prisma.banner.deleteMany({
    where: {
      storeId,
      title: {
        in: bannersSeed.map((banner) => banner.title),
      },
    },
  });

  await prisma.banner.createMany({
    data: bannersSeed.map((banner) => ({
      title: banner.title,
      image: banner.image,
      isActive: banner.isActive,
      storeId,
    })),
  });

  const productsSeed = [
    {
      name: "عطر رجالي كلاسيك",
      slug: `perfume-men-classic-${storeId}`,
      description:
        "عطر رجالي ثابت بفوحان هادي ولمسة خشبية مناسبة للشغل والخروجات.",
      price: 799,
      compareAtPrice: 950,
      image: perfumeImages.p1a,
      images: [perfumeImages.p1a, perfumeImages.p1b],
      brand: "Royal Scent",
      stock: 20,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "رجالي", "كلاسيك", "ثابت"],
      weight: 0.3,
      attributes: {
        concentration: "Eau de Parfum",
        notes: ["Woody", "Amber", "Musk"],
        longevity: "6-8 hours",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "mens-perfumes",
    },
    {
      name: "عطر رجالي سبور",
      slug: `perfume-men-sport-${storeId}`,
      description:
        "عطر منعش بطابع رياضي يناسب الاستخدام اليومي والصيف.",
      price: 699,
      compareAtPrice: 850,
      image: perfumeImages.p2a,
      images: [perfumeImages.p2a, perfumeImages.p2b],
      brand: "Urban Mist",
      stock: 18,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "رجالي", "سبور", "منعش"],
      weight: 0.28,
      attributes: {
        concentration: "Eau de Toilette",
        notes: ["Citrus", "Fresh", "Marine"],
        longevity: "4-6 hours",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "mens-perfumes",
    },
    {
      name: "عطر حريمي روز",
      slug: `perfume-women-rose-${storeId}`,
      description:
        "عطر حريمي ناعم بلمسة وردية وأنثوية مناسب للسهرات والخروجات.",
      price: 849,
      compareAtPrice: 999,
      image: perfumeImages.p3a,
      images: [perfumeImages.p3a, perfumeImages.p3b],
      brand: "Velvet Bloom",
      stock: 16,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "حريمي", "روز", "ناعم"],
      weight: 0.3,
      attributes: {
        concentration: "Eau de Parfum",
        notes: ["Rose", "Vanilla", "White Musk"],
        longevity: "6-8 hours",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "womens-perfumes",
    },
    {
      name: "عطر حريمي فانيلا",
      slug: `perfume-women-vanilla-${storeId}`,
      description:
        "عطر دافئ بطابع فانيلا وسكر خفيف مناسب للشتا والمناسبات.",
      price: 899,
      compareAtPrice: 1050,
      image: perfumeImages.p4a,
      images: [perfumeImages.p4a, perfumeImages.p4b],
      brand: "Sweet Aura",
      stock: 14,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "حريمي", "فانيلا", "شتوي"],
      weight: 0.3,
      attributes: {
        concentration: "Eau de Parfum",
        notes: ["Vanilla", "Caramel", "Powdery"],
        longevity: "7-9 hours",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: true,
      categorySlug: "womens-perfumes",
    },
    {
      name: "عطر يونيسكس مسك",
      slug: `perfume-unisex-musk-${storeId}`,
      description:
        "عطر يونيسكس برائحة مسك ناعمة مناسبة للرجال والبنات.",
      price: 749,
      compareAtPrice: 899,
      image: perfumeImages.p5a,
      images: [perfumeImages.p5a, perfumeImages.p5b],
      brand: "Pure Note",
      stock: 21,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "يونيسكس", "مسك"],
      weight: 0.29,
      attributes: {
        concentration: "Eau de Parfum",
        notes: ["White Musk", "Powdery", "Soft Floral"],
        longevity: "6-7 hours",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "unisex-perfumes",
    },
    {
      name: "عطر يونيسكس عود",
      slug: `perfume-unisex-oud-${storeId}`,
      description:
        "عطر بطابع شرقي فاخر ولمسة عود مناسبة لعشاق الروائح الثقيلة.",
      price: 999,
      compareAtPrice: 1199,
      image: perfumeImages.p6a,
      images: [perfumeImages.p6a, perfumeImages.p6b],
      brand: "Oud Line",
      stock: 12,
      sizes: ["50ml", "100ml"],
      colors: [],
      tags: ["عطر", "يونيسكس", "عود", "شرقي"],
      weight: 0.31,
      attributes: {
        concentration: "Extrait",
        notes: ["Oud", "Amber", "Leather"],
        longevity: "8-10 hours",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categorySlug: "unisex-perfumes",
    },
    {
      name: "بوكس هدية رجالي",
      slug: `perfume-gift-box-men-${storeId}`,
      description:
        "بوكس هدية رجالي يحتوي على عطر مع ميني سبراي بتغليف أنيق.",
      price: 1299,
      compareAtPrice: 1499,
      image: perfumeImages.p7a,
      images: [perfumeImages.p7a, perfumeImages.p7b],
      brand: "Gift House",
      stock: 10,
      sizes: ["Box"],
      colors: [],
      tags: ["بوكس", "هدية", "رجالي"],
      weight: 0.6,
      attributes: {
        included: ["100ml Perfume", "10ml Travel Spray"],
        packaging: "Luxury Box",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: false,
      categorySlug: "gift-boxes",
    },
    {
      name: "بوكس هدية حريمي",
      slug: `perfume-gift-box-women-${storeId}`,
      description:
        "بوكس أنيق مناسب للهدايا يحتوي على عطر حريمي وميني سبراي.",
      price: 1349,
      compareAtPrice: 1550,
      image: perfumeImages.p8a,
      images: [perfumeImages.p8a, perfumeImages.p8b],
      brand: "Gift House",
      stock: 11,
      sizes: ["Box"],
      colors: [],
      tags: ["بوكس", "هدية", "حريمي"],
      weight: 0.62,
      attributes: {
        included: ["100ml Perfume", "10ml Travel Spray"],
        packaging: "Premium Box",
      },
      isActive: true,
      isFeatured: false,
      hasVariants: false,
      categorySlug: "gift-boxes",
    },
    {
      name: "عطر ميني 30 مل",
      slug: `perfume-mini-30ml-${storeId}`,
      description:
        "عطر صغير مناسب للشنطة والسفر وسهل الاستخدام اليومي.",
      price: 399,
      compareAtPrice: 499,
      image: perfumeImages.p9a,
      images: [perfumeImages.p9a, perfumeImages.p9b],
      brand: "Pocket Scent",
      stock: 30,
      sizes: ["30ml"],
      colors: [],
      tags: ["عطر", "ميني", "سفر"],
      weight: 0.15,
      attributes: {
        concentration: "Eau de Parfum",
        portability: true,
      },
      isActive: true,
      isFeatured: false,
      hasVariants: false,
      categorySlug: "travel-size",
    },
    {
      name: "عرض 2 عطر بسعر خاص",
      slug: `perfume-offer-double-pack-${storeId}`,
      description:
        "عرض اقتصادي يحتوي على 2 عطر من الأكثر طلبًا بسعر مناسب.",
      price: 1499,
      compareAtPrice: 1850,
      image: perfumeImages.p10a,
      images: [perfumeImages.p10a, perfumeImages.p10b],
      brand: "Royal Scent",
      stock: 13,
      sizes: ["2 x 50ml"],
      colors: [],
      tags: ["عرض", "عطور", "توفير"],
      weight: 0.55,
      attributes: {
        included: ["2 Perfumes"],
        offerType: "Bundle",
      },
      isActive: true,
      isFeatured: true,
      hasVariants: false,
      categorySlug: "offers",
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
        where: { slug: product.slug },
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
          slug: product.slug,
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
      "حط storeId كأول argument. مثال: npx tsx seeds/perfume-store.seed.ts STORE_ID",
    );
  }

  const result = await seedPerfumeStore({ storeId });
  console.log("Perfume store seeded successfully:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
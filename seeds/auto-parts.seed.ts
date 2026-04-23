import { prisma } from "@/lib/prisma";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function seed(storeId: string) {
  console.log("🌱 Seeding Auto Parts Store...");

  // =========================
  // Categories
  // =========================
  const categoriesData = [
    { name: "فلاتر", slug: "filters", image: "https://images.pexels.com/photos/4489732/pexels-photo-4489732.jpeg" },
    { name: "زيوت وسوائل", slug: "oils", image: "https://images.pexels.com/photos/8986147/pexels-photo-8986147.jpeg" },
    { name: "فرامل", slug: "brakes", image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg" },
    { name: "بطاريات", slug: "batteries", image: "https://images.pexels.com/photos/5699466/pexels-photo-5699466.jpeg" },
    { name: "إضاءة", slug: "lighting", image: "https://images.pexels.com/photos/2365572/pexels-photo-2365572.jpeg" },
    { name: "عفشة", slug: "suspension", image: "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg" },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        storeId,
      },
    });

    createdCategories[cat.slug] = created.id;
  }

  // =========================
  // Products
  // =========================
  const products = [
    {
      name: "فلتر زيت",
      price: 200,
      compareAtPrice: 250,
      image: "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg",
      brand: "Bosch",
      stock: 50,
      category: "filters",
    },
    {
      name: "فلتر هواء",
      price: 250,
      compareAtPrice: 300,
      image: "https://images.pexels.com/photos/4489732/pexels-photo-4489732.jpeg",
      brand: "MANN",
      stock: 40,
      category: "filters",
    },
    {
      name: "زيت محرك 5W-30",
      price: 700,
      compareAtPrice: 800,
      image: "https://images.pexels.com/photos/8986147/pexels-photo-8986147.jpeg",
      brand: "Shell",
      stock: 30,
      category: "oils",
    },
    {
      name: "تيل فرامل أمامي",
      price: 450,
      compareAtPrice: 550,
      image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg",
      brand: "Brembo",
      stock: 25,
      category: "brakes",
    },
    {
      name: "ديسك فرامل",
      price: 900,
      compareAtPrice: 1100,
      image: "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg",
      brand: "ATE",
      stock: 20,
      category: "brakes",
    },
    {
      name: "بطارية 70 أمبير",
      price: 3200,
      compareAtPrice: 3500,
      image: "https://images.pexels.com/photos/5699466/pexels-photo-5699466.jpeg",
      brand: "ACDelco",
      stock: 15,
      category: "batteries",
    },
    {
      name: "لمبة LED أمامية",
      price: 300,
      compareAtPrice: 400,
      image: "https://images.pexels.com/photos/2365572/pexels-photo-2365572.jpeg",
      brand: "Philips",
      stock: 60,
      category: "lighting",
    },
    {
      name: "مساعدين أمامي",
      price: 1800,
      compareAtPrice: 2000,
      image: "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg",
      brand: "KYB",
      stock: 10,
      category: "suspension",
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: slugify(product.name),
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
        brand: product.brand,
        stock: product.stock,
        storeId,
        categoryId: createdCategories[product.category],
        isActive: true,
        isFeatured: Math.random() > 0.6,
        tags: ["قطع غيار", "سيارات"],
      },
    });
  }

  // =========================
  // Banner
  // =========================
  await prisma.banner.create({
    data: {
      title: "أفضل قطع غيار لسيارتك 🔧",
      image: "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg",
      storeId,
      isActive: true,
    },
  });

  console.log("✅ Done Auto Parts Seed");
}

// run
const storeId = process.argv[2];

if (!storeId) {
  console.error("❌ حط storeId");
  process.exit(1);
}

seed(storeId).finally(() => prisma.$disconnect());
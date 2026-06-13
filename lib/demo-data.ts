"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, OrderSource } from "@prisma/client";

const DEMO_CATEGORIES = [
  { name: "الملابس", slug: "clothes" },
  { name: "الإكسسوارات", slug: "accessories" },
];

const DEMO_PRODUCTS = [
  {
    name: "تيشيرت قطني كلاسيك",
    price: 15000,
    compareAtPrice: 19900,
    stock: 50,
    categoryIndex: 0,
    description: "تيشيرت قطني عالي الجودة مناسب لجميع المناسبات",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=75",
  },
  {
    name: "بنطلون جينز كاجوال",
    price: 25000,
    compareAtPrice: 32000,
    stock: 30,
    categoryIndex: 0,
    description: "بنطلون جينز كاجوال بقصة عصرية",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=75",
  },
  {
    name: "جاكيت شتوي دافئ",
    price: 45000,
    compareAtPrice: 59900,
    stock: 20,
    categoryIndex: 0,
    description: "جاكيت شتوي دافئ مناسب للطقس البارد",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=75",
  },
  {
    name: "حقيبة يد جلد طبيعي",
    price: 35000,
    compareAtPrice: 45000,
    stock: 15,
    categoryIndex: 1,
    description: "حقيبة يد أنيقة من الجلد الطبيعي",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=75",
  },
  {
    name: "ساعة كلاسيك فضية",
    price: 28000,
    compareAtPrice: 38000,
    stock: 25,
    categoryIndex: 1,
    description: "ساعة كلاسيك بإطار فضي وعقارب دقيقة",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=75",
  },
];

const DEMO_CUSTOMERS = [
  { name: "أحمد محمد", phone: "01012345678", address: "شارع التحرير، القاهرة" },
  { name: "سارة إبراهيم", phone: "01198765432", address: "المعادي، القاهرة" },
  { name: "خالد حسن", phone: "01234567890", address: "المنصورة، الدقهلية" },
];

function makeSlug(name: string, storeId: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[أإآا]/g, "a")
    .replace(/[ب]/g, "b")
    .replace(/[تث]/g, "t")
    .replace(/[جح]/g, "j")
    .replace(/[دذ]/g, "d")
    .replace(/[رز]/g, "r")
    .replace(/[سش]/g, "s")
    .replace(/[صض]/g, "s")
    .replace(/[طظ]/g, "t")
    .replace(/[عغ]/g, "g")
    .replace(/[فق]/g, "f")
    .replace(/[كل]/g, "k")
    .replace(/[من]/g, "m")
    .replace(/[هوي]/g, "h")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const shortId = storeId.slice(0, 6);
  return `${base || "product"}-${shortId}-${index}`;
}

export async function seedDemoData(storeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Create categories
    const categories = await Promise.all(
      DEMO_CATEGORIES.map((cat, i) =>
        tx.category.create({
          data: {
            name: cat.name,
            slug: `${cat.slug}-${storeId.slice(0, 6)}-${i}`,
            storeId,
          },
        })
      )
    );

    // Create products
    const products = await Promise.all(
      DEMO_PRODUCTS.map((p, i) =>
        tx.product.create({
          data: {
            name: p.name,
            slug: makeSlug(p.name, storeId, i),
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stock: p.stock,
            description: p.description,
            image: p.image,
            storeId,
            categoryId: categories[p.categoryIndex].id,
            isActive: true,
            isFeatured: i === 0,
          },
        })
      )
    );

    // Create customers
    const customers = await Promise.all(
      DEMO_CUSTOMERS.map((c) =>
        tx.customer.create({
          data: {
            name: c.name,
            phone: `${c.phone.slice(0, -4)}${storeId.slice(0, 4)}`,
            address: c.address,
            storeId,
          },
        })
      )
    );

    // Create 3 sample orders
    const orderTemplates = [
      {
        customerIndex: 0,
        productIndices: [0, 1],
        status: OrderStatus.DELIVERED,
        paymentMethod: "cash_on_delivery",
      },
      {
        customerIndex: 1,
        productIndices: [2],
        status: OrderStatus.SHIPPED,
        paymentMethod: "cash_on_delivery",
      },
      {
        customerIndex: 2,
        productIndices: [3, 4],
        status: OrderStatus.PENDING,
        paymentMethod: "cash_on_delivery",
      },
    ];

    for (const order of orderTemplates) {
      const customer = customers[order.customerIndex];
      const orderProducts = order.productIndices.map((i) => products[i]);
      const subtotal = orderProducts.reduce((sum, p) => sum + p.price, 0);

      await tx.order.create({
        data: {
          guestSessionId: `demo-${storeId.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
          storeId,
          source: OrderSource.ONLINE,
          status: order.status,
          paymentMethod: order.paymentMethod,
          subtotal,
          shipping: 0,
          discount: 0,
          total: subtotal,
          fullName: customer.name ?? "عميل",
          phone: customer.phone,
          address: customer.address ?? "",
          customerId: customer.id,
          items: {
            create: orderProducts.map((p) => ({
              productId: p.id,
              price: p.price,
              quantity: 1,
            })),
          },
        },
      });
    }
  });
}

// Casho showcase store "fawh" (فوح): a perfume shop selling genuine designer
// fragrances (Chanel, Versace, YSL, Tom Ford…) with real Unsplash photos, real
// notes and Egyptian retail prices (scripts/fawh-demo/catalog.mjs), on the Casho
// Stage theme in its own blue, light and dark.
//
//   node scripts/fawh-demo/seed.mjs           create the store (refuses if the slug exists)
//   node scripts/fawh-demo/seed.mjs --remove  delete the store and its owner account
//
// Own owner account, like the other showcase stores (a second store on a real
// account would replace its real one in the dashboard). The password is printed
// once. No orders are created. Payment: cash on delivery, plus Vodafone Cash and
// InstaPay with no transfer details, so checkout never shows a number to pay to.

import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { BANNERS, CATEGORIES, PRODUCTS, REVIEWS, SLUG, STORE_PHOTOS, full, square, tall, wide } from "./catalog.mjs";

const OWNER_EMAIL = "fawh-demo@casho.store";
const STORE_NAME = "فوح";
const DAY = 24 * 60 * 60 * 1000;

const LOGO = "https://res.cloudinary.com/dc1fuwqoj/image/upload/v1795393780/casho/uploads/showcase-fawh/t3npi7qtbi4ci1w9iczg.png";
const BRANDS = new Set(PRODUCTS.map((p) => p.brand));

// ─── Theme: Casho Stage as it ships (its own blue, light and dark) ────────────

const THEME_CONFIG = {
  presetId: "stage",
  sectionOverrides: {
    home: {
      showOfferStrip: true,
      showHeroBanner: true,
      showSocialProof: true,
      showTestimonials: true,
      showAboutBrand: true,
      showNewsletter: false,
      showUrgency: false,
    },
  },
  sectionContent: {
    offerStrip: {
      items: ["عطور أصلية بالكرتونة والفاتورة", "الدفع عند الاستلام", "شحن لكل المحافظات من ٧٠ جنيه", "استبدال خلال ١٤ يوم والكرتونة مقفولة"],
    },
    collections: {
      headline: "لمين العطر؟",
      items: STORE_PHOTOS.collections.map((c) => ({ name: c.name, image: square(c.photo[0], c.photo[1], 1200), link: c.link })),
    },
    heroBanner: {
      backgroundImage: wide(STORE_PHOTOS.heroBanner[0], STORE_PHOTOS.heroBanner[1]),
      headline: "Ombré Leather",
      subheadline: "جلد ناعم وهيل على عنبر. من توم فورد، للجنسين.",
      buttonText: "اعرف أكتر",
      buttonLink: `/products/${SLUG}-tom-ford-ombre-leather-edp-100`,
      textAlign: "center",
      overlayOpacity: 25,
    },
    socialProof: {
      headline: "فوح بالأرقام.",
      stats: [
        { icon: "🧴", value: String(PRODUCTS.length), label: "عطر أصلي" },
        { icon: "🏷️", value: String(BRANDS.size), label: "براندات عالمية" },
        { icon: "🚚", value: "27", label: "محافظة بنوصلها" },
        { icon: "↩️", value: "14", label: "يوم للاستبدال" },
      ],
    },
    whyChooseUs: {
      headline: "ليه فوح.",
      cards: [
        { icon: "✅", title: "أصلي أو فلوسك راجعة", description: "كل عطر بالكرتونة والسلوفان وكود التشغيلة، ومعاه فاتورة." },
        { icon: "💰", title: "سعر مصر الحقيقي", description: "أسعارنا قريبة من أرخص سعر معلن في السوق، ومن غير رسوم مخفية." },
        { icon: "🚚", title: "ادفع لما يوصلك", description: "الدفع عند الاستلام لكل المحافظات، أو فودافون كاش وإنستاباي." },
        { icon: "↩️", title: "استبدال ١٤ يوم", description: "لو الكرتونة لسه مقفولة تقدر تبدّل العطر بأي عطر تاني." },
      ],
    },
    testimonials: {
      headline: "قالوا عن فوح.",
      items: [
        { name: "أحمد الشاذلي", text: "قارنت الكود اللي على الكرتونة بموقع شانيل وطلع سليم. الثبات أكتر من ٨ ساعات.", rating: 5 },
        { name: "سلمى رأفت", text: "جبت ليبر في العرض ووفرت ألفين جنيه تقريبًا، وأصلي ١٠٠٪.", rating: 5 },
        { name: "ياسر عبدالحميد", text: "أومبريه ليذر من أحسن عطور الجلد، والسعر هنا أقل من أي مكان.", rating: 5 },
        { name: "هبة الله محمد", text: "نمبر ٥ هدية لماما، الكرتونة والتغليف كانوا ممتازين.", rating: 5 },
      ],
    },
    aboutBrand: {
      headline: "عطور أصلية، بسعرها في مصر.",
      text: "فوح محل عطور بيجيب البراندات العالمية من موزعين معتمدين، وبيبيعها بالكرتونة والفاتورة وبسعر قريب من أرخص سعر في السوق.",
      image: STORE_PHOTOS.about,
      ctaText: "اعرف أكتر",
    },
  },
};

// ─── Run ─────────────────────────────────────────────────────────────────────

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20_000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function remove() {
  const store = await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true, user: { select: { id: true, email: true } } } });
  if (!store) return console.log(`No store at "${SLUG}".`);
  if (store.user.email !== OWNER_EMAIL) throw new Error(`"${SLUG}" belongs to ${store.user.email}, not the demo account. Not touching it.`);
  const storeId = store.id;
  const byStore = { storeId };
  const byStoreProduct = { product: { storeId } };
  // Same order as deleteStoreTree (lib/admin/deletion.ts): RESTRICT children first.
  await prisma.$transaction(
    async (tx) => {
      await tx.suggestedOrder.deleteMany({ where: byStore });
      await tx.cartItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.posReturn.deleteMany({ where: byStore });
      await tx.posReturnItem.deleteMany({ where: byStoreProduct });
      await tx.orderItem.deleteMany({ where: { OR: [{ order: byStore }, byStoreProduct] } });
      await tx.order.deleteMany({ where: byStore });
      await tx.stockMovement.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.purchaseOrderItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.stockTransferItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.inventoryAdjustmentItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.stockTransfer.deleteMany({ where: byStore });
      await tx.posShift.deleteMany({ where: byStore });
      await tx.productReview.deleteMany({ where: byStore });
      await tx.product.deleteMany({ where: byStore });
      await tx.category.deleteMany({ where: byStore });
      await tx.banner.deleteMany({ where: byStore });
      await tx.visit.deleteMany({ where: byStore });
      await tx.shippingMethod.deleteMany({ where: byStore });
      await tx.storePaymentSettings.deleteMany({ where: byStore });
      await tx.storeSettings.deleteMany({ where: byStore });
      await tx.balanceTransaction.deleteMany({ where: byStore });
      await tx.store.delete({ where: { id: storeId } });
      const others = await tx.store.count({ where: { userId: store.user.id } });
      if (others === 0) {
        await tx.session.deleteMany({ where: { userId: store.user.id } });
        await tx.user.delete({ where: { id: store.user.id } });
      }
    },
    { timeout: 60_000 },
  );
  console.log(`Removed "${SLUG}" and the demo account.`);
}

async function create() {
  if (await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true } })) {
    throw new Error(`A store already lives at "${SLUG}". Run with --remove first.`);
  }
  const taken = await prisma.product.findMany({ where: { slug: { in: PRODUCTS.map((p) => `${SLUG}-${p.slug}`) } }, select: { slug: true } });
  if (taken.length) throw new Error(`Product slugs already taken: ${taken.map((t) => t.slug).join(", ")}`);

  const plan = await prisma.plan.findFirst({ where: { key: "PLATINUM" }, select: { id: true } });
  const password = randomBytes(12).toString("base64url");
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const now = Date.now();
  const yearOut = new Date(now + 365 * DAY);

  const owner =
    (await prisma.user.findUnique({ where: { email: OWNER_EMAIL }, select: { id: true } })) ??
    (await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        name: "فوح — متجر تجريبي",
        password: hash,
        passwordAlgo: "argon2id",
        businessType: "عطور ومستحضرات تجميل",
        emailVerified: true,
        mustVerifyEmail: false,
      },
      select: { id: true },
    }));
  await prisma.user.update({ where: { id: owner.id }, data: { password: hash, passwordAlgo: "argon2id" } });

  const storeId = randomUUID();
  const catIds = Object.fromEntries(CATEGORIES.map((c) => [c.key, randomUUID()]));
  const productIds = Object.fromEntries(PRODUCTS.map((p) => [p.slug, randomUUID()]));
  const methods = ["cash_on_delivery", "vodafone_cash", "instapay"];

  await prisma.$transaction(
    async (tx) => {
      await tx.store.create({
        data: {
          id: storeId,
          name: STORE_NAME,
          slug: SLUG,
          userId: owner.id,
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: yearOut,
          autoRenew: false,
          planSelected: true,
          ...(plan && { planId: plan.id }),
          onboardingCompleted: true,
          businessCategory: "عطور ومستحضرات تجميل",
          paymentMethods: methods,
          settings: {
            create: {
              themeId: "stage",
              themeConfig: THEME_CONFIG,
              fontId: "ibm-plex-sans-arabic",
              logo: LOGO,
              logoRadius: 12,
              navbarVariant: "default",
              storeLanguage: "ar",
              shippingPrice: 7000,
              description:
                "فوح محل عطور أصلية: شانيل، فرزاتشي، إيف سان لوران، توم فورد، وغيرهم بأسعار مصر. ده متجر تجريبي من كاشو لعرض ثيم «كاشو ستيدج»: العطور ونوتاتها وأسعارها حقيقية من السوق المصري، بس الطلبات منه مش هتتنفّذ.",
              announcementText: "متجر تجريبي من كاشو — الطلبات مش هتتنفّذ | عطور أصلية بالكرتونة | الدفع عند الاستلام",
              seoTitle: "فوح — عطور أصلية (متجر تجريبي)",
              seoDescription: "متجر تجريبي من كاشو لعرض ثيم «كاشو ستيدج»: عطور براندات عالمية أصلية بأسعار مصر.",
              isIndexed: false,
              emailNewOrders: false,
              emailCustomerOrders: false,
              emailStoreAlerts: false,
            },
          },
          storePaymentSettings: {
            create: {
              enabledPaymentMethods: methods,
              cashOnDeliveryEnabled: true,
              vodafoneCashEnabled: true,
              instapayEnabled: true,
              // No transfer details on purpose: a demo must never show a number to send money to.
            },
          },
        },
      });

      await tx.shippingMethod.createMany({
        data: [
          { storeId, name: "القاهرة والجيزة", price: 7000, estimatedDays: 2, sortOrder: 0 },
          { storeId, name: "الإسكندرية والدلتا", price: 8000, estimatedDays: 3, sortOrder: 1 },
          { storeId, name: "القناة والصعيد", price: 9500, estimatedDays: 4, sortOrder: 2 },
        ],
      });

      await tx.category.createMany({
        data: CATEGORIES.map((c, i) => ({ id: catIds[c.key], storeId, name: c.name, slug: c.key, image: square(c.photo[0], c.photo[1], 900), createdAt: new Date(now - (120 - i) * DAY) })),
      });

      await tx.product.createMany({
        data: PRODUCTS.map((p, i) => {
          const image = square(p.photo[0], p.photo[1]);
          return {
            id: productIds[p.slug],
            storeId,
            categoryId: catIds[p.cat],
            name: p.name,
            slug: `${SLUG}-${p.slug}`,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAt ?? null,
            costPrice: Math.round(p.price * 0.82),
            image,
            images: [image, full(p.photo[0])],
            brand: p.brand,
            stock: p.stock,
            lowStockThreshold: 3,
            sku: `FW-${String(i + 1).padStart(3, "0")}`,
            tags: [p.cat],
            weight: 0.45,
            isActive: true,
            isFeatured: Boolean(p.featured),
            createdAt: new Date(now - p.age * DAY - i * 60_000),
          };
        }),
      });

      await tx.banner.createMany({
        data: BANNERS.map((b, i) => ({
          storeId,
          title: b.title,
          subtitle: b.subtitle,
          ctaLabel: b.cta,
          image: wide(b.wide[0], b.wide[1]),
          mobileImage: tall(b.tall[0], b.tall[1]),
          position: i,
          linkType: "PRODUCT",
          linkProductId: productIds[b.link.product],
        })),
      });

      await tx.productReview.createMany({
        data: REVIEWS.map(([slug, customerName, rating, title, content], i) => ({
          productId: productIds[slug],
          storeId,
          customerName,
          rating,
          title,
          content,
          verifiedPurchase: false,
          reviewDate: new Date(now - (2 + i * 3) * DAY),
        })),
      });
    },
    { timeout: 60_000 },
  );

  console.log(`Created "${SLUG}": ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${BANNERS.length} banners, ${REVIEWS.length} reviews.`);
  console.log(`Owner login: ${OWNER_EMAIL} / ${password}`);
}

try {
  await (process.argv.includes("--remove") ? remove() : create());
} finally {
  await prisma.$disconnect();
  await pool.end();
}

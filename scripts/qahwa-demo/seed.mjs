// Casho showcase store "qahwa" («قهوة»): a specialty coffee roastery on the
// Casho Bunn theme — single origins with their crop details, espresso blends,
// Turkish coffee, brewing gear and mugs (scripts/qahwa-demo/catalog.mjs).
//
//   node scripts/qahwa-demo/seed.mjs           create the store (refuses if the slug exists)
//   node scripts/qahwa-demo/seed.mjs --remove  delete the store and its owner account
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
import { BANNERS, CATEGORIES, PRODUCTS, REVIEWS, SLUG, STORE_PHOTOS, square, tall, wide } from "./catalog.mjs";

const OWNER_EMAIL = "qahwa-demo@casho.store";
const STORE_NAME = "قهوة";
const DAY = 24 * 60 * 60 * 1000;

/** Arabic-Indic digits, like the rest of the store. */
const ar = (n) => n.toLocaleString("ar-EG");

const ORIGINS = new Set(PRODUCTS.flatMap((p) => p.attributes.filter((a) => a.key === "المنشأ").flatMap((a) => a.value.split("، "))));

// ─── Theme: Casho Bunn as it ships (kraft and espresso, light and dark) ──────

const THEME_CONFIG = {
  presetId: "bunn",
  sectionOverrides: {
    home: {
      showOfferStrip: true,
      showHeroBanner: true,
      showUrgency: true,
      showTestimonials: true,
      showSocialProof: true,
    },
  },
  sectionContent: {
    offerStrip: {
      items: ["بنحمّص على دفعات صغيرة كل أسبوع", "اختار الطحنة اللي تناسب طريقتك", "الدفع عند الاستلام", "شحن لكل المحافظات", "شحن مجاني فوق ١٥٠٠ جنيه"],
    },
    urgency: {
      headline: "عروض الموسم على أدوات وبن مختار",
      showStockBadge: true,
    },
    heroBanner: {
      backgroundImage: wide(STORE_PHOTOS.heroBanner[0], STORE_PHOTOS.heroBanner[1]),
      headline: "مش عارف تبدأ منين؟",
      subheadline: "بوكس التذوّق فيه تلات محاصيل من تلات قارات، ١٠٠ جم من كل واحد. أحلى طريقة تعرف ذوقك.",
      buttonText: "شوف البوكس",
      buttonLink: `/products/${SLUG}-tasting-box`,
      textAlign: "right",
      overlayOpacity: 45,
    },
    socialProof: {
      headline: "قهوتنا بالأرقام",
      stats: [
        { icon: "🌍", value: ar(ORIGINS.size), label: "بلد بنجيب منها البن" },
        { icon: "☕", value: ar(PRODUCTS.filter((p) => ["specialty", "espresso", "turkish"].includes(p.cat)).length), label: "نوع بن وخلطة" },
        { icon: "🔥", value: "٧ أيام", label: "أقصى عمر للبن قبل الشحن" },
        { icon: "🚚", value: ar(27), label: "محافظة بنوصلها" },
      ],
    },
    whyChooseUs: {
      headline: "ليه تشرب قهوتك مننا؟",
      cards: [
        { icon: "🔥", title: "متحمّص طازة", description: "بنحمّص على دفعات صغيرة كل أسبوع، وتاريخ التحميص مكتوب على كل كيس." },
        { icon: "⚙️", title: "طحنة على مقاسك", description: "اختار حبوب أو إسبريسو أو تركي أو فلتر، وبنطحن يوم الشحن." },
        { icon: "🌍", title: "محاصيل معروفة أصلها", description: "كل بن معاه منشأه ومعالجته وارتفاعه ونكهاته، من غير كلام عام." },
        { icon: "💬", title: "اسألنا قبل ما تشتري", description: "محتار في البن أو الأداة؟ ابعتلنا على واتساب ونرشحلك." },
      ],
    },
    testimonials: {
      headline: "بيقولوا إيه عن قهوتنا",
      items: REVIEWS.filter(([, , rating]) => rating === 5)
        .slice(0, 8)
        .map(([, name, rating, , text]) => ({ name, text, rating })),
    },
    aboutBrand: {
      headline: "من المحمصة لفنجانك",
      text: "«قهوة» محمصة صغيرة بتجيب بن أخضر مختار من مزارع ومناطق معروفة، وبتحمّصه على دفعات صغيرة عشان يوصلك وهو في عزّه. هدفنا إن كل حد في مصر يقدر يشرب قهوة مختصة في بيته، ويعرف هي جاية منين وتتعمل إزاي.",
      image: STORE_PHOTOS.about,
      ctaText: "اعرف حكايتنا",
    },
    newsletter: {
      headline: "المحصول الجديد يوصلك أول ما يتحمّص",
      subheadline: "ابعتلنا على واتساب وهنقولك أول ما ينزل بن جديد أو عرض.",
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
        name: "قهوة — متجر تجريبي",
        password: hash,
        passwordAlgo: "argon2id",
        businessType: "قهوة ومحامص",
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
          businessCategory: "قهوة ومحامص",
          paymentMethods: methods,
          settings: {
            create: {
              themeId: "bunn",
              themeConfig: THEME_CONFIG,
              fontId: "ibm-plex-sans-arabic",
              navbarVariant: "default",
              storeLanguage: "ar",
              shippingPrice: 6500,
              description:
                "«قهوة» محمصة قهوة مختصة: بن من إثيوبيا وكولومبيا واليمن وغيرهم، متحمّص على دفعات صغيرة، بالطحنة اللي تناسبك، مع أدوات التحضير. ده متجر تجريبي من كاشو لعرض ثيم «كاشو بُن»: المحاصيل وتفاصيلها حقيقية، بس الطلبات منه مش هتتنفّذ.",
              announcementText: "متجر تجريبي من كاشو — الطلبات مش هتتنفّذ | بن متحمّص على دفعات صغيرة | اختار الطحنة مع طلبك",
              seoTitle: "قهوة — محمصة قهوة مختصة (متجر تجريبي)",
              seoDescription: "متجر تجريبي من كاشو لعرض ثيم «كاشو بُن»: محاصيل قهوة مختصة، خلطات إسبريسو، قهوة تركي وأدوات تحضير.",
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
          { storeId, name: "القاهرة والجيزة", price: 6500, estimatedDays: 2, sortOrder: 0 },
          { storeId, name: "الإسكندرية والدلتا", price: 7500, estimatedDays: 3, sortOrder: 1 },
          { storeId, name: "القناة والصعيد", price: 9000, estimatedDays: 4, sortOrder: 2 },
        ],
      });

      await tx.category.createMany({
        data: CATEGORIES.map((c, i) => ({ id: catIds[c.key], storeId, name: c.name, slug: `${SLUG}-${c.key}`, image: square(c.photo[0], c.photo[1], 900), createdAt: new Date(now - (120 - i) * DAY) })),
      });

      await tx.product.createMany({
        data: PRODUCTS.map((p, i) => {
          const image = square(p.photos[0][0], p.photos[0][1]);
          return {
            id: productIds[p.slug],
            storeId,
            categoryId: catIds[p.cat],
            name: p.name,
            slug: `${SLUG}-${p.slug}`,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAt ?? null,
            costPrice: Math.round(p.price * 0.6),
            image,
            images: [image, ...p.photos.slice(1).map(([id, fp]) => square(id, fp))],
            stock: p.stock,
            lowStockThreshold: 3,
            sku: `QH-${String(i + 1).padStart(3, "0")}`,
            tags: [p.cat],
            colors: p.colors ?? [],
            sizes: p.sizes ?? [],
            attributes: p.attributes,
            weight: p.kg,
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
          ...(b.link.product ? { linkType: "PRODUCT", linkProductId: productIds[b.link.product] } : { linkType: "CATEGORY", linkCategoryId: catIds[b.link.category] }),
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

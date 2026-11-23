// Casho showcase store "levelup" (ليفل أب): a game top-up shop — Free Fire
// diamonds, PUBG UC, CoD CP, Yalla Ludo, Roblox, Fortnite, Valorant, and
// PlayStation / Xbox / Steam / Apple / Google Play cards — as digital products
// (no shipping, no cash on delivery), on the `gym` theme in its own colors.
//
//   node scripts/levelup-demo/art.mjs            draw + upload the images (writes images.json)
//   node scripts/levelup-demo/seed.mjs           create the store (refuses if the slug exists)
//   node scripts/levelup-demo/seed.mjs --remove  delete the store and its owner account
//
// Own owner account, like scripts/seed-qirat-demo.mjs (a second store on a real
// account would replace its real one in the dashboard). The password is printed
// once. No orders are created. Payment: Vodafone Cash + InstaPay with no transfer
// details, so checkout never shows a number to send money to.

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { BANNERS, CATEGORIES, PRODUCTS, REVIEWS, SHOWCASE_COPY, SLUG } from "./catalog.mjs";

const OWNER_EMAIL = "levelup-demo@casho.store";
const STORE_NAME = "ليفل أب";
const DAY = 24 * 60 * 60 * 1000;

const IMAGES = JSON.parse(await readFile(new URL("./images.json", import.meta.url), "utf8"));

const BRANDS = {
  "free-fire": "Garena",
  pubg: "PUBG Mobile",
  cod: "Call of Duty",
  "yalla-ludo": "Yalla Ludo",
  roblox: "Roblox",
  fortnite: "Epic Games",
  valorant: "Riot Games",
  playstation: "PlayStation",
  xbox: "Xbox",
  steam: "Steam",
};
const brandOf = (p) => BRANDS[p.cat] ?? (p.slug.startsWith("google") ? "Google Play" : "Apple");

// ─── Theme: Casho Gym in violet + lime (every Gym surface mixes from these) ──

const THEME_CONFIG = {
  presetId: "gym",
  tokenOverrides: {
    primary: "#7b3cff",
    primaryForeground: "#ffffff",
    secondary: "#d4ff3a",
    secondaryForeground: "#0b0b10",
    background: "#07060d",
    foreground: "#f3f1fa",
    surface: "#120f1d",
    surfaceForeground: "#f3f1fa",
    card: "#120f1d",
    cardForeground: "#f3f1fa",
    muted: "#1a1628",
    mutedForeground: "#a7a1bf",
    border: "#2a2540",
    accent: "#1a1033",
    accentForeground: "#b79bff",
    glowPrimary: "0 22px 50px -24px rgba(123,60,255,0.75)",
    heroOverlay: "linear-gradient(to left, rgba(7,6,13,.9), rgba(7,6,13,.15) 72%)",
  },
  sectionOverrides: {
    home: {
      showHeroBanner: true,
      showOfferStrip: true,
      showUrgency: true,
      showCollections: true,
      showSocialProof: true,
      showWhyChooseUs: true,
      showTestimonials: true,
      showAboutBrand: true,
      showCalculator: false,
      showNewsletter: false,
    },
  },
  sectionContent: {
    offerStrip: { items: SHOWCASE_COPY.offerStrip },
    urgency: { headline: "عروض آخر السنة على باقات مختارة", timerEndDate: "2026-12-31T21:59:00.000Z", timerLabel: "العرض بيخلص بعد", showStockBadge: false },
    collections: {
      headline: "بتلعب على إيه؟",
      items: [
        { name: "على الموبايل", image: IMAGES.collections["col-mobile"], link: "free-fire" },
        { name: "على البلايستيشن", image: IMAGES.collections["col-console"], link: "playstation" },
        { name: "على الكمبيوتر", image: IMAGES.collections["col-pc"], link: "steam" },
        { name: "هدية لحد بيلعب", image: IMAGES.collections["col-gift"], link: "apple-google" },
      ],
    },
    heroBanner: {
      backgroundImage: IMAGES.banners["hero-gamepass"].wide,
      headline: "Game Pass Ultimate",
      subheadline: "مكتبة ألعاب كاملة على الإكس بوكس والكمبيوتر، والألعاب الجديدة من أول يوم.",
      buttonText: "اشترك بـ 1,699 جنيه",
      buttonLink: `/products/${SLUG}-game-pass-ultimate-1m`,
      textAlign: "right",
      overlayOpacity: 30,
    },
    socialProof: {
      headline: "كل اللي محتاجه في مكان واحد",
      stats: [
        { icon: "🎮", value: String(CATEGORIES.length), label: "لعبة ومتجر" },
        { icon: "💎", value: String(PRODUCTS.length), label: "باقة وكارت" },
        { icon: "⚡", value: "15", label: "دقيقة أقصى وقت شحن" },
        { icon: "🕑", value: "7/7", label: "أيام في الأسبوع" },
      ],
    },
    whyChooseUs: {
      headline: "ليه تشحن من ليفل أب",
      cards: [
        { icon: "🆔", title: "بالـ ID بس", description: "مش هنطلب منك باسورد ولا إيميل حسابك. الـ Player ID كفاية." },
        { icon: "⚡", title: "في دقايق", description: "أغلب الطلبات بتتشحن في أقل من ١٥ دقيقة من تأكيد الدفع." },
        { icon: "💳", title: "ادفع زي ما تحب", description: "فودافون كاش أو إنستاباي، والسعر بالجنيه من غير عمولة." },
        { icon: "✅", title: "أكواد أصلية", description: "الكروت من موزعين معتمدين، ولو كود ماشتغلش بنبدّله." },
      ],
    },
    testimonials: {
      headline: "اللاعيبة بيقولوا",
      items: [
        { name: "يوسف أحمد", text: "طلبت الساعة ١٢ بالليل والجواهر نزلت في أقل من ١٠ دقايق.", rating: 5 },
        { name: "كريم حسن", text: "الشدات وصلت قبل ما أقفل الشات. هشحن الرويال باس الجاي من هنا.", rating: 5 },
        { name: "محمد طارق", text: "كود البلايستيشن اشتغل على حسابي الأمريكي من أول مرة.", rating: 5 },
        { name: "منة أشرف", text: "ابني كان عايز روبوكس، الكارت اتفعّل في ثانية والرد على واتساب سريع.", rating: 5 },
      ],
    },
    aboutBrand: {
      headline: "من جروب صحاب لمتجر شحن",
      text: "بدأنا بنشحن لبعض في جروب واتساب، وبعدين لصحاب صحابنا. النهارده بنشحن لآلاف اللاعيبة كل شهر بنفس القاعدة: بالـ ID بس، بسعر واضح بالجنيه، وفي دقايق.",
      image: IMAGES.misc.about,
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
  const missing = PRODUCTS.filter((p) => !IMAGES.products?.[p.slug]).map((p) => p.slug);
  if (missing.length) throw new Error(`No image for: ${missing.join(", ")} — run art.mjs first.`);
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
        name: "ليفل أب — متجر تجريبي",
        password: hash,
        passwordAlgo: "argon2id",
        businessType: "ألعاب وشحن رقمي",
        emailVerified: true,
        mustVerifyEmail: false,
      },
      select: { id: true },
    }));
  await prisma.user.update({ where: { id: owner.id }, data: { password: hash, passwordAlgo: "argon2id" } });

  const storeId = randomUUID();
  const catIds = Object.fromEntries(CATEGORIES.map((c) => [c.key, randomUUID()]));
  const productIds = Object.fromEntries(PRODUCTS.map((p) => [p.slug, randomUUID()]));
  const methods = ["vodafone_cash", "instapay"];

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
          businessCategory: "ألعاب وشحن رقمي",
          paymentMethods: methods,
          settings: {
            create: {
              themeId: "gym",
              themeConfig: THEME_CONFIG,
              fontId: "tajawal",
              logo: IMAGES.misc.logo,
              logoRadius: 14,
              primaryColor: THEME_CONFIG.tokenOverrides.primary,
              secondaryColor: THEME_CONFIG.tokenOverrides.secondary,
              navbarVariant: "default",
              storeLanguage: "ar",
              shippingPrice: 0,
              description:
                "شحن ألعاب وكروت رقمية بالـ ID: جواهر فري فاير، شدات ببجي، نقاط كول أوف ديوتي، روبوكس، وكروت بلايستيشن وستيم وإكس بوكس. ده متجر تجريبي من كاشو لعرض متجر شحن ألعاب: الباقات والأسعار حقيقية من السوق المصري، بس الطلبات منه مش هتتنفّذ.",
              announcementText: "متجر تجريبي من كاشو — الطلبات مش هتتنفّذ | شحن بالـ ID في دقايق | فودافون كاش وإنستاباي",
              seoTitle: "ليفل أب — شحن ألعاب وكروت رقمية (متجر تجريبي)",
              seoDescription: "متجر تجريبي من كاشو لشحن الألعاب: جواهر فري فاير، شدات ببجي، وكروت بلايستيشن وستيم.",
              isIndexed: false,
              emailNewOrders: false,
              emailCustomerOrders: false,
              emailStoreAlerts: false,
            },
          },
          storePaymentSettings: {
            create: {
              enabledPaymentMethods: methods,
              cashOnDeliveryEnabled: false,
              vodafoneCashEnabled: true,
              instapayEnabled: true,
              // No transfer details on purpose: a demo must never show a number to send money to.
            },
          },
        },
      });

      await tx.category.createMany({
        data: CATEGORIES.map((c, i) => ({ id: catIds[c.key], storeId, name: c.name, slug: c.key, image: IMAGES.categories[c.key], createdAt: new Date(now - (90 - i) * DAY) })),
      });

      await tx.product.createMany({
        data: PRODUCTS.map((p, i) => {
          const image = IMAGES.products[p.slug];
          return {
            id: productIds[p.slug],
            storeId,
            categoryId: catIds[p.cat],
            name: p.name,
            slug: `${SLUG}-${p.slug}`,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAt ?? null,
            image,
            images: [image],
            brand: brandOf(p),
            stock: 0,
            isDigital: true,
            sku: `LU-${String(i + 1).padStart(3, "0")}`,
            tags: [p.cat],
            isActive: true,
            isFeatured: Boolean(p.featured),
            // Keep the catalog order within a shelf (newest first on the storefront).
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
          image: IMAGES.banners[b.key].wide,
          mobileImage: IMAGES.banners[b.key].tall,
          position: i,
          linkType: b.link.type,
          linkCategoryId: b.link.cat ? catIds[b.link.cat] : null,
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
          reviewDate: new Date(now - (2 + i * 2) * DAY),
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

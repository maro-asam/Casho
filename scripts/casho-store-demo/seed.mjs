// Casho example store "Casho Store" (casho-games.casho.store): game and app
// top-ups on the Casho Arena theme, priced in Sudanese pounds, with the
// packages and prices the user sent (scripts/casho-store-demo/catalog.mjs) and
// the user's game posters (art.mjs → images.json).
//
//   node scripts/casho-store-demo/seed.mjs           create the store (refuses if the slug exists)
//   node scripts/casho-store-demo/seed.mjs --remove  delete the store and its owner account
//
// Own owner account, like the other showcase stores (a second store on a real
// account would replace its real one in the dashboard). The password is printed
// once. No orders are created. Payment: bank transfer with no transfer details,
// so checkout never shows an account to pay to. Packages are digital (no
// shipping, no cash on delivery) and ask for the player's ID.

import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { CURRENCY, GAMES, HERO, PACKAGES, SLUG, STORE_NAME } from "./catalog.mjs";

const OWNER_EMAIL = "casho-games-demo@casho.store";
const DAY = 24 * 60 * 60 * 1000;
const IMAGES = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "images.json"), "utf8"));

// ─── Theme: Casho Arena as the reference app looks (hero → games → how it works) ─

const THEME_CONFIG = {
  presetId: "arena",
  sectionOverrides: {
    home: {
      showFeaturedProducts: false,
      showLatestProducts: false,
      showOfferStrip: false,
      showWhyChooseUs: true,
    },
  },
  sectionContent: {},
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
  const taken = await prisma.product.findMany({ where: { slug: { in: PACKAGES.map((p) => `${SLUG}-${p.slug}`) } }, select: { slug: true } });
  if (taken.length) throw new Error(`Product slugs already taken: ${taken.map((t) => t.slug).join(", ")}`);
  for (const key of [...GAMES.map((g) => g.key), "hero"]) if (!IMAGES[key]) throw new Error(`images.json has no "${key}" — run art.mjs first.`);

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
        name: "Casho Store — متجر تجريبي",
        password: hash,
        passwordAlgo: "argon2id",
        businessType: "شحن ألعاب وتطبيقات",
        emailVerified: true,
        mustVerifyEmail: false,
      },
      select: { id: true },
    }));
  await prisma.user.update({ where: { id: owner.id }, data: { password: hash, passwordAlgo: "argon2id" } });

  const storeId = randomUUID();
  const catIds = Object.fromEntries(GAMES.map((g) => [g.key, randomUUID()]));
  const methods = ["bank_transfer"];

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
          businessCategory: "شحن ألعاب وتطبيقات",
          paymentMethods: methods,
          settings: {
            create: {
              themeId: "arena",
              themeConfig: THEME_CONFIG,
              fontId: "tajawal",
              navbarVariant: "default",
              storeLanguage: "ar",
              storeCurrency: CURRENCY,
              shippingPrice: 0,
              description:
                "متجر شحن ألعاب وتطبيقات. جواهر فري فاير، شدات ببجي، كوينز إي فوتبول وعملات تيك توك. ده متجر تجريبي من كاشو لعرض ثيم «كاشو أرينا»: الباقات والأسعار حقيقية، بس الطلبات منه مش هتتنفّذ.",
              announcementText: "متجر تجريبي من كاشو — الطلبات مش هتتنفّذ",
              seoTitle: "Casho Store — شحن ألعاب وتطبيقات (متجر تجريبي)",
              seoDescription: "متجر تجريبي من كاشو لعرض ثيم «كاشو أرينا»: شحن فري فاير وببجي وإي فوتبول وتيك توك.",
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
              bankTransferEnabled: true,
              // No transfer details on purpose: a demo must never show an account to send money to.
            },
          },
        },
      });

      await tx.category.createMany({
        data: GAMES.map((g, i) => ({ id: catIds[g.key], storeId, name: g.name, slug: g.key, image: IMAGES[g.key], createdAt: new Date(now - (60 - i) * DAY) })),
      });

      await tx.product.createMany({
        data: PACKAGES.map((p, i) => ({
          id: randomUUID(),
          storeId,
          categoryId: catIds[p.game],
          name: p.name,
          slug: `${SLUG}-${p.slug}`,
          description: null,
          price: p.price,
          compareAtPrice: null,
          image: IMAGES[p.game],
          images: [IMAGES[p.game]],
          stock: 0,
          isDigital: true,
          lowStockThreshold: 0,
          sku: `CS-${String(i + 1).padStart(3, "0")}`,
          tags: [p.game],
          isActive: true,
          isFeatured: p.featured,
          // Not "new": every package dates from the store's opening.
          createdAt: new Date(now - 45 * DAY - i * 60_000),
        })),
      });

      await tx.banner.create({
        data: {
          storeId,
          title: HERO.title,
          subtitle: HERO.subtitle,
          ctaLabel: HERO.cta,
          image: IMAGES.hero,
          position: 0,
          linkType: "PAGE",
          linkValue: "categories",
        },
      });
    },
    { timeout: 60_000 },
  );

  console.log(`Created "${SLUG}": ${GAMES.length} games, ${PACKAGES.length} packages (${CURRENCY}), 1 banner.`);
  console.log(`Owner login: ${OWNER_EMAIL} / ${password}`);
}

try {
  await (process.argv.includes("--remove") ? remove() : create());
} finally {
  await prisma.$disconnect();
  await pool.end();
}

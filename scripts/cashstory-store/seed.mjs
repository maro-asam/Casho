// "Cash Story" (cashstory.casho.store): a real game and app top-up store on
// the Casho Arena theme, priced in Sudanese pounds — the packages and prices
// the merchant sent (catalog.mjs), their game posters and their two designed
// banners (art.mjs → images.json).
//
//   node scripts/cashstory-store/seed.mjs           create the store (refuses if the slug exists)
//   node scripts/cashstory-store/seed.mjs --remove  delete it and its owner account (refuses once it has orders)
//
// Set up like any new merchant: its own owner account (printed password; the
// address is on casho.store with no mailbox, so it starts verified), a 3-day
// trial on Platinum with auto-renew from the balance, then the entry plan.
// Payment: bank transfer — the merchant adds their account details at
// /dashboard/payment-methods. Packages are digital and ask for the player's ID.

import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { BANNERS, CURRENCY, GAMES, PACKAGES, SLUG, STORE_NAME } from "./catalog.mjs";

const OWNER_EMAIL = "cashstory@casho.store";
const DAY = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 3; // FREE_TRIAL_DAYS in lib/subscriptions.ts
const IMAGES = JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "images.json"), "utf8"));

// ─── Theme: Casho Arena with the merchant's banners shown whole ─────────────

const THEME_CONFIG = {
  presetId: "arena",
  // "fullscreen" = Arena's banner slider: designed banners keep their own words.
  layoutOverrides: { heroStyle: "fullscreen" },
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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30_000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function remove() {
  const store = await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true, user: { select: { id: true, email: true } }, _count: { select: { orders: true } } } });
  if (!store) return console.log(`No store at "${SLUG}".`);
  if (store.user.email !== OWNER_EMAIL) throw new Error(`"${SLUG}" belongs to ${store.user.email}, not ${OWNER_EMAIL}. Not touching it.`);
  if (store._count.orders > 0) throw new Error(`"${SLUG}" has ${store._count.orders} orders — it's a live store. Delete it from the admin panel if you really mean to.`);
  const storeId = store.id;
  const byStore = { storeId };
  const byStoreProduct = { product: { storeId } };
  // Same order as deleteStoreTree (lib/admin/deletion.ts): RESTRICT children first.
  await prisma.$transaction(
    async (tx) => {
      await tx.suggestedOrder.deleteMany({ where: byStore });
      await tx.cartItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
      await tx.stockMovement.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
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
  console.log(`Removed "${SLUG}" and ${OWNER_EMAIL}.`);
}

async function create() {
  if (await prisma.store.findUnique({ where: { slug: SLUG }, select: { id: true } })) {
    throw new Error(`A store already lives at "${SLUG}". Run with --remove first.`);
  }
  if (await prisma.user.findUnique({ where: { email: OWNER_EMAIL }, select: { id: true } })) {
    throw new Error(`${OWNER_EMAIL} already has an account.`);
  }
  const taken = await prisma.product.findMany({ where: { slug: { in: PACKAGES.map((p) => `${SLUG}-${p.slug}`) } }, select: { slug: true } });
  if (taken.length) throw new Error(`Product slugs already taken: ${taken.map((t) => t.slug).join(", ")}`);
  for (const key of [...GAMES.map((g) => g.key), ...BANNERS.map((b) => b.key)]) if (!IMAGES[key]) throw new Error(`images.json has no "${key}" — run art.mjs first.`);

  // Like a signup (actions/auth/register.actions.ts): the trial runs on Platinum,
  // and a store that never picks a plan then pays the entry plan.
  const [trialPlan, entryPlan] = await Promise.all([
    prisma.plan.findUnique({ where: { key: "PLATINUM" }, select: { id: true } }),
    prisma.plan.findFirst({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }], select: { monthlyPrice: true } }),
  ]);
  const password = randomBytes(9).toString("base64url");
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const now = new Date();
  const trialEnds = new Date(now.getTime() + TRIAL_DAYS * DAY);

  const storeId = randomUUID();
  const catIds = Object.fromEntries(GAMES.map((g) => [g.key, randomUUID()]));
  const methods = ["bank_transfer"];

  await prisma.$transaction(
    async (tx) => {
      const owner = await tx.user.create({
        data: {
          email: OWNER_EMAIL,
          name: STORE_NAME,
          password: hash,
          passwordAlgo: "argon2id",
          businessType: "شحن ألعاب وتطبيقات",
          country: "السودان",
          referralCode: randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase(),
          // No mailbox behind this address: a code could never arrive.
          emailVerified: true,
          mustVerifyEmail: false,
        },
        select: { id: true },
      });

      await tx.store.create({
        data: {
          id: storeId,
          name: STORE_NAME,
          slug: SLUG,
          userId: owner.id,
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: trialEnds,
          gracePeriodEndsAt: null,
          trialStartDate: now,
          trialEndDate: trialEnds,
          balance: 0,
          autoRenew: true,
          planSelected: false,
          ...(trialPlan && { planId: trialPlan.id }),
          ...(entryPlan && { monthlyPrice: entryPlan.monthlyPrice }),
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
              description: "متجر شحن ألعاب وتطبيقات. جواهر فري فاير، شدات ببجي، كوينز إي فوتبول وعملات تيك توك، بتتشحن على حسابك بالـ ID.",
              seoTitle: "Cash Story — شحن ألعاب وتطبيقات",
              seoDescription: "اشحن فري فاير وببجي وإي فوتبول وتيك توك من Cash Story: اختار الباقة، اكتب معرّف اللاعب، وتابع طلبك.",
              isIndexed: true,
            },
          },
          storePaymentSettings: {
            create: {
              enabledPaymentMethods: methods,
              cashOnDeliveryEnabled: false,
              bankTransferEnabled: true,
            },
          },
        },
      });

      await tx.category.createMany({
        data: GAMES.map((g, i) => ({ id: catIds[g.key], storeId, name: g.name, slug: g.key, image: IMAGES[g.key], createdAt: new Date(now.getTime() - (GAMES.length - i) * 60_000) })),
      });

      await tx.product.createMany({
        data: PACKAGES.map((p, i) => ({
          id: randomUUID(),
          storeId,
          categoryId: catIds[p.game],
          name: p.name,
          slug: `${SLUG}-${p.slug}`,
          price: p.price,
          image: IMAGES[p.game],
          images: [IMAGES[p.game]],
          stock: 0,
          isDigital: true,
          lowStockThreshold: 0,
          sku: `CS-${String(i + 1).padStart(3, "0")}`,
          tags: [p.game],
          isActive: true,
          isFeatured: p.featured,
          // The first in the catalog is the newest, so the "newest" sort lists them as sent.
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000 - i * 60_000),
        })),
      });

      await tx.banner.createMany({
        data: BANNERS.map((b, i) => ({
          storeId,
          title: b.title,
          image: IMAGES[b.key],
          position: i,
          linkType: b.link.type,
          ...(b.link.type === "PAGE" && { linkValue: b.link.value }),
          ...(b.link.type === "CATEGORY" && { linkCategoryId: catIds[b.link.game] }),
        })),
      });
    },
    { timeout: 60_000 },
  );

  console.log(`Created "${SLUG}": ${GAMES.length} games, ${PACKAGES.length} packages (${CURRENCY}), ${BANNERS.length} banners; trial until ${trialEnds.toISOString()}.`);
  console.log(`Owner login: ${OWNER_EMAIL} / ${password}`);
}

try {
  await (process.argv.includes("--remove") ? remove() : create());
} finally {
  await prisma.$disconnect();
  await pool.end();
}

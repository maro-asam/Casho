// One-off (2026-10-16): stores were assigned the PLATINUM plan but kept the old
// flat 299 EGP price, so the plan shown and the price charged disagreed. Now
// that renewal charges the plan's own price, settle every such store:
//   - uses a Platinum-only feature (custom domain / POS) → stays on PLATINUM,
//     pays the Platinum price from its next renewal (notified now)
//   - everyone else → moved to SILVER (≈ the 299 they were paying)
//
// Dry run by default. Apply with:  npx tsx --env-file=.env scripts/migrate-store-prices.ts --apply

import { BillingCycle, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { priceForCycle } from "@/lib/billing/plan-quote";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";

const LEGACY_PRICE = 29900;
const APPLY = process.argv.includes("--apply");
const dateAr = (d: Date) => d.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" });

async function main() {
  const [silver, platinum] = await Promise.all([
    prisma.plan.findUniqueOrThrow({ where: { key: "SILVER" } }),
    prisma.plan.findUniqueOrThrow({ where: { key: "PLATINUM" } }),
  ]);

  const stores = await prisma.store.findMany({
    where: { planId: platinum.id, monthlyPrice: LEGACY_PRICE },
    select: {
      id: true,
      name: true,
      slug: true,
      planSelected: true,
      billingCycle: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      customDomain: true,
      _count: { select: { posShifts: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const keep = stores.filter((s) => s.customDomain || s._count.posShifts > 0);
  const move = stores.filter((s) => !keep.includes(s));

  console.log(`${stores.length} stores on PLATINUM at the legacy ${LEGACY_PRICE / 100} EGP`);
  console.log(`  stay on PLATINUM (Platinum-only features): ${keep.length}`);
  for (const s of keep) {
    console.log(`    - ${s.slug} [${s.subscriptionStatus}] ${s.customDomain ? "domain " : ""}${s._count.posShifts ? "pos" : ""} → ${priceForCycle(platinum, s.billingCycle) / 100} EGP from ${s.subscriptionEndsAt?.toISOString().slice(0, 10) ?? "next renewal"}`);
  }
  console.log(`  move to SILVER: ${move.length} (${move.filter((s) => !s.planSelected).length} never picked a plan)`);

  if (!APPLY) {
    console.log("\nDry run — nothing changed. Re-run with --apply.");
    return;
  }

  for (const s of move) {
    const price = priceForCycle(silver, s.billingCycle);
    await prisma.$transaction([
      prisma.store.update({ where: { id: s.id }, data: { planId: silver.id, planName: silver.key, monthlyPrice: price } }),
      prisma.planAuditLog.create({
        data: {
          storeId: s.id,
          planId: silver.id,
          action: "subscription_price_migration",
          before: { planId: platinum.id, price: LEGACY_PRICE },
          after: { planId: silver.id, billingCycle: s.billingCycle, price },
          note: "توحيد السعر مع الباقة: كان على بلاتينيوم بسعر ٢٩٩ القديم — اتنقل لسيلفر",
        },
      }),
    ]);
    await createStoreNotification({
      storeId: s.id,
      type: NotificationType.PLAN_DOWNGRADED,
      title: "باقتك بقت سيلفر",
      message: `ظبطنا اشتراكك على باقة ${silver.name} بـ ${formatPiastersAsEgp(price)}${s.billingCycle === BillingCycle.YEARLY ? " سنويًا" : " شهريًا"} — قريب جدًا من اللي كنت بتدفعه. لو محتاج مميزات أكتر (دومين خاص، نقطة بيع، CRM…) تقدر ترقّي من صفحة الباقات.`,
      href: "/change-plan",
    });
  }

  for (const s of keep) {
    const price = priceForCycle(platinum, s.billingCycle);
    await prisma.$transaction([
      prisma.store.update({ where: { id: s.id }, data: { monthlyPrice: price } }),
      prisma.planAuditLog.create({
        data: {
          storeId: s.id,
          planId: platinum.id,
          action: "subscription_price_migration",
          before: { planId: platinum.id, price: LEGACY_PRICE },
          after: { planId: platinum.id, billingCycle: s.billingCycle, price },
          note: "توحيد السعر مع الباقة: فضل على بلاتينيوم (بيستخدم دومين خاص / نقطة بيع) — سعر الباقة من التجديد الجاي",
        },
      }),
    ]);
    const when = s.subscriptionEndsAt && s.subscriptionEndsAt > new Date() ? `من التجديد الجاي يوم ${dateAr(s.subscriptionEndsAt)}` : "من التجديد الجاي";
    await createStoreNotification({
      storeId: s.id,
      type: NotificationType.PLAN_UPGRADED,
      title: "تحديث سعر باقة بلاتينيوم",
      message: `إنت على باقة ${platinum.name} اللي فيها الدومين الخاص ونقطة البيع، وسعرها ${formatPiastersAsEgp(price)} بدل ${formatPiastersAsEgp(LEGACY_PRICE)} — هيتطبق ${when}. لو مش محتاج المميزات دي تقدر تنزل لباقة ${silver.name} بـ ${formatPiastersAsEgp(priceForCycle(silver, s.billingCycle))}.`,
      href: "/change-plan",
    });
  }

  console.log(`\nApplied: ${move.length} → SILVER, ${keep.length} stay PLATINUM.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { isInTrial, resolveRenewal } from "@/lib/billing/plan-quote";
import { getEntryPlan } from "@/lib/billing/renewal";
import { hasDemoData } from "@/lib/demo-data/seed";
import { REAL_CATEGORIES, REAL_ORDERS, REAL_PRODUCTS } from "@/lib/demo-data/where";
import { activeCustomDomain } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { buildSetupSteps, hasPaymentSetup, hasShippingSetup, subscriptionSetup, type SetupFacts, type SubscriptionSetup } from "./checklist";

// Loads the facts behind the dashboard's setup checklist. Server-only.

export type StoreSetup = {
  steps: ReturnType<typeof buildSetupSteps>;
  subscription: SubscriptionSetup;
  logo: string | null;
  whatsapp: string | null;
  /** Active shipping methods (for the overview's status row). */
  shippingMethods: number;
};

export async function loadStoreSetup(storeId: string, now = new Date()): Promise<StoreSetup | null> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      onboardingCompleted: true,
      paymentMethods: true,
      balance: true,
      monthlyPrice: true,
      billingCycle: true,
      planId: true,
      planSelected: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      trialEndDate: true,
      plan: { select: { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true } },
      settings: { select: { logo: true, whatsappNumber: true, instagram: true, facebook: true, tiktok: true, shippingPrice: true } },
      storePaymentSettings: {
        select: {
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          vodafoneCashNumber: true,
          instapayEnabled: true,
          instapayAddress: true,
          bankTransferEnabled: true,
          bankTransferDetails: true,
          paymobEnabled: true,
        },
      },
      _count: {
        select: {
          products: { where: { isActive: true, ...REAL_PRODUCTS } },
          categories: { where: REAL_CATEGORIES },
          banners: { where: { isActive: true } },
          shippingMethods: { where: { isActive: true } },
          orders: { where: REAL_ORDERS },
        },
      },
    },
  });
  if (!store) return null;

  // The entry plan only matters for a trial store that never picked one (it renews onto it).
  const [demo, entryPlan] = await Promise.all([
    hasDemoData(storeId),
    !store.planSelected && isInTrial(store, now) ? getEntryPlan() : Promise.resolve(null),
  ]);
  const subscription = subscriptionSetup(store, resolveRenewal(store, store.planSelected ? null : entryPlan).price, now);
  const s = store.settings;

  const facts: SetupFacts = {
    logo: Boolean(s?.logo?.trim()),
    whatsapp: Boolean(s?.whatsappNumber?.trim()),
    products: store._count.products,
    demo,
    payment: hasPaymentSetup(store),
    shipping: hasShippingSetup({
      shippingPrice: s?.shippingPrice ?? 0,
      shippingMethods: store._count.shippingMethods,
      onboardingCompleted: store.onboardingCompleted,
    }),
    subscription,
    categories: store._count.categories,
    banners: store._count.banners,
    social: Boolean(s?.instagram?.trim() || s?.facebook?.trim() || s?.tiktok?.trim()),
    domain: Boolean(activeCustomDomain(store)),
    orders: store._count.orders,
  };

  return {
    steps: buildSetupSteps(facts),
    subscription,
    logo: s?.logo ?? null,
    whatsapp: s?.whatsappNumber ?? null,
    shippingMethods: store._count.shippingMethods,
  };
}

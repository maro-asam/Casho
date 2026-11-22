import { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import { getEntryPlan } from "@/lib/billing/renewal";
import { getDefaultTrialPlanId } from "@/lib/entitlements";
import { generateReferralCode } from "@/lib/referral";
import { getFreeTrialEndDate } from "@/lib/subscriptions";
import { familyEmailMatch, familyMemberEmail, type StoreFamilyEntry } from "./rules";

type Db = Pick<typeof prisma, "user" | "store">;

function familyWhere(inbox: string) {
  const { exact, aliasPrefix, aliasSuffix } = familyEmailMatch(inbox);
  return {
    role: "USER" as const,
    OR: [{ email: exact }, { email: { startsWith: aliasPrefix, endsWith: aliasSuffix } }],
  };
}

/** Every store of the family, the main account's first. */
export async function loadStoreFamily(inbox: string, currentUserId: string): Promise<StoreFamilyEntry[]> {
  const accounts = await prisma.user.findMany({
    where: familyWhere(inbox),
    select: {
      id: true,
      email: true,
      stores: {
        select: { name: true, slug: true, customDomain: true, customDomainStatus: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return accounts.flatMap((account) => {
    const store = account.stores[0];
    if (!store) return [];
    return [{ userId: account.id, email: account.email, storeName: store.name, url: storePublicUrl(store), current: account.id === currentUserId }];
  });
}

export async function countStoreFamily(inbox: string) {
  return prisma.user.count({ where: familyWhere(inbox) });
}

/** Whether this account belongs to the family (used before switching into it). */
export async function findFamilyAccount(inbox: string, userId: string) {
  return prisma.user.findFirst({ where: { id: userId, ...familyWhere(inbox) }, select: { id: true, email: true } });
}

async function availableSlug(db: Db, baseSlug: string) {
  const taken = async (slug: string) => !!(await db.store.findUnique({ where: { slug }, select: { id: true } }));
  if (!(await taken(baseSlug))) return baseSlug;
  for (let i = 0; i < 10; i++) {
    const candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

/**
 * Opens another store for the family: a new "+slug" account with the main
 * account's password, holding a store exactly like a fresh signup's (3-day
 * trial, onboarding not done). No signup analytics, Telegram or sales
 * attribution — it's a sandbox, not a new merchant.
 */
export async function createFamilyStore(inbox: string, storeName: string, baseSlug: string) {
  const main = await prisma.user.findUnique({
    where: { email: inbox },
    select: { password: true, passwordAlgo: true, phone_number: true, name: true, country: true, businessType: true, locale: true },
  });
  if (!main?.password) return null;

  const now = new Date();
  const trialEndsAt = getFreeTrialEndDate(now);
  const trialPlanId = await getDefaultTrialPlanId();
  // Trial runs on Platinum; afterwards a store that never picked a plan pays the entry plan.
  const entryPlan = await getEntryPlan();

  return prisma.$transaction(async (tx) => {
    const slug = await availableSlug(tx, baseSlug);
    let email = familyMemberEmail(inbox, slug);
    // An account can outlive its store (store deleted by an admin) and keep the address.
    if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
      email = familyMemberEmail(inbox, `${slug}-${crypto.randomUUID().slice(0, 4)}`);
    }

    return tx.user.create({
      data: {
        email,
        password: main.password,
        passwordAlgo: main.passwordAlgo,
        phone_number: main.phone_number,
        name: main.name,
        country: main.country,
        businessType: main.businessType,
        locale: main.locale,
        emailVerified: true,
        mustVerifyEmail: false,
        referralCode: generateReferralCode(),
        stores: {
          // Same fields as RegisterAction's store.
          create: {
            name: storeName,
            slug,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            subscriptionEndsAt: trialEndsAt,
            gracePeriodEndsAt: null,
            trialStartDate: now,
            trialEndDate: trialEndsAt,
            onboardingCompleted: false,
            balance: 0,
            autoRenew: true,
            planSelected: false,
            planId: trialPlanId,
            ...(entryPlan && { monthlyPrice: entryPlan.monthlyPrice }),
          },
        },
      },
      select: { id: true, email: true, stores: { select: { id: true, slug: true }, take: 1 } },
    });
  });
}

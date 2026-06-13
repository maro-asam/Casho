import { prisma } from "@/lib/prisma";
import { BalanceTransactionType, SubscriptionStatus } from "@prisma/client";
import { addMonths } from "date-fns";

const REFERRAL_REWARD_PIASTERS = 500; // 5 EGP

export type ReferralLevel = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export const LEVEL_THRESHOLDS: Record<ReferralLevel, number> = {
  BRONZE: 0,
  SILVER: 3,
  GOLD: 10,
  DIAMOND: 25,
};

export function computeReferralLevel(payments: number): ReferralLevel {
  if (payments >= 25) return "DIAMOND";
  if (payments >= 10) return "GOLD";
  if (payments >= 3) return "SILVER";
  return "BRONZE";
}

export function getNextLevelThreshold(level: ReferralLevel): number | null {
  const order: ReferralLevel[] = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];
  const idx = order.indexOf(level);
  const next = order[idx + 1];
  if (!next) return null;
  return LEVEL_THRESHOLDS[next];
}

export function generateReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

/**
 * Grants a 5 EGP referral reward to the referrer when a referred user's store
 * makes its first subscription payment. Safe to call multiple times — the unique
 * constraint on ReferralTransaction.referredUserId prevents double rewards.
 */
export async function grantReferralRewardIfEligible(storeId: string): Promise<void> {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            referredById: true,
          },
        },
      },
    });

    if (!store || !store.user.referredById) return;

    const referredUserId = store.userId;
    const referrerId = store.user.referredById;

    if (referrerId === referredUserId) return;

    const referrerStore = await prisma.store.findFirst({
      where: { userId: referrerId },
      select: { id: true, balance: true },
    });

    if (!referrerStore) return;

    await prisma.$transaction(async (tx) => {
      // referredUserId is UNIQUE — this throws P2002 if already rewarded
      await tx.referralTransaction.create({
        data: {
          referrerId,
          referredUserId,
          amount: REFERRAL_REWARD_PIASTERS,
          storeId,
        },
      });

      const balanceBefore = referrerStore.balance;
      const balanceAfter = balanceBefore + REFERRAL_REWARD_PIASTERS;

      await tx.store.update({
        where: { id: referrerStore.id },
        data: { balance: balanceAfter },
      });

      await tx.balanceTransaction.create({
        data: {
          storeId: referrerStore.id,
          type: BalanceTransactionType.REFERRAL_REWARD,
          amount: REFERRAL_REWARD_PIASTERS,
          balanceBefore,
          balanceAfter,
          note: "مكافأة إحالة — تاجر جديد دفع اشتراكه",
        },
      });

      await tx.user.update({
        where: { id: referrerId },
        data: { referralCredits: { increment: REFERRAL_REWARD_PIASTERS } },
      });
    });
  } catch (error: unknown) {
    // P2002 = unique constraint violation → already rewarded, ignore silently
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return;
    }
    console.error("[Referral] grantReferralRewardIfEligible error:", error);
  }
}

/**
 * Tracks each successful subscription payment from a referred user.
 * Increments the referrer's paid referral count, updates their level,
 * and awards a free month every 3 paid referrals.
 * Safe to call alongside grantReferralRewardIfEligible — handles all payments, not just the first.
 */
export async function trackPaidReferralLevel(storeId: string): Promise<void> {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        userId: true,
        user: { select: { id: true, referredById: true } },
      },
    });

    if (!store || !store.user.referredById) return;

    const referredUserId = store.userId;
    const referrerId = store.user.referredById;

    if (referrerId === referredUserId) return;

    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      select: {
        id: true,
        referralSuccessfulPayments: true,
        referralLevel: true,
      },
    });

    if (!referrer) return;

    const newCount = referrer.referralSuccessfulPayments + 1;
    const newLevel = computeReferralLevel(newCount);
    const levelChanged = newLevel !== referrer.referralLevel;
    const earnsFreeMonth = newCount % 3 === 0;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: referrerId },
        data: {
          referralSuccessfulPayments: newCount,
          referralLevel: newLevel,
          ...(earnsFreeMonth ? { freeMonthsEarned: { increment: 1 } } : {}),
        },
      });

      if (levelChanged) {
        await tx.referralRewardLog.create({
          data: {
            referrerId,
            type: "LEVEL_UP",
            metadata: {
              fromLevel: referrer.referralLevel,
              toLevel: newLevel,
              paymentsCount: newCount,
            },
          },
        });
      }

      if (earnsFreeMonth) {
        // Extend the referrer's first store subscription by +1 month
        const referrerStore = await tx.store.findFirst({
          where: { userId: referrerId },
          select: {
            id: true,
            subscriptionStatus: true,
            subscriptionEndsAt: true,
          },
        });

        if (referrerStore) {
          const now = new Date();
          const base =
            referrerStore.subscriptionEndsAt &&
            referrerStore.subscriptionEndsAt.getTime() > now.getTime()
              ? referrerStore.subscriptionEndsAt
              : now;

          await tx.store.update({
            where: { id: referrerStore.id },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionEndsAt: addMonths(base, 1),
              gracePeriodEndsAt: null,
            },
          });
        }

        await tx.referralRewardLog.create({
          data: {
            referrerId,
            type: "FREE_MONTH",
            metadata: {
              paymentsCount: newCount,
              referredUserId,
              storeId,
            },
          },
        });
      }
    });
  } catch (error) {
    console.error("[Referral] trackPaidReferralLevel error:", error);
  }
}

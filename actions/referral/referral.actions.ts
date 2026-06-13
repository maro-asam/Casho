"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  computeReferralLevel,
  getNextLevelThreshold,
  LEVEL_THRESHOLDS,
  type ReferralLevel,
} from "@/lib/referral";

export type ReferralStats = {
  referralCode: string;
  totalEarnedPiasters: number;
  successfulReferrals: number;
  referrals: {
    id: string;
    createdAt: Date;
    amount: number;
  }[];
  // Tiered system
  referralSuccessfulPayments: number;
  freeMonthsEarned: number;
  referralLevel: ReferralLevel;
  nextLevelThreshold: number | null;
  currentLevelThreshold: number;
  freeMonthProgress: number; // 0–2 (payments since last free month)
};

export async function GetReferralStatsAction(): Promise<ReferralStats> {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralCredits: true,
      referralSuccessfulPayments: true,
      freeMonthsEarned: true,
      referralLevel: true,
      referralTransactionsSent: {
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate a referral code if user doesn't have one (migration path)
  let code = user.referralCode;
  if (!code) {
    const { generateReferralCode } = await import("@/lib/referral");
    code = generateReferralCode();
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
  }

  const payments = user.referralSuccessfulPayments;
  const level = computeReferralLevel(payments) as ReferralLevel;

  return {
    referralCode: code,
    totalEarnedPiasters: user.referralCredits,
    successfulReferrals: user.referralTransactionsSent.length,
    referrals: user.referralTransactionsSent,
    referralSuccessfulPayments: payments,
    freeMonthsEarned: user.freeMonthsEarned,
    referralLevel: level,
    nextLevelThreshold: getNextLevelThreshold(level),
    currentLevelThreshold: LEVEL_THRESHOLDS[level],
    freeMonthProgress: payments % 3,
  };
}

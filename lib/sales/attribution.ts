import { Prisma, SalesAttributionSource, SalesRepStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "./rules";

export const SIGNUP_REF_COOKIE = "signupRef";

export type SignupReferral = {
  code: string;
  /** Goes to User.referredById (the existing merchant referral program uses it too). */
  referrerUserId: string;
  /** Set only for an ACTIVE sales rep — creates a SalesAttribution. */
  salesRepId: string | null;
};

/**
 * Validates a ?ref= code server-side. Unknown codes are ignored. A disabled
 * rep's link no longer attributes anyone (returns null, no referrer at all).
 */
export async function resolveSignupReferral(raw: string | null | undefined): Promise<SignupReferral | null> {
  const code = normalizeReferralCode(raw);
  if (!code) return null;

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, role: true, salesRep: { select: { id: true, status: true } } },
  });
  if (!referrer) return null;

  if (referrer.role === UserRole.SALES) {
    if (!referrer.salesRep || referrer.salesRep.status !== SalesRepStatus.ACTIVE) return null;
    return { code, referrerUserId: referrer.id, salesRepId: referrer.salesRep.id };
  }
  return { code, referrerUserId: referrer.id, salesRepId: null };
}

/** Call inside the signup transaction, right after the user is created. */
export async function createSignupAttribution(
  tx: Prisma.TransactionClient,
  input: { customerUserId: string; referral: SignupReferral | null; signedUpAt: Date },
) {
  const { referral } = input;
  if (!referral?.salesRepId) return;
  await tx.salesAttribution.create({
    data: {
      customerUserId: input.customerUserId,
      salesRepId: referral.salesRepId,
      originalSalesRepId: referral.salesRepId,
      source: SalesAttributionSource.SIGNUP_LINK,
      referralCode: referral.code,
      signedUpAt: input.signedUpAt,
    },
  });
}

function appUrl() {
  return (process.env.APP_URL || `https://app.${process.env.ROOT_DOMAIN || "casho.store"}`).replace(/\/$/, "");
}

/** For merchants the rep brings in — opens the store signup form. */
export function buildReferralLink(code: string): string {
  return `${appUrl()}/register?ref=${encodeURIComponent(code)}`;
}

/** For the rep themself — signs in and lands on /sales. */
export function buildSalesLoginLink(): string {
  return `${appUrl()}/login`;
}

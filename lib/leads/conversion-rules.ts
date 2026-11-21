/**
 * Matching a paying merchant to a lead (pure, unit-tested). The DB side is
 * lib/leads/conversion.ts.
 *
 * When does a lead convert? When the merchant's store pays its first
 * subscription — the first SUBSCRIPTION_CHARGE ledger row, the same moment
 * the sales engine counts an acquisition. Signing up, or a trial, is not a
 * conversion.
 *
 * Which lead? One that is live (not deleted, not converted, not already linked)
 * and matches the account by
 *   - its email, when the account's email is verified (code or Google), or
 *   - its normalized phone = the account's signup phone.
 * It links automatically only when that is unambiguous:
 *   - exactly one candidate lead, and
 *   - a phone-only match isn't contradicted by a different email on the lead, and
 *   - the phone isn't shared by another Casho account (phones can repeat — lib/auth/multi-account).
 * Anything else becomes a match for a super admin to link or dismiss. A lead
 * an admin already linked to the account always wins.
 */

export type MatchAccount = {
  userId: string;
  email: string;
  emailVerified: boolean;
  /** Already normalized (signup stores 01xxxxxxxxx). */
  phone: string | null;
  /** Other Casho accounts with the same phone. */
  phoneSharedWithOthers: boolean;
};

export type MatchCandidate = {
  leadId: string;
  normalizedPhone: string;
  normalizedWhatsapp: string | null;
  email: string | null;
};

export type MatchedBy = "PHONE" | "EMAIL" | "PHONE_EMAIL";

export type MatchDecision =
  | { kind: "none" }
  | { kind: "auto"; leadId: string; matchedBy: MatchedBy }
  | { kind: "review"; matches: { leadId: string; matchedBy: MatchedBy; reason: MatchReason }[] };

export const MATCH_REASONS = {
  MULTIPLE_LEADS: "أكتر من ليد بيطابق الحساب ده",
  EMAIL_MISMATCH: "الرقم مطابق بس إيميل الليد غير إيميل الحساب",
  SHARED_PHONE: "الرقم ده على أكتر من حساب في كاشو",
} as const;
export type MatchReason = keyof typeof MATCH_REASONS;

export function matchedByOf(account: MatchAccount, lead: MatchCandidate): MatchedBy | null {
  const phone = !!account.phone && (lead.normalizedPhone === account.phone || lead.normalizedWhatsapp === account.phone);
  const email = account.emailVerified && !!lead.email && lead.email === account.email.toLowerCase();
  if (phone && email) return "PHONE_EMAIL";
  if (email) return "EMAIL";
  if (phone) return "PHONE";
  return null;
}

export function decideMatch(account: MatchAccount, candidates: MatchCandidate[]): MatchDecision {
  const matches = candidates
    .map((lead) => ({ lead, matchedBy: matchedByOf(account, lead) }))
    .filter((m): m is { lead: MatchCandidate; matchedBy: MatchedBy } => m.matchedBy !== null);

  if (matches.length === 0) return { kind: "none" };

  if (matches.length > 1) {
    return { kind: "review", matches: matches.map((m) => ({ leadId: m.lead.leadId, matchedBy: m.matchedBy, reason: "MULTIPLE_LEADS" })) };
  }

  const [{ lead, matchedBy }] = matches;
  if (matchedBy === "PHONE") {
    if (lead.email && lead.email !== account.email.toLowerCase()) {
      return { kind: "review", matches: [{ leadId: lead.leadId, matchedBy, reason: "EMAIL_MISMATCH" }] };
    }
    if (account.phoneSharedWithOthers) {
      return { kind: "review", matches: [{ leadId: lead.leadId, matchedBy, reason: "SHARED_PHONE" }] };
    }
  }
  return { kind: "auto", leadId: lead.leadId, matchedBy };
}

export const linkSourceFor = (matchedBy: MatchedBy) => (matchedBy === "PHONE" ? ("AUTO_PHONE" as const) : ("AUTO_EMAIL" as const));

import { inboxOf } from "@/lib/auth/multi-account";

// Casho test accounts that may open more than one store (sales sandboxes).
//
// The dashboard is built around one store per account — every page and action
// finds "the" store by userId — so each extra store lives on its own linked
// account: the inbox's "+slug" alias (berry+cairo-shop@casho.store), same
// password. The account menu lists the whole family, "متجر جديد" opens another
// one, and switching signs the browser into that account.
export const STORE_FAMILY_INBOXES = ["berry@casho.store"];

/** One store of the family, as the account menu lists it. */
export type StoreFamilyEntry = {
  userId: string;
  email: string;
  storeName: string;
  url: string;
  current: boolean;
};

/** A runaway cap, not a plan limit. */
export const MAX_FAMILY_STORES = 50;

/** The allow-listed inbox this account belongs to (itself or a "+tag" alias of it), or null. */
export function storeFamilyOf(email: string | null | undefined): string | null {
  if (!email) return null;
  const inbox = inboxOf(email);
  return STORE_FAMILY_INBOXES.includes(inbox) ? inbox : null;
}

/** "berry@casho.store" + "cairo-shop" → "berry+cairo-shop@casho.store". */
export function familyMemberEmail(inbox: string, tag: string) {
  const [local, domain] = inbox.split("@");
  return `${local}+${tag}@${domain}`;
}

/** The parts a DB lookup needs to find every account of the family. */
export function familyEmailMatch(inbox: string) {
  const [local, domain] = inbox.split("@");
  return { exact: inbox, aliasPrefix: `${local}+`, aliasSuffix: `@${domain}` };
}

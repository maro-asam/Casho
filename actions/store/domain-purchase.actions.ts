"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { assertCanUse, entitlementErrorMessage, FEATURE_KEYS, isEntitlementError } from "@/lib/entitlements";
import { candidateDomains, isEgyptianTld, parseDomainQuery, toOffer, type DomainOffer } from "@/lib/domains/pricing";
import { attachRegisteredDomain, purchaseDomain, setRegistrationAutoRenew, settlePurchase, type PurchaseResult } from "@/lib/domains/purchase";
import { searchDomains } from "@/lib/domains/registrar";
import { domainSalesOpen, getDomainSettings } from "@/lib/domains/settings";

// Buying a domain through Casho (lib/domains): search with prices in EGP, buy
// from the balance, follow the order, and manage what the store owns.

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

async function ownStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true } });
}

/** Entitlement check → an error message, or null when the plan allows custom domains. */
async function planBlocks(storeId: string) {
  try {
    await assertCanUse(storeId, FEATURE_KEYS.CUSTOM_DOMAIN);
    return null;
  } catch (error) {
    if (isEntitlementError(error)) return entitlementErrorMessage(error);
    throw error;
  }
}

export type DomainSearchResult =
  | {
      ok: true;
      /** The name searched (without TLD), as cleaned up from the input. */
      label: string;
      offers: DomainOffer[];
      /** They typed a .eg name — those can't be bought here. */
      egyptian: boolean;
    }
  | { ok: false; message: string };

export async function searchDomainsAction(input: string): Promise<DomainSearchResult> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  const settings = await getDomainSettings();
  if (!domainSalesOpen(settings)) return { ok: false, message: "شراء الدومينات من كاشو مش متاح دلوقتي." };

  const query = parseDomainQuery(input);
  if (!query) return { ok: false, message: "اكتب الاسم بالإنجليزي — حروف وأرقام وشَرطة (-) بس." };
  const egyptian = isEgyptianTld(query.tld);
  const hits = await searchDomains(candidateDomains(egyptian ? { ...query, tld: null } : query));
  if (!hits) return { ok: false, message: "مقدرناش نوصل لشركة الدومينات دلوقتي. جرّب كمان شوية." };

  // The exact name typed first, then what's for sale; otherwise the TLD order.
  const exact = query.tld && !egyptian ? `${query.label}.${query.tld}` : null;
  const rank = (o: DomainOffer) => (o.domain === exact ? 0 : o.available ? 1 : 2);
  const offers = hits.map((hit) => toOffer(hit, settings)).sort((a, b) => rank(a) - rank(b));
  return { ok: true, label: query.label, offers, egyptian };
}

export async function buyDomainAction(domain: string, expectedPrice: number): Promise<PurchaseResult> {
  const store = await ownStore();
  if (!store) return { ok: false, reason: "failed", message: "المتجر مش موجود." };
  const blocked = await planBlocks(store.id);
  if (blocked) return { ok: false, reason: "closed", message: blocked };

  const name = String(domain ?? "").trim().toLowerCase();
  if (!DOMAIN_REGEX.test(name) || !Number.isInteger(expectedPrice) || expectedPrice <= 0) {
    return { ok: false, reason: "failed", message: "الطلب مش صحيح. دوّر على الدومين تاني." };
  }
  const result = await purchaseDomain({ storeId: store.id, domain: name, expectedPrice });
  revalidatePath("/dashboard", "layout");
  return result;
}

/** Where a running purchase stands (the page polls this while it's PENDING). */
export async function checkDomainPurchaseAction(id: string): Promise<{ status: "PENDING" | "ACTIVE" | "FAILED" }> {
  const store = await ownStore();
  if (!store) return { status: "FAILED" };
  const reg = await prisma.domainRegistration.findFirst({ where: { id: String(id), storeId: store.id }, select: { id: true } });
  if (!reg) return { status: "FAILED" };
  return { status: await settlePurchase(reg.id) };
}

export async function setDomainAutoRenewAction(id: string, autoRenew: boolean): Promise<{ ok: boolean; message: string }> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  const ok = await setRegistrationAutoRenew(store.id, String(id), Boolean(autoRenew));
  if (!ok) return { ok: false, message: "مقدرناش نغيّر التجديد دلوقتي." };
  revalidatePath("/dashboard/domain");
  return {
    ok: true,
    message: autoRenew ? "التجديد التلقائي اشتغل — هيتخصم من رصيدك قبل ما الدومين يخلص." : "التجديد التلقائي اتقفل — الدومين هيخلص في ميعاده.",
  };
}

/** Points a domain the store bought through Casho at the store (replacing the current one). */
export async function connectRegisteredDomainAction(id: string): Promise<{ ok: boolean; message: string }> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  const reg = await prisma.domainRegistration.findFirst({ where: { id: String(id), storeId: store.id, status: "ACTIVE" }, select: { domain: true } });
  if (!reg) return { ok: false, message: "الدومين ده مش متسجّل لمتجرك." };
  const blocked = await planBlocks(store.id);
  if (blocked) return { ok: false, message: blocked };

  const ok = await attachRegisteredDomain(store.id, reg.domain, { replace: true });
  revalidatePath("/dashboard", "layout");
  return ok ? { ok: true, message: "بنربط الدومين بمتجرك — بياخد من دقايق لساعة." } : { ok: false, message: "مقدرناش نربط الدومين دلوقتي." };
}

"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { assertCanUse, FEATURE_KEYS, isEntitlementError, entitlementErrorMessage } from "@/lib/entitlements";
import { addProjectDomain, removeProjectDomain, vercelConfigured } from "@/lib/custom-domain/vercel";
import { runDomainCheck, type DomainCheckReport } from "@/lib/custom-domain/verify";
import { checkDomainOwnership, domainVerificationToken } from "@/lib/custom-domain/ownership";
import { verificationRecord } from "@/lib/custom-domain/shared";
import { createNotification } from "@/lib/notifications/in-app";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "casho.store";
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const BLOCKED_SUFFIXES = [ROOT_DOMAIN, "vercel.app", "localhost", "netlify.app", "github.io"];

export type DomainActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; message: string };

/** "https://www.Shop.com/path" → "www.shop.com" — or an error message. */
function normalizeDomain(input: string): { domain: string } | { error: string } {
  let value = String(input ?? "").trim().toLowerCase();
  value = value.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/\.$/, "").replace(/:\d+$/, "");
  if (value.length < 4) return { error: "اكتب الدومين كامل — مثال: mystore.com" };
  if (value.length > 253 || !DOMAIN_REGEX.test(value)) return { error: "صيغة الدومين مش صحيحة — مثال: mystore.com أو shop.mystore.com" };
  if (BLOCKED_SUFFIXES.some((s) => value === s || value.endsWith(`.${s}`))) return { error: "الدومين ده مينفعش يتربط." };
  return { domain: value };
}

async function ownStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
  });
}

/** Every page that shows or copies the store's address. */
function revalidateStoreLinks() {
  revalidatePath("/dashboard", "layout");
}

export async function checkDomainAvailabilityAction(
  input: string,
): Promise<{ status: "valid"; domain: string } | { status: "invalid"; reason: string } | { status: "taken" }> {
  const store = await ownStore();
  const parsed = normalizeDomain(input);
  if ("error" in parsed) return { status: "invalid", reason: parsed.error };
  const existing = await prisma.store.findFirst({
    where: { customDomain: parsed.domain, ...(store && { id: { not: store.id } }) },
    select: { id: true },
  });
  return existing ? { status: "taken" } : { status: "valid", domain: parsed.domain };
}

export async function connectCustomDomainAction(input: string): Promise<DomainActionResult<DomainCheckReport>> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  const parsed = normalizeDomain(input);
  if ("error" in parsed) return { ok: false, message: parsed.error };
  const domain = parsed.domain;

  try {
    await assertCanUse(store.id, FEATURE_KEYS.CUSTOM_DOMAIN);
  } catch (error) {
    if (isEntitlementError(error)) return { ok: false, message: entitlementErrorMessage(error) };
    throw error;
  }

  // A claim only becomes exclusive once proven. A live domain stays with its
  // store; a pending one (could be a squatter) goes to whoever proves
  // ownership with their TXT record.
  const conflict = await prisma.store.findFirst({
    where: { customDomain: domain, id: { not: store.id } },
    select: { id: true, slug: true, customDomainStatus: true },
  });
  if (conflict) {
    if (conflict.customDomainStatus === "ACTIVE") return { ok: false, message: "الدومين ده مربوط بمتجر تاني على كاشو." };
    if (!(await checkDomainOwnership(domain, store.id))) {
      const txt = verificationRecord(domain, domainVerificationToken(store.id));
      return {
        ok: false,
        message: `الدومين ده محجوز من متجر تاني لسه ماثبتش ملكيته. لو الدومين بتاعك، ضيف سجل TXT في إعدادات الدومين — Host: ${txt.host} — Value: ${txt.value} — وبعد ما ينتشر اضغط ربط تاني.`,
      };
    }
    await prisma.store.update({
      where: { id: conflict.id },
      data: { customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
    });
    revalidateStorefront(conflict.slug);
    await createNotification({
      storeId: conflict.id,
      type: "SYSTEM",
      title: "الدومين اتفصل عن متجرك",
      message: `متجر تاني أثبت ملكية ${domain} فاتنقل له. لو الدومين بتاعك، كلّم الدعم.`,
      href: "/domain",
    });
  }

  if (vercelConfigured) {
    if (store.customDomain && store.customDomain !== domain) await removeProjectDomain(store.customDomain);
    const added = await addProjectDomain(domain);
    if (!added.ok) return { ok: false, message: added.message };
  }

  try {
    await prisma.store.update({
      where: { id: store.id },
      // A new domain starts PENDING: the Casho address stays on until the merchant turns it off for this one.
      data: { customDomain: domain, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
    });
  } catch {
    return { ok: false, message: "الدومين ده مربوط بمتجر تاني على كاشو." };
  }

  // Maybe DNS is already set (e.g. reconnecting) — check right away.
  const report = await runDomainCheck({ id: store.id, slug: store.slug, customDomain: domain, customDomainStatus: "PENDING" });
  revalidateStoreLinks();
  return { ok: true, data: report };
}

export async function verifyCustomDomainAction(): Promise<DomainActionResult<DomainCheckReport>> {
  const store = await ownStore();
  if (!store?.customDomain) return { ok: false, message: "مفيش دومين مربوط." };
  const report = await runDomainCheck({ ...store, customDomain: store.customDomain });
  // Going ACTIVE (or failing) flips every link in the dashboard between the two addresses.
  if (report.status !== store.customDomainStatus) revalidateStoreLinks();
  return { ok: true, data: report };
}

export async function disconnectCustomDomainAction(): Promise<DomainActionResult> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  if (store.customDomain && vercelConfigured) await removeProjectDomain(store.customDomain);
  await prisma.store.update({
    where: { id: store.id },
    data: { customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
  });

  revalidateStoreLinks();
  revalidateStorefront(store.slug);
  return { ok: true, message: "اتفصل الدومين. متجرك لسه شغّال على رابط كاشو." };
}

/**
 * Keep slug.casho.store serving the store, or redirect it to the custom domain.
 * Turning it off needs a live (ACTIVE) domain; the proxy also re-checks that on
 * every lookup, so a domain that breaks later brings the subdomain back.
 */
export async function setSubdomainEnabledAction(enabled: boolean): Promise<DomainActionResult> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };
  if (!enabled && !(store.customDomain && store.customDomainStatus === "ACTIVE")) {
    return { ok: false, message: "لازم الدومين الجديد يبقى شغّال الأول قبل ما تقفل رابط كاشو." };
  }

  await prisma.store.update({ where: { id: store.id }, data: { subdomainEnabled: Boolean(enabled) } });
  revalidateStoreLinks();
  return {
    ok: true,
    message: enabled
      ? "رابط كاشو القديم رجع يفتح متجرك."
      : "رابط كاشو القديم بقى بيحوّل لدومينك الجديد — التغيير بياخد دقيقة أو اتنين.",
  };
}

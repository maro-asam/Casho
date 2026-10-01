"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { assertCanUse, FEATURE_KEYS, isEntitlementError, entitlementErrorMessage } from "@/lib/entitlements";
import { addProjectDomain, removeProjectDomain, vercelConfigured } from "@/lib/custom-domain/vercel";
import { runDomainCheck, type DomainCheckReport } from "@/lib/custom-domain/verify";

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
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true },
  });
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

  const conflict = await prisma.store.findFirst({ where: { customDomain: domain, id: { not: store.id } }, select: { id: true } });
  if (conflict) return { ok: false, message: "الدومين ده مربوط بمتجر تاني على كاشو." };

  if (vercelConfigured) {
    if (store.customDomain && store.customDomain !== domain) await removeProjectDomain(store.customDomain);
    const added = await addProjectDomain(domain);
    if (!added.ok) return { ok: false, message: added.message };
  }

  try {
    await prisma.store.update({
      where: { id: store.id },
      data: { customDomain: domain, customDomainStatus: "PENDING", customDomainConnectedAt: null },
    });
  } catch {
    return { ok: false, message: "الدومين ده مربوط بمتجر تاني على كاشو." };
  }

  // Maybe DNS is already set (e.g. reconnecting) — check right away.
  const report = await runDomainCheck({ id: store.id, slug: store.slug, customDomain: domain, customDomainStatus: "PENDING" });
  revalidatePath("/dashboard/domain");
  return { ok: true, data: report };
}

export async function verifyCustomDomainAction(): Promise<DomainActionResult<DomainCheckReport>> {
  const store = await ownStore();
  if (!store?.customDomain) return { ok: false, message: "مفيش دومين مربوط." };
  const report = await runDomainCheck({ ...store, customDomain: store.customDomain });
  return { ok: true, data: report };
}

export async function disconnectCustomDomainAction(): Promise<DomainActionResult> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  if (store.customDomain && vercelConfigured) await removeProjectDomain(store.customDomain);
  await prisma.store.update({
    where: { id: store.id },
    data: { customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null },
  });

  revalidatePath("/dashboard/domain");
  revalidatePath(`/store/${store.slug}`, "layout");
  return { ok: true, message: "اتفصل الدومين. متجرك لسه شغّال على رابط كاشو." };
}

"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import {
  POLICY_MAX_LENGTH,
  isPolicyType,
  readStoredPolicies,
  type PolicyType,
  type StoredPolicies,
  type StoredPolicy,
} from "@/lib/store-policies";

type Result = { ok: boolean; message: string; updatedAt?: string | null };

async function ownStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

/** Read-modify-write of one entry in `StoreSettings.policies`. */
async function updatePolicy(storeId: string, type: PolicyType, change: (entry: StoredPolicy) => StoredPolicy) {
  const settings = await prisma.storeSettings.findUnique({ where: { storeId }, select: { policies: true } });
  const stored: StoredPolicies = readStoredPolicies(settings?.policies);
  const next = change(stored[type] ?? {});
  const policies = { ...stored, [type]: next } as Prisma.InputJsonObject;
  await prisma.storeSettings.upsert({
    where: { storeId },
    create: { storeId, policies },
    update: { policies },
  });
  return next;
}

/** Back to the template: no body, and no "last updated" date. */
function toTemplate(entry: StoredPolicy): StoredPolicy {
  return entry.hidden === undefined ? {} : { hidden: entry.hidden };
}

function done(slug: string) {
  revalidateStorefront(slug);
  revalidatePath("/dashboard/policies");
}

/** Saves the merchant's own text. An empty text goes back to the ready-made template. */
export async function SaveStorePolicyAction(type: PolicyType, body: string): Promise<Result> {
  if (!isPolicyType(type) || typeof body !== "string") return { ok: false, message: "البيانات غير صحيحة" };
  const text = body.replace(/\r\n?/g, "\n").trim();
  if (text.length > POLICY_MAX_LENGTH) return { ok: false, message: "النص طويل جدًا" };

  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  const entry = await updatePolicy(store.id, type, (e) =>
    text ? { ...e, body: text, updatedAt: new Date().toISOString() } : toTemplate(e),
  );
  done(store.slug);
  return { ok: true, message: text ? "تم حفظ السياسة" : "رجعت للنص الجاهز", updatedAt: entry.updatedAt ?? null };
}

/** Drops the merchant's text so the page shows the ready-made template again. */
export async function ResetStorePolicyAction(type: PolicyType): Promise<Result> {
  if (!isPolicyType(type)) return { ok: false, message: "البيانات غير صحيحة" };
  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  await updatePolicy(store.id, type, toTemplate);
  done(store.slug);
  return { ok: true, message: "رجعت للنص الجاهز", updatedAt: null };
}

/** Shows or hides one policy page (and its footer link) on the storefront. */
export async function SetStorePolicyVisibilityAction(type: PolicyType, visible: boolean): Promise<Result> {
  if (!isPolicyType(type) || typeof visible !== "boolean") return { ok: false, message: "البيانات غير صحيحة" };
  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  await updatePolicy(store.id, type, (e) => ({ ...e, hidden: !visible }));
  done(store.slug);
  return { ok: true, message: visible ? "الصفحة ظاهرة في متجرك" : "الصفحة مخفية من متجرك" };
}

/** Checkout asks the shopper to tick "I agree to the terms and return policy". */
export async function SetRequireTermsAtCheckoutAction(enabled: boolean): Promise<Result> {
  if (typeof enabled !== "boolean") return { ok: false, message: "البيانات غير صحيحة" };
  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    create: { storeId: store.id, requireTermsAtCheckout: enabled },
    update: { requireTermsAtCheckout: enabled },
  });
  done(store.slug);
  return { ok: true, message: "تم حفظ الإعدادات" };
}

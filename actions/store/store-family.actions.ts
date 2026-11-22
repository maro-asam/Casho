"use server";

import { z } from "zod";

import { requireAuth } from "@/actions/auth/require.actions";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { replaceCurrentSession } from "@/lib/auth/session";
import { normalizeStoreSlug } from "@/lib/store/slug";
import { MAX_FAMILY_STORES, storeFamilyOf } from "@/lib/store-family/rules";
import { countStoreFamily, createFamilyStore, findFamilyAccount } from "@/lib/store-family/server";

type Result = { success: true } | { error: string };

const storeNameSchema = z.string().trim().min(2, "اسم المتجر قصير جدًا").max(60, "اسم المتجر طويل جدًا");

/** "متجر جديد" for an allow-listed account: opens the store and signs into it. */
export async function CreateFamilyStoreAction(storeName: string): Promise<Result> {
  const user = await requireAuth();
  const inbox = storeFamilyOf(user.email);
  if (!inbox) return { error: "غير مصرح" };

  const parsed = storeNameSchema.safeParse(storeName);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "اسم المتجر غير صالح" };
  const baseSlug = normalizeStoreSlug(parsed.data);
  if (!baseSlug) return { error: "اكتب اسم متجر صالح" };

  if ((await countStoreFamily(inbox)) >= MAX_FAMILY_STORES) {
    return { error: "وصلت للحد الأقصى لعدد المتاجر" };
  }

  try {
    const created = await createFamilyStore(inbox, parsed.data, baseSlug);
    if (!created) return { error: "الحساب الأساسي مش موجود" };

    await replaceCurrentSession(created.id);
    logSecurityEvent({
      event: "STORE_FAMILY_STORE_CREATED",
      userId: created.id,
      metadata: { from: user.id, email: created.email, slug: created.stores[0]?.slug ?? null },
    });
    return { success: true };
  } catch (error) {
    console.error("CreateFamilyStoreAction error:", error);
    return { error: "حصلت مشكلة في إنشاء المتجر، جرّب تاني" };
  }
}

/** Switch to another store of the same family (signs into its account). */
export async function SwitchFamilyStoreAction(targetUserId: string): Promise<Result> {
  const user = await requireAuth();
  const inbox = storeFamilyOf(user.email);
  if (!inbox) return { error: "غير مصرح" };
  if (targetUserId === user.id) return { success: true };

  const target = await findFamilyAccount(inbox, targetUserId);
  if (!target) return { error: "المتجر ده مش من متاجرك" };

  await replaceCurrentSession(target.id);
  logSecurityEvent({ event: "STORE_FAMILY_SWITCHED", userId: target.id, metadata: { from: user.id, to: target.email } });
  return { success: true };
}

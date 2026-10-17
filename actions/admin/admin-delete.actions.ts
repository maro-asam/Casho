"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { deleteStoreTree, deleteUserTree, getStoreDeletionBlockers, getUserDeletionCheck } from "@/lib/admin/deletion";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { removeProjectDomain, vercelConfigured } from "@/lib/custom-domain/vercel";

type ActionResult = { success: boolean; message: string };

// Deleting hundreds of rows over a remote connection can exceed Prisma's 5s default.
const TX_OPTIONS = { timeout: 60_000, maxWait: 10_000 };

/** Best effort: the store is already gone, a stale Vercel domain must not fail the action. */
async function detachDomains(domains: (string | null)[]) {
  if (!vercelConfigured) return;
  await Promise.all(
    domains.filter((d): d is string => !!d).map((d) => removeProjectDomain(d).catch((e) => console.error("[admin-delete] domain", d, e))),
  );
}

/** Permanently deletes a store with no money history. `confirmSlug` must match. */
export async function adminDeleteStoreAction(storeId: string, confirmSlug: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true, slug: true, customDomain: true, userId: true },
  });
  if (!store) return { success: false, message: "المتجر مش موجود" };
  if (confirmSlug.trim() !== store.slug) return { success: false, message: "رابط المتجر اللي كتبته مش مطابق" };

  try {
    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: a top-up could have landed since the page loaded.
      const blockers = await getStoreDeletionBlockers(store.id, tx);
      if (blockers.length) throw new BlockedError(blockers);
      await deleteStoreTree(tx, store.id);
    }, TX_OPTIONS);
  } catch (error) {
    if (error instanceof BlockedError) return { success: false, message: `مينفعش يتحذف: ${error.reasons.join("، ")}` };
    console.error("adminDeleteStoreAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء الحذف ومتمسحش حاجة" };
  }

  await detachDomains([store.customDomain]);
  logSecurityEvent({
    event: "STORE_DELETED",
    userId: admin.id,
    metadata: { storeId: store.id, slug: store.slug, name: store.name, ownerId: store.userId },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `اتحذف متجر «${store.name}» نهائيًا` };
}

/** Permanently deletes an account and its stores. `confirmEmail` must match. */
export async function adminDeleteUserAction(userId: string, confirmEmail: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return { success: false, message: "الحساب مش موجود" };
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { success: false, message: "البريد اللي كتبته مش مطابق" };

  const check = await getUserDeletionCheck(user.id, admin.id);
  if (check.blockers.length) return { success: false, message: `مينفعش يتحذف: ${check.blockers.join("، ")}` };

  try {
    await prisma.$transaction(async (tx) => {
      for (const store of check.stores) {
        const blockers = await getStoreDeletionBlockers(store.id, tx);
        if (blockers.length) throw new BlockedError([`متجر «${store.name}»: ${blockers.join("، ")}`]);
      }
      await deleteUserTree(
        tx,
        user.id,
        check.stores.map((s) => s.id),
      );
    }, TX_OPTIONS);
  } catch (error) {
    if (error instanceof BlockedError) return { success: false, message: `مينفعش يتحذف: ${error.reasons.join("، ")}` };
    console.error("adminDeleteUserAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء الحذف ومتمسحش حاجة" };
  }

  await detachDomains(check.stores.map((s) => s.customDomain));
  logSecurityEvent({
    event: "ACCOUNT_DELETED",
    userId: admin.id,
    metadata: { deletedUserId: user.id, email: user.email, stores: check.stores.map((s) => s.slug).join(",") || null },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `اتحذف الحساب ${user.email} نهائيًا` };
}

class BlockedError extends Error {
  constructor(public reasons: string[]) {
    super("blocked");
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { deleteStoreTree, deleteUserTree, getMoneySnapshot, getStoreDeletionBlockers, getUserDeletionCheck } from "@/lib/admin/deletion";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { collectStoreMedia, queueMediaPurge } from "@/lib/cloudinary/cleanup";
import { removeProjectDomain, vercelConfigured } from "@/lib/custom-domain/vercel";

type ActionResult = { success: boolean; message: string };

// Deleting hundreds of rows over a remote connection can exceed Prisma's 5s default.
const TX_OPTIONS = { timeout: 60_000, maxWait: 10_000 };

const FORCE_DENIED: ActionResult = { success: false, message: "الحذف الإجباري متاح للسوبر أدمن بس" };

/** Best effort: the store is already gone, a stale Vercel domain must not fail the action. */
async function detachDomains(domains: (string | null)[]) {
  if (!vercelConfigured) return;
  await Promise.all(
    [...new Set(domains.filter((d): d is string => !!d))].map((d) =>
      removeProjectDomain(d).catch((e) => console.error("[admin-delete] domain", d, e)),
    ),
  );
}

/** Domains bought through Casho for these stores (detached from the project with the store). */
async function registeredDomains(storeIds: string[]) {
  const rows = await prisma.domainRegistration.findMany({ where: { storeId: { in: storeIds } }, select: { domain: true } });
  return rows.map((r) => r.domain);
}

/**
 * Permanently deletes a store. `confirmSlug` must match. An admin is refused a
 * store with money history; a super admin always deletes past it (the role
 * decides, not a flag from the page), after logging a summary of that history.
 * `force` from a plain admin is refused outright.
 */
export async function adminDeleteStoreAction(storeId: string, confirmSlug: string, force = false): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (force && admin.role !== UserRole.SUPER_ADMIN) return FORCE_DENIED;
  const forced = admin.role === UserRole.SUPER_ADMIN;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true, slug: true, customDomain: true, userId: true },
  });
  if (!store) return { success: false, message: "المتجر مش موجود" };
  if (confirmSlug.trim() !== store.slug) return { success: false, message: "رابط المتجر اللي كتبته مش مطابق" };

  // Read before the rows go: the URLs are the only link from a file to its store.
  const [media, boughtDomains, money] = await Promise.all([
    collectStoreMedia([store.id]),
    registeredDomains([store.id]),
    forced ? getMoneySnapshot([store.id]) : null,
  ]);

  try {
    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: a top-up could have landed since the page loaded.
      if (!forced) {
        const blockers = await getStoreDeletionBlockers(store.id, tx);
        if (blockers.length) throw new BlockedError(blockers);
      }
      await deleteStoreTree(tx, store.id);
    }, TX_OPTIONS);
  } catch (error) {
    if (error instanceof BlockedError) return { success: false, message: `مينفعش يتحذف: ${error.reasons.join("، ")}` };
    console.error("adminDeleteStoreAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء الحذف ومتمسحش حاجة" };
  }

  await detachDomains([store.customDomain, ...boughtDomains]);
  queueMediaPurge(media);
  logSecurityEvent({
    event: "STORE_DELETED",
    userId: admin.id,
    metadata: {
      storeId: store.id,
      slug: store.slug,
      name: store.name,
      ownerId: store.userId,
      mediaFiles: media.length,
      forced,
      ...money,
    },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `اتحذف متجر «${store.name}» نهائيًا` };
}

/**
 * Permanently deletes an account and its stores. `confirmEmail` must match.
 * A super admin always goes past money / work history (the role decides, not a
 * flag from the page), never past the hard blockers (yourself, an admin, a
 * sales rep). `force` from a plain admin is refused outright.
 */
export async function adminDeleteUserAction(userId: string, confirmEmail: string, force = false): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (force && admin.role !== UserRole.SUPER_ADMIN) return FORCE_DENIED;
  const forced = admin.role === UserRole.SUPER_ADMIN;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return { success: false, message: "الحساب مش موجود" };
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { success: false, message: "البريد اللي كتبته مش مطابق" };

  const check = await getUserDeletionCheck(user.id, admin.id);
  const refusing = forced ? check.hardBlockers : [...check.hardBlockers, ...check.blockers];
  if (refusing.length) return { success: false, message: `مينفعش يتحذف: ${refusing.join("، ")}` };

  const storeIds = check.stores.map((s) => s.id);
  const [media, boughtDomains, money] = await Promise.all([
    collectStoreMedia(storeIds),
    registeredDomains(storeIds),
    forced ? getMoneySnapshot(storeIds, user.id) : null,
  ]);

  try {
    await prisma.$transaction(async (tx) => {
      if (!forced) {
        for (const store of check.stores) {
          const blockers = await getStoreDeletionBlockers(store.id, tx);
          if (blockers.length) throw new BlockedError([`متجر «${store.name}»: ${blockers.join("، ")}`]);
        }
      }
      await deleteUserTree(tx, user.id);
    }, TX_OPTIONS);
  } catch (error) {
    if (error instanceof BlockedError) return { success: false, message: `مينفعش يتحذف: ${error.reasons.join("، ")}` };
    console.error("adminDeleteUserAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء الحذف ومتمسحش حاجة" };
  }

  await detachDomains([...check.stores.map((s) => s.customDomain), ...boughtDomains]);
  queueMediaPurge(media);
  logSecurityEvent({
    event: "ACCOUNT_DELETED",
    userId: admin.id,
    metadata: {
      deletedUserId: user.id,
      email: user.email,
      stores: check.stores.map((s) => s.slug).join(",") || null,
      mediaFiles: media.length,
      forced,
      ...money,
    },
  });

  revalidatePath("/admin", "layout");
  return { success: true, message: `اتحذف الحساب ${user.email} نهائيًا` };
}

class BlockedError extends Error {
  constructor(public reasons: string[]) {
    super("blocked");
  }
}

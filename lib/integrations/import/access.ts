import { prisma } from "@/lib/prisma";
import { requireStoreContext, type StoreContext } from "@/lib/store/store-guard";
import { hasPermission } from "@/lib/store/permissions";

/**
 * Connecting an external store and importing into Casho is an owner-level
 * action (same permission as store settings): it stores third-party
 * credentials and creates products, customers and orders in bulk.
 */
export const IMPORT_PERMISSION = "manage_settings" as const;

export class ImportAccessError extends Error {
  constructor() {
    super("غير مصرح لك بإدارة الاستيراد في هذا المتجر");
    this.name = "ImportAccessError";
  }
}

export function canManageImports(ctx: Pick<StoreContext, "isOwner" | "role">) {
  return ctx.isOwner || hasPermission(ctx.role, IMPORT_PERMISSION);
}

/** Store context of the current user, or throws when they may not manage imports. */
export async function requireImportAccess(): Promise<StoreContext> {
  const ctx = await requireStoreContext();
  if (!canManageImports(ctx)) throw new ImportAccessError();
  return ctx;
}

/** Same check for an explicit (user, store) pair — used by the OAuth callback. */
export async function userCanManageImports(userId: string, storeId: string) {
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { userId: true } });
  if (!store) return false;
  if (store.userId === userId) return true;
  const member = await prisma.storeMember.findUnique({
    where: { userId_storeId: { userId, storeId } },
    select: { role: true },
  });
  return !!member && canManageImports({ isOwner: false, role: member.role });
}

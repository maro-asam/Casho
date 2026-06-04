import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission, type StorePermission } from "./permissions";

export type StoreContext = {
  userId: string;
  storeId: string;
  role: import("@prisma/client").StoreRole;
  isOwner: boolean;
};

/**
 * Finds the store the current user owns or is a member of.
 * Returns the store ID + the user's role in that store.
 * Redirects to /login if unauthenticated, /dashboard if no store access.
 */
export async function requireStoreContext(): Promise<StoreContext> {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Primary check: owned store
  const ownedStore = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (ownedStore) {
    return { userId, storeId: ownedStore.id, role: "STORE_OWNER", isOwner: true };
  }

  // Secondary check: store membership
  const membership = await prisma.storeMember.findFirst({
    where: { userId },
    select: { storeId: true, role: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membership) {
    return {
      userId,
      storeId: membership.storeId,
      role: membership.role,
      isOwner: false,
    };
  }

  redirect("/dashboard");
}

/**
 * Requires the current user to have a specific permission in a store.
 * Checks ownership first (Store.userId), then StoreMember.
 */
export async function requireStorePermission(
  storeId: string,
  permission: StorePermission,
): Promise<StoreContext> {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, userId: true },
  });

  if (!store) redirect("/dashboard");

  if (store.userId === userId) {
    return { userId, storeId, role: "STORE_OWNER", isOwner: true };
  }

  const membership = await prisma.storeMember.findUnique({
    where: { userId_storeId: { userId, storeId } },
    select: { role: true },
  });

  if (!membership || !hasPermission(membership.role, permission)) {
    redirect("/dashboard");
  }

  return { userId, storeId, role: membership.role, isOwner: false };
}

/**
 * Returns the store context without redirecting — useful for conditional UI.
 * Returns null if the user has no access to this store.
 */
export async function getStoreMembership(
  storeId: string,
): Promise<StoreContext | null> {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const userId = session.user.id;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { userId: true },
  });

  if (!store) return null;

  if (store.userId === userId) {
    return { userId, storeId, role: "STORE_OWNER", isOwner: true };
  }

  const membership = await prisma.storeMember.findUnique({
    where: { userId_storeId: { userId, storeId } },
    select: { role: true },
  });

  if (!membership) return null;

  return { userId, storeId, role: membership.role, isOwner: false };
}

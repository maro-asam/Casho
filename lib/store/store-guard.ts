import { cookies } from "next/headers";
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
 * The store the user picked to work in (an employee also owns the store created at
 * sign-up). Only a preference — it is re-validated against ownership/membership.
 */
export const ACTIVE_STORE_COOKIE = "activeStore";

/**
 * Finds the store the current user owns or is a member of — the picked store
 * first when the user still has access to it.
 * Returns the store ID + the user's role in that store.
 * Redirects to /login if unauthenticated, /dashboard if no store access.
 */
export async function requireStoreContext({ usePicked = false }: { usePicked?: boolean } = {}): Promise<StoreContext> {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Only the POS follows the picked store; the dashboard is always the user's own store.
  const picked = usePicked ? (await cookies()).get(ACTIVE_STORE_COOKIE)?.value : undefined;
  if (picked) {
    const ctx = await resolveStoreAccess(userId, picked);
    if (ctx) return ctx;
  }

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

async function resolveStoreAccess(userId: string, storeId: string): Promise<StoreContext | null> {
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { userId: true } });
  if (!store) return null;
  if (store.userId === userId) return { userId, storeId, role: "STORE_OWNER", isOwner: true };
  const membership = await prisma.storeMember.findUnique({
    where: { userId_storeId: { userId, storeId } },
    select: { role: true },
  });
  return membership ? { userId, storeId, role: membership.role, isOwner: false } : null;
}

/** Stores the current user can work in (owned first, then memberships). */
export async function listUserStores(userId: string) {
  const [owned, memberships] = await Promise.all([
    prisma.store.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    prisma.storeMember.findMany({
      where: { userId },
      select: { role: true, store: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);
  return [
    ...owned.map((s) => ({ ...s, isOwner: true })),
    ...memberships.filter((m) => !owned.some((o) => o.id === m.store.id)).map((m) => ({ ...m.store, isOwner: false })),
  ];
}

export async function canUseStore(userId: string, storeId: string) {
  return (await resolveStoreAccess(userId, storeId)) !== null;
}

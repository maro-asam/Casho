"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { EnsureGuestSessionId, GetGuestSessionId } from "@/actions/session/guest.actions";

export async function MustSession() {
  const guestSessionId = await EnsureGuestSessionId();

  return {
    guestSessionId,
  };
}

export async function ReadSession() {
  const guestSessionId = await GetGuestSessionId();

  return {
    guestSessionId,
  };
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * The account chip on the marketing navbar. Fetched from the browser so the
 * marketing pages don't read the session cookie and can be served from cache.
 */
export async function GetNavbarUserAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const store = user.stores?.[0];
    return { email: user.email, storeName: store?.name ?? null, storeSlug: store?.slug ?? null };
  } catch {
    return null;
  }
}

export async function MustOwnStore(storeId: string, userId: string) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!store) {
    throw new Error("غير مصرح لك بالوصول إلى هذا المتجر");
  }

  return store;
}
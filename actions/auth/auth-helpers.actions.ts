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
import { prisma } from "@/lib/prisma";
import { EnsureGuestSessionId, GetGuestSessionId } from "./guest.actions";
import { cookies } from "next/headers";

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

export async function MustOwnStore(storeId: string, userId: string) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },

    select: {
      id: true,
      slug: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return store;
}

export async function getCurrentUser() {
  const sessionToken = (await cookies()).get("sessionToken")?.value;

  if (!sessionToken) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionToken },
    select: {
      id: true,
      email: true,
      stores: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: 1,
      },
    },
  });

  return user;
}

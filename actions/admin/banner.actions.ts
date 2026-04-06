"use server";

import { MustOwnStore } from "../auth/auth-helpers.actions";
import { requireUserId } from "../auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function CreateBannerAction(
  storeId: string,
  title: string,
  image: string,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  await prisma.banner.create({
    data: {
      storeId,
      title,
      image,
    },
  });

  revalidatePath(`/dashboard/banners`);
  revalidatePath(`/store/${store.slug}`);

  return {
    success: true,
  };
}

export async function GetBannersAction(storeId: string) {
  return await prisma.banner.findMany({
    where: {
      storeId,
    },

    orderBy: { createdAt: "desc" },

    select: {
      id: true,
      title: true,
      image: true,
      createdAt: true,
      isActive: true,
    },
  });
}

export async function DeleteBannerAction(bannerId: string, storeId: string) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  await prisma.banner.delete({
    where: {
      id: bannerId,
      storeId,
    },
  });

  revalidatePath(`/dashboard/banners`);
  revalidatePath(`/store/${store.slug}`);

  return { success: true };
}

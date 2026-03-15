"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function ActivateStoreAction() {
  const userId = (await cookies()).get("sessionToken")?.value;

  const store = await prisma.store.findFirst({
    where: { userId },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  await prisma.store.update({
    where: { id: store.id },
    data: {
      subscriptionStatus: "active",
    },
  });

  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

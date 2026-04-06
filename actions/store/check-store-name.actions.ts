"use server";

import { prisma } from "@/lib/prisma";
import { normalizeStoreSlug } from "@/lib/store/slug";

export type StoreNameAvailabilityResult = {
  success: boolean;
  available: boolean;
  normalizedSlug: string;
  suggestedSlug: string;
  message: string;
};

function generateCandidates(baseSlug: string, count = 6) {
  const set = new Set<string>();

  for (let i = 0; i < count; i++) {
    const random = Math.random().toString(36).slice(2, 6);
    set.add(`${baseSlug}-${random}`);
  }

  return Array.from(set);
}

export async function CheckStoreNameAvailabilityAction(
  storeId: string,
  storeName: string,
): Promise<StoreNameAvailabilityResult> {
  const trimmedName = storeName.trim();

  if (!trimmedName) {
    return {
      success: false,
      available: false,
      normalizedSlug: "",
      suggestedSlug: "",
      message: "",
    };
  }

  const normalizedSlug = normalizeStoreSlug(trimmedName);

  if (!normalizedSlug) {
    return {
      success: false,
      available: false,
      normalizedSlug: "",
      suggestedSlug: "",
      message: "اسم المتجر غير صالح",
    };
  }

  const currentStore = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!currentStore) {
    return {
      success: false,
      available: false,
      normalizedSlug,
      suggestedSlug: "",
      message: "المتجر غير موجود",
    };
  }

  if (currentStore.slug === normalizedSlug) {
    return {
      success: true,
      available: true,
      normalizedSlug,
      suggestedSlug: normalizedSlug,
      message: "ده نفس رابط متجرك الحالي",
    };
  }

  const existingStore = await prisma.store.findFirst({
    where: {
      id: { not: storeId },
      slug: normalizedSlug,
    },
    select: {
      id: true,
    },
  });

  if (!existingStore) {
    return {
      success: true,
      available: true,
      normalizedSlug,
      suggestedSlug: normalizedSlug,
      message: "الاسم متاح",
    };
  }

  const candidates = generateCandidates(normalizedSlug);

  const takenCandidates = await prisma.store.findMany({
    where: {
      id: { not: storeId },
      slug: {
        in: candidates,
      },
    },
    select: {
      slug: true,
    },
  });

  const takenSet = new Set(takenCandidates.map((item) => item.slug));

  const suggestedSlug =
    candidates.find((item) => !takenSet.has(item)) ??
    `${normalizedSlug}-${crypto.randomUUID().slice(0, 6)}`;

  return {
    success: true,
    available: false,
    normalizedSlug,
    suggestedSlug,
    message: "الاسم مستخدم بالفعل",
  };
}
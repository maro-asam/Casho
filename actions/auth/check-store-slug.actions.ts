"use server";

import { prisma } from "@/lib/prisma";
import { normalizeStoreSlug } from "@/lib/store/slug";

export type StoreSlugAvailabilityState = {
  success: boolean;
  input: string;
  normalizedSlug: string;
  available: boolean;
  suggestedSlug: string;
  message: string;
};

function generateSlugCandidates(baseSlug: string, count = 3) {
  const set = new Set<string>();

  for (let i = 0; i < count; i++) {
    const random = Math.random().toString(36).slice(2, 6);
    set.add(`${baseSlug}-${random}`);
  }

  return Array.from(set);
}

export async function checkStoreSlugAvailability(
  storeName: string,
): Promise<StoreSlugAvailabilityState> {
  const input = storeName?.trim() ?? "";

  if (!input) {
    return {
      success: false,
      input,
      normalizedSlug: "",
      available: false,
      suggestedSlug: "",
      message: "",
    };
  }

  const normalizedSlug = normalizeStoreSlug(input);

  if (!normalizedSlug) {
    return {
      success: false,
      input,
      normalizedSlug: "",
      available: false,
      suggestedSlug: "",
      message: "اسم المتجر غير صالح",
    };
  }

  const existing = await prisma.store.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });

  if (!existing) {
    return {
      success: true,
      input,
      normalizedSlug,
      available: true,
      suggestedSlug: normalizedSlug,
      message: "الاسم متاح",
    };
  }

  const candidates = generateSlugCandidates(normalizedSlug, 5);

  const existingCandidates = await prisma.store.findMany({
    where: {
      slug: {
        in: candidates,
      },
    },
    select: {
      slug: true,
    },
  });

  const takenSet = new Set(existingCandidates.map((item) => item.slug));
  const availableSuggestion =
    candidates.find((item) => !takenSet.has(item)) ??
    `${normalizedSlug}-${crypto.randomUUID().slice(0, 6)}`;

  return {
    success: true,
    input,
    normalizedSlug,
    available: false,
    suggestedSlug: availableSuggestion,
    message: "الاسم مستخدم بالفعل",
  };
}
"use server";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  generateMarketingContent,
  type MarketingContent,
  type MarketingResult,
} from "@/lib/ai/marketing-assistant";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export type GenerateMarketingResult =
  | { ok: true;  content: MarketingContent }
  | { ok: false; error: string };

/**
 * Server action — generates marketing content for one of the merchant's products.
 *
 * @param productId  The product to generate for. Must belong to the caller's store.
 */
export async function generateMarketingAction(
  productId: string,
): Promise<GenerateMarketingResult> {
  if (!featureFlags.aiMarketingAssistant()) {
    return { ok: false, error: "هذه الميزة غير متاحة حالياً" };
  }

  const userId = await requireUserId();

  // Fetch product + category name, verify ownership
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      store: { userId },
    },
    select: {
      id:          true,
      name:        true,
      description: true,
      price:       true,
      category:    { select: { name: true } },
    },
  });

  if (!product) {
    return { ok: false, error: "المنتج غير موجود أو غير مصرح لك بالوصول إليه" };
  }

  const result: MarketingResult = await generateMarketingContent(
    {
      title:         product.name,
      description:   product.description,
      pricePiasters: product.price,
      categoryName:  product.category.name,
    },
    product.id,
  );

  return result;
}

/**
 * Lightweight variant — accepts raw product data directly.
 * Used right after product creation before DB round-trip is needed.
 */
export async function generateMarketingFromDataAction(input: {
  title:         string;
  description:   string | null;
  pricePiasters: number;
  categoryName:  string;
}): Promise<GenerateMarketingResult> {
  if (!featureFlags.aiMarketingAssistant()) {
    return { ok: false, error: "هذه الميزة غير متاحة حالياً" };
  }

  // Auth check — must be a logged-in merchant
  await requireUserId();

  const result: MarketingResult = await generateMarketingContent({
    title:         input.title,
    description:   input.description,
    pricePiasters: input.pricePiasters,
    categoryName:  input.categoryName,
  });

  return result;
}
